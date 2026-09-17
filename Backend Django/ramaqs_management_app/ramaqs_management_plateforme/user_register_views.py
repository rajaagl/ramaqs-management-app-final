# ramaqs_management_plateforme/user_register_views.py

import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import Utilisateur
from .serializers import UtilisateurSerializer
from .services.notification_service import NotificationService
from .services.email_service import EmailService
from .services.whatsapp_service import WhatsAppService
from django.conf import settings
from .permissions import is_direction

# ✅ Configuration du logger
logger = logging.getLogger(__name__)




class UserRegisterView(generics.CreateAPIView):
    """
    Vue pour l'inscription de TOUS les utilisateurs (sauf direction).
    Tous les comptes sont créés avec statut 'pending' et doivent être approuvés.
    """
    serializer_class = UtilisateurSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        
        
        email = request.data.get('email')
        role = request.data.get('role')
        nom = request.data.get('nom')
        password = request.data.get('password')  #  Récupérer mot de passe
        
        
        
        
        
        
        # 1️⃣ Vérifie si l'email existe déjà
        if Utilisateur.objects.filter(email=email).exists():
            
            return Response(
                {'error': 'Cet email est déjà utilisé'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 2️⃣ Vérifie que le rôle est valide
        roles_avec_approbation = ['chef_projet', 'consultant', 'partenaire', 'client']
        if role not in roles_avec_approbation:
            
            return Response(
                {'error': f'Rôle non valide. Les rôles autorisés sont: {", ".join(roles_avec_approbation)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not password:
            return Response({'error': 'Le mot de passe est requis'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(password)
        except ValidationError as exc:
            return Response({'error': list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
        
       
        
       
        user_data = {
            'username': email,
            'email': email,
            'nom': nom,
            'telephone': request.data.get('telephone', ''),
            'entreprise': request.data.get('entreprise', ''),
            'poste': request.data.get('poste', ''),
            'role': role,
            'statut_approbation': 'pending',    
            'is_active': False,                  
        }
        
        
        
        # 4️⃣ Crée l'utilisateur dans la base de données
        try:
            serializer = self.get_serializer(data=user_data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
           
        except Exception as e:
            
            return Response(
                {'error': f'Erreur lors de la création: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ✅ Stocker le mot de passe choisi par l'utilisateur
        if password:
            user.set_password(password)
            user.save()
        

        user.role = role
        user.statut_approbation = 'pending'
        user.is_active = False
        user.save(update_fields=['role', 'statut_approbation', 'is_active'])
       
       
       
     
        direction_users = Utilisateur.objects.filter(role='direction')
        logger.info(f" Direction users trouvés: {direction_users.count()}")
        
        
        role_labels = {
            'chef_projet': 'Chef de projet',
            'consultant': 'Consultant',
            'partenaire': 'Partenaire',
            'client': 'Client'
        }
        
        for admin in direction_users:
            try:
                NotificationService.creer_notification(
                    utilisateur=admin,
                    titre=f" Nouvelle inscription - {role_labels.get(role, role)}",
                    message=f"{role_labels.get(role, role)} '{user.nom}' ({user.email}) demande à rejoindre la plateforme.",
                    type_notif='attention',
                    lien_action=f"/app/utilisateurs/{user.id}",
                    entite_id=str(user.id),
                    entite_type='user'
                )
                logger.info(f" Notification envoyée à: {admin.email}")
            except Exception as e:
                logger.error(f"Erreur envoi notification à {admin.email}: {str(e)}")
        
        
        
        return Response({
            'message': f'Votre demande a été envoyée. Un administrateur va valider votre compte.',
            'user_id': str(user.id),
            'statut': 'pending'
        }, status=status.HTTP_201_CREATED)


class UserApproveRejectView(generics.UpdateAPIView):
    """
    Vue pour approuver ou rejeter un utilisateur (Direction uniquement).
    Gère tous les rôles : chef_projet, consultant, partenaire, client.
    """
    queryset = Utilisateur.objects.exclude(role__in=['direction', 'super_admin'])
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        logger.info(f" [UserApproveRejectView] get_queryset appelé")
        qs = Utilisateur.objects.exclude(role__in=['direction', 'super_admin'])
        logger.info(f" Queryset count: {qs.count()}")
        return qs
    
    def update(self, request, *args, **kwargs):
        
        
        user = self.get_object()
        action = request.data.get('action')
        justification = request.data.get('justification', '')
        
        logger.info(f"Traitement de l'utilisateur: {user.email} (role: {user.role})")
        logger.info(f"Action demandée: {action}")
        
        
        if not is_direction(request.user):
            logger.warning(f"Utilisateur non autorisé: {request.user.role}")
            return Response(
                {'error': 'Vous n\'avez pas les droits pour cette action'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        
        if action == 'approve':
            logger.info(" Action: APPROUVER")
            return self._approve_user(user, request.user)
        elif action == 'reject':
            logger.info(" Action: REJETER")
            return self._reject_user(user, request.user, justification)
        else:
            logger.warning(f"⚠️ Action non valide: {action}")
            return Response(
                {'error': 'Action non valide. Utilisez "approve" ou "reject"'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _approve_user(self, user, admin_user):
        logger.info(f" [Approve] Début approbation de {user.email}")
        
        # Met à jour le statut de l'utilisateur
        user.statut_approbation = 'approved'
        user.date_approbation = timezone.now()
        user.approuve_par = admin_user
        user.is_active = True  
        user.actif = True  
        user.doit_changer_mot_de_passe = False
        user.save()
        
        logger.info(f"Utilisateur mis à jour: statut=approved, is_active=True")
        
        # Mapping des rôles pour l'affichage
        role_labels = {
            'chef_projet': 'Chef de projet',
            'consultant': 'Consultant',
            'partenaire': 'Partenaire',
            'client': 'Client'
        }
        role_label = role_labels.get(user.role, user.role)
    
        try:
            EmailService.send_approval_email(user, role_label)
            logger.info(f"Email d'approbation envoyé à {user.email}")
        except Exception as e:
            logger.error(f"Erreur envoi email: {str(e)}")
        
       
        try:
            NotificationService.creer_notification(
                utilisateur=user,
                titre=" Votre compte a été approuvé",
                message=f"Votre compte {role_label} a été approuvé par {admin_user.nom}. Vous pouvez maintenant vous connecter.",
                type_notif='succes',
                lien_action="/login",
                entite_id=str(user.id),
                entite_type='user'
            )
            logger.info(f" Notification envoyée à l'utilisateur")
        except Exception as e:
            logger.error(f"Erreur notification utilisateur: {str(e)}")

        
       
        try:
            NotificationService.creer_notification(
                utilisateur=admin_user,
                titre=f" {role_label} approuvé - {user.nom}",
                message=f"Le compte {role_label} '{user.nom}' a été approuvé avec succès.",
                type_notif='succes',
                lien_action=f"/app/utilisateurs/{user.id}",
                entite_id=str(user.id),
                entite_type='user'
            )
            logger.info(f" Notification envoyée à l'admin")
        except Exception as e:
            logger.error(f" Erreur notification admin: {str(e)}")
        
        
        
        
        
        return Response({
            'success': True,
            'message': f'{role_label} {user.nom} approuvé avec succès'
        })
    
    def _reject_user(self, user, admin_user, justification):
        logger.info(f"[Reject] Début rejet de {user.email}")
        logger.info(f" Justification: {justification}")
        
        if not justification:
            logger.warning("⚠️ Justification manquante")
            return Response({
                'error': 'La justification est requise pour le rejet'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mapping des rôles pour l'affichage
        role_labels = {
            'chef_projet': 'Chef de projet',
            'consultant': 'Consultant',
            'partenaire': 'Partenaire',
            'client': 'Client'
        }
        role_label = role_labels.get(user.role, user.role)
        
        user.statut_approbation = 'rejected'
        user.justification_rejet = justification
        user.is_active = False
        user.save()
        
        logger.info(f"Utilisateur mis à jour: statut=rejected, is_active=False")
        
        
        try:
            EmailService.send_rejection_email(user, justification, role_label)
            logger.info(f"Email de rejet envoyé à {user.email}")
        except Exception as e:
            logger.error(f"Erreur envoi email: {str(e)}")
        
       
        try:
            NotificationService.creer_notification(
                utilisateur=admin_user,
                titre=f"{role_label} rejeté - {user.nom}",
                message=f"Le compte {role_label} '{user.nom}' a été rejeté. Motif : {justification[:100]}",
                type_notif='attention',
                lien_action=f"/app/utilisateurs/{user.id}",
                entite_id=str(user.id),
                entite_type='user'
            )
            logger.info(f"Notification envoyée à l'admin")
        except Exception as e:
            logger.error(f"Erreur notification: {str(e)}")
        
        
       
        
        
    
        if getattr(settings, 'WHATSAPP_ENABLED', True):
            try:
                whatsapp = WhatsAppService()
                whatsapp.send_rejection_notification(user, justification, role_label)
                logger.info(f" WhatsApp rejet envoyé à {user.telephone}")
            except Exception as e:
                logger.error(f"Erreur WhatsApp: {str(e)}")


        return Response({
            'success': True,
            'message': f'{role_label} {user.nom} rejeté'
        })


class UserListView(generics.ListAPIView):
    """
    Liste des utilisateurs en attente d'approbation (Direction uniquement)
    """
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        logger.info(f" [UserListView] Utilisateur connecté: {user.email} (role: {user.role})")
        
        # Seule la direction peut voir cette liste
        if not (user.is_superuser or user.role in {'super_admin', 'direction'}):
            logger.warning(f" Accès refusé: {user.role} n'est pas direction")
            return Utilisateur.objects.none()
        
        # Exclut la direction elle-même
        queryset = Utilisateur.objects.exclude(
            role='direction'
        ).order_by('-date_creation')
        
        logger.info(f" Queryset count: {queryset.count()}")
        return queryset
    
    def list(self, request, *args, **kwargs):
        logger.info("[UserListView.list] Début")
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Ajoute les statistiques par rôle
        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(statut_approbation='pending').count(),
            'approved': queryset.filter(statut_approbation='approved').count(),
            'rejected': queryset.filter(statut_approbation='rejected').count(),
            'par_role': {
                'chef_projet': queryset.filter(role='chef_projet').count(),
                'consultant': queryset.filter(role='consultant').count(),
                'partenaire': queryset.filter(role='partenaire').count(),
                'client': queryset.filter(role='client').count(),
            }
        }
        
        logger.info(f"📊 Statistiques: {stats}")
        
        return Response({
            'results': serializer.data,
            'stats': stats
        })
