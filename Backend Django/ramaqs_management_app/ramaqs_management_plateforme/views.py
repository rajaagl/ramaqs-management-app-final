from datetime import datetime, date
import threading
import channels
import channels
from django.shortcuts import render
from .permissions import IsTenantAuthenticated, IsTenantMember, IsTenantAdmin
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, generics
from rest_framework.decorators import action
from rest_framework.response import Response
import logging
from rest_framework.views import APIView
from .services.whatsapp_service import WhatsAppService
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import secrets
from datetime import timedelta
from .models import Utilisateur, PasswordResetToken
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend  
from rest_framework import filters
from django.db import models  
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
from rest_framework import generics
from .models import Utilisateur
from .serializers import ConsultantSerializer
# pour la gestion des fichiers Excel
import openpyxl
from rest_framework.parsers import MultiPartParser
from .models import Projet, Utilisateur
from django.utils.dateparse import parse_date
from rest_framework import generics
from rest_framework.response import Response
from .models import Tache

logger = logging.getLogger(__name__)
from .models import (
    Projet, RoleChoices, Tache, Consultant, Client, ChefProjet, 
    Partenaire, Direction, Ressource, SousTache, 
    Document, Commentaire, Notification, Conversation, 
    Kpi, Message, Budget, TenantMembership,
    Direction, ChefProjet, Consultant, Client, Partenaire, 
    Tenant, RoleChoices
)
from .serializers import (
    ProjetSerializer, TacheSerializer, 
    ConsultantSerializer, ClientSerializer,
    MessageSerializer,
    BudgetSerializer, ConversationSerializer,
    CommentaireSerializer, DirectionSerializer,
    DocumentSerializer, NotificationSerializer,
    PartenaireSerializer, RessourceSerializer,
    SousTacheSerializer, KpiSerializer,
    DirectionSerializer, ChefProjetSerializer, ConsultantSerializer, ClientSerializer, PartenaireSerializer, UtilisateurSerializer

)


# ========== VIEWSETS AVEC FILTRAGE TENANT ==========

class BaseTenantViewSet(viewsets.ModelViewSet):
    """
    ViewSet de base qui filtre automatiquement par tenant
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return self.queryset.all()
    
    def perform_create(self, serializer):
        """Assigne automatiquement le tenant à la création"""
        serializer.save(tenant=self.request.tenant)


class ProjetViewSet(BaseTenantViewSet):
    queryset = Projet.objects.all()
    serializer_class = ProjetSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Filtres exacts
    filterset_fields = {
        'statut': ['exact'],
        'priorite': ['exact'],
        'domaine': ['exact'],
        'avancement_globale': ['gte', 'lte'],
        'date_debut': ['gte', 'lte'],
        'date_fin_prevue': ['gte', 'lte'],
    }
    
    # Recherche texte
    search_fields = ['nom', 'description', 'code', 'client__nom']
    
    # Tri
    ordering_fields = ['nom', 'date_debut', 'date_fin_prevue', 'avancement_globale', 'budget']
    ordering = ['-date_debut']

    def get_queryset(self):
        user = self.request.user
       
       
        if user.role == 'direction':
            return Projet.objects.all()
        
        if user.role == 'chef_projet':
            return Projet.objects.filter(chef_projet=user).distinct()
       
        if user.role == 'partenaire':
            return Projet.objects.filter(partenaires=user).distinct()
        
        if user.role == 'consultant':
            return Projet.objects.filter(taches__consultant=user).distinct()

        if user.role == 'client':
            return Projet.objects.filter(client=user).distinct()

        return Projet.objects.none()

    @action(detail=True, methods=['get'], url_path='membres', permission_classes=[IsAuthenticated])
    def membres(self, request, pk=None):
        """
        GET /projets/<id>/membres/
        Retourne la liste de tous les membres de l'équipe projet
        (chefs de projet, consultants assignés aux tâches, partenaires, client).
        Réservé à la direction.
        """
        if request.user.role != 'direction':
            return Response(
                {'error': 'Accès réservé à la direction.'},
                status=status.HTTP_403_FORBIDDEN
            )

        projet = self.get_object()
        membres = {}

        # Client
        if projet.client:
            membres[str(projet.client.id)] = {
                'id': str(projet.client.id),
                'nom': projet.client.nom,
                'email': projet.client.email,
                'telephone': projet.client.telephone or '',
                'role': 'client',
            }

        # Chefs de projet (M2M)
        for chef in projet.chef_projet.all():
            membres[str(chef.id)] = {
                'id': str(chef.id),
                'nom': chef.nom,
                'email': chef.email,
                'telephone': chef.telephone or '',
                'role': 'chef_projet',
            }

        # Partenaires (M2M)
        for partenaire in projet.partenaires.all():
            membres[str(partenaire.id)] = {
                'id': str(partenaire.id),
                'nom': partenaire.nom,
                'email': partenaire.email,
                'telephone': partenaire.telephone or '',
                'role': 'partenaire',
            }

        # Consultants (via les tâches)
        for tache in projet.taches.filter(consultant__isnull=False).select_related('consultant'):
            c = tache.consultant
            membres[str(c.id)] = {
                'id': str(c.id),
                'nom': c.nom,
                'email': c.email,
                'telephone': c.telephone or '',
                'role': 'consultant',
            }

        return Response({
            'projet_id': str(projet.id),
            'projet_nom': projet.nom,
            'membres': list(membres.values()),
        })

class TacheViewSet(BaseTenantViewSet):
    queryset = Tache.objects.all()
    serializer_class = TacheSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = {
        'statut': ['exact'],
        'priorite': ['exact'],
        'avancement': ['gte', 'lte'],
        'date_fin_prevue': ['gte', 'lte', 'exact'],
        'consultant': ['exact'],
        'projet': ['exact'],
    }
    
    search_fields = ['titre', 'description']
    ordering_fields = ['date_fin_prevue', 'avancement', 'priorite']

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        user = self.request.user
        role = user.role
        queryset = Tache.objects.all()
        
        if role == 'direction':
            return queryset
        elif role == 'chef_projet':
            return queryset.filter(projet__chef_projet=user)
        elif role == 'partenaire':
            return queryset.filter(projet__partenaires=user)
        elif role == 'consultant':
            return queryset.filter(consultant=user)
        else:
            return queryset.none()
    
    def perform_destroy(self, instance):
        """Supprimer la tâche"""
        logger.info(f"Suppression de la tâche {instance.id} - {instance.titre}")
        
        # Vérification supplémentaire des permissions (optionnel)
        user = self.request.user
        tenant = self.request.tenant
        role = user.get_role_in_tenant(tenant) if hasattr(user, 'get_role_in_tenant') else None
        
        # Seuls direction et chef_projet peuvent supprimer
        if role not in ['direction', 'chef_projet']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'avez pas la permission de supprimer cette tâche")
        
        # Suppression réelle
        instance.delete()
        logger.info(f"Tâche {instance.id} supprimée avec succès")
    def update(self, request, *args, **kwargs):
        """Contrôle des permissions pour la mise à jour (drag & drop)"""
        user = request.user
        role = user.role
       
        print("[update] Données reçues du frontend:", dict(request.data))
        print("[update] Clés reçues:", list(request.data.keys()))
        print("[update] Rôle:", role)
        
        
        return super().update(request, *args, **kwargs)

    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Erreur lors de la suppression: {str(e)}")
            return Response(
                {'error': f'Erreur lors de la suppression: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

class ConsultantViewSet(BaseTenantViewSet):
    queryset = Consultant.objects.all()
    serializer_class = ConsultantSerializer


class ClientViewSet(BaseTenantViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer


class ChefProjetViewSet(BaseTenantViewSet):
    queryset = ChefProjet.objects.all()
    serializer_class = ChefProjetSerializer


class DirectionViewSet(BaseTenantViewSet):
    queryset = Direction.objects.all()
    serializer_class = DirectionSerializer


class PartenaireViewSet(BaseTenantViewSet):
    queryset = Partenaire.objects.all()
    serializer_class = PartenaireSerializer


class RessourceViewSet(BaseTenantViewSet):
    queryset = Ressource.objects.all()
    serializer_class = RessourceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    
    filterset_fields = {
        'type': ['exact'],
        'disponible': ['exact'],
        'cout_unitaire': ['gte', 'lte'],
        'projet': ['exact'],  # ← Filtre par projet
    }
    
    
    search_fields = ['nom', 'type']
    
    
    ordering_fields = ['nom',  'cout_unitaire', 'disponible']
    def get_queryset(self):
         return Ressource.objects.all()
        

        


class SousTacheViewSet(BaseTenantViewSet):
    queryset = SousTache.objects.all()
    serializer_class = SousTacheSerializer
    
#--------------------------------------doc----------------------------------------------------------



class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Document.objects.select_related('projet', 'uploaded_by')

        if user.role == 'direction':
            return qs
        if user.role == 'chef_projet':
            return qs.filter(projet__chef_projet=user)
        if user.role == 'consultant':
            projets_ids = Tache.objects.filter(consultant=user).values_list('projet_id', flat=True).distinct()
            return qs.filter(projet_id__in=projets_ids).filter(
                models.Q(type='livrable') | models.Q(uploaded_by=user)
            )
        if user.role == 'partenaire':
            return qs.filter(projet__partenaires=user).filter(
                models.Q(type='livrable') | models.Q(uploaded_by=user)
            )
        if user.role == 'client':
            return qs.filter(projet__client=user).filter(
                models.Q(type='livrable') | models.Q(uploaded_by=user)
            )
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        projet = serializer.validated_data.get('projet')

        if user.role == 'chef_projet' and not projet.chef_projet.filter(id=user.id).exists():
            raise PermissionDenied("Vous ne pouvez téléverser que sur vos propres projets.")
        if user.role == 'consultant' and not Tache.objects.filter(consultant=user, projet=projet).exists():
            raise PermissionDenied("Vous n'êtes assigné à aucune tâche sur ce projet.")
        if user.role == 'partenaire' and not projet.partenaires.filter(id=user.id).exists():
            raise PermissionDenied("Vous n'êtes pas partenaire sur ce projet.")
        if user.role == 'client' and projet.client_id != user.id:
            raise PermissionDenied("Ce projet n'est pas le vôtre.")

        document = serializer.save(uploaded_by=user)

        try:
            from .services.notification_service import NotificationService
            NotificationService.notifier_nouveau_document(document=document, utilisateur=user)
        except Exception as e:
            logger.error(f"[NOTIF] Erreur notification upload document: {e}")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        is_chef_owner = user.role == 'chef_projet' and instance.projet.chef_projet.filter(id=user.id).exists()
        if user.role != 'direction' and not is_chef_owner:
            return Response(
                {"detail": "Vous n'avez pas la permission de supprimer ce document."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


class CommentaireViewSet(BaseTenantViewSet):
    queryset = Commentaire.objects.all()
    serializer_class = CommentaireSerializer


class NotificationViewSet(BaseTenantViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer 
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        tenant = getattr(self.request, 'tenant', None)
        role = getattr(user, 'role', None)

        if tenant:
           base_qs = Notification.objects.filter(tenant=tenant, utilisateur=user)
        else:
           base_qs = Notification.objects.filter(utilisateur=user)


        if role == 'direction':
            return base_qs.order_by('-date_envoi')

        elif role == 'chef_projet':
            projets_ids = Projet.objects.filter(chef_projet=user).values_list('id', flat=True)
            qs = Notification.objects.filter(
              models.Q(utilisateur=user) |
              models.Q(projet__id__in=projets_ids)
            )
            if tenant:
               qs = qs.filter(tenant=tenant)
            return qs.distinct()

        else:
            return base_qs

    @action(detail=True, methods=['patch'], url_path='lire')
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.lue = True
        notification.save()
        return Response({'status': 'ok', 'lue': True})

    @action(detail=False, methods=['patch'], url_path='lire-tout')
    def mark_all_as_read(self, request):
        notifications = self.get_queryset().filter(lue=False)
        count = notifications.count()
        notifications.update(lue=True)
        return Response({'status': 'ok', 'count': count})

class ConversationViewSet(BaseTenantViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer


class MessageViewSet(BaseTenantViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer


class KpiViewSet(BaseTenantViewSet):
    queryset = Kpi.objects.all()
    serializer_class = KpiSerializer


class BudgetViewSet(BaseTenantViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer

class DirectionViewSet(BaseTenantViewSet):
    queryset = Direction.objects.all()
    serializer_class = DirectionSerializer  # À créer

class ChefProjetViewSet(BaseTenantViewSet):
    queryset = ChefProjet.objects.all()
    serializer_class = ChefProjetSerializer  # À créer
    
    def get_queryset(self):
        """
        Retourne uniquement les chefs de projet actifs et approuvés
        """
        return Utilisateur.objects.filter(
            role='chef_projet',
            is_active=True,
            statut_approbation='approved'
        ).order_by('nom')



class ConsultantListAPIView(generics.ListAPIView):
    serializer_class = ConsultantSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        
        tenant = getattr(self.request, 'tenant', None)
        return Utilisateur.objects.filter(
            role='consultant',
            memberships__tenant=tenant,
            is_active=True
        ).order_by('nom')


class ConsultantDetailAPIView(generics.RetrieveAPIView):
    serializer_class = ConsultantSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        tenant = getattr(self.request, 'tenant', None)
        return Utilisateur.objects.filter(
            role='consultant',
            memberships__tenant=tenant,
            is_active=True
        )

class ClientViewSet(BaseTenantViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer  # À créer
    def get_queryset(self):
        """
        Retourne uniquement les clients actifs
        """
        return Utilisateur.objects.filter(
            role='client',
            is_active=True
        ).order_by('nom')

class PartenaireViewSet(BaseTenantViewSet):
    queryset = Partenaire.objects.all()
    serializer_class = PartenaireSerializer  # À créer
    def get_queryset(self):
        """
        Retourne uniquement les partenaires actifs
        """
        return Utilisateur.objects.filter(
            role='partenaire',
            is_active=True
        ).order_by('nom')

class ProjetListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
      tenant = getattr(self.request, 'tenant', None)
      if tenant:
           return Projet.objects.filter(tenant=tenant)
      return Projet.objects.all()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# ========== INSCRIPTION ==========

class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  
    
    def post(self, request):
        print("Données reçues:", request.data)  # ← AJOUTEZ CE LOG
        email = request.data.get('email')
        nom = request.data.get('nom')
        password = request.data.get('password')
        role = request.data.get('role', 'consultant')
        telephone = request.data.get('telephone', '')
        entreprise = request.data.get('entreprise', '')
        poste = request.data.get('poste', '')
        
        # Vérifier si l'utilisateur existe déjà
        if Utilisateur.objects.filter(email=email).exists():
            return Response(
                {'error': 'Un compte existe déjà avec cet email'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer l'utilisateur
        user = Utilisateur.objects.create_user(
            username=email,
            email=email,
            password=password,
            nom=nom,
            telephone=telephone
        )
        
        # Ajouter les champs supplémentaires
        if entreprise:
            user.entreprise = entreprise
        if poste:
            user.poste = poste
        user.save()
        
        # Assigner au tenant par défaut
        tenant = Tenant.objects.first()
        if tenant:
            role_map = {
                'direction': RoleChoices.DIRECTION,
                'chef_projet': RoleChoices.CHEF_PROJET,
                'consultant': RoleChoices.CONSULTANT,
                'client': RoleChoices.CLIENT,
                'partenaire': RoleChoices.PARTENAIRE,
            }
            role_choice = role_map.get(role, RoleChoices.CONSULTANT)
            
            TenantMembership.objects.create(
                user=user,
                tenant=tenant,
                role=role_choice
            )
        
        return Response({
            'message': 'Utilisateur créé avec succès',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'nom': user.nom,
                'role': role
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    
# ========== MOT DE PASSE OUBLIÉ ==========

class ForgotPasswordView(APIView):
    """
    Réinitialisation du mot de passe :
    envoie le mot de passe temporaire par WhatsApp ET par email en parallèle.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email     = request.data.get('email')
        telephone = request.data.get('telephone')

        if not email or not telephone:
            return Response(
                {'error': 'Email et téléphone sont requis'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Sécurité : même réponse si l'utilisateur n'existe pas
        try:
            user = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return Response(
                {'message': 'Si un compte correspond, un nouveau mot de passe vous sera envoyé.'},
                status=status.HTTP_200_OK,
            )

        if user.telephone != telephone:
            return Response(
                {'message': 'Si un compte correspond, un nouveau mot de passe vous sera envoyé.'},
                status=status.HTTP_200_OK,
            )

        if user.statut_approbation != 'approved':
            return Response(
                {'error': 'Votre compte n\'a pas encore été approuvé. Veuillez contacter l\'administrateur.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                {'error': 'Votre compte est désactivé. Veuillez contacter l\'administrateur.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Générer le mot de passe temporaire
        temp_password = secrets.token_urlsafe(10)
        user.set_password(temp_password)
        user.doit_changer_mot_de_passe = True
        user.save()
        PasswordResetToken.objects.filter(user=user, used=False).delete()

        # ── Résultats partagés entre les threads ──────────────────────
        results = {'whatsapp': False, 'email': False}

        # ── Thread WhatsApp ───────────────────────────────────────────
        def send_whatsapp():
            if not getattr(settings, 'WHATSAPP_ENABLED', True) or not user.telephone:
                logger.warning('WhatsApp désactivé ou téléphone manquant.')
                return
            try:
                whatsapp = WhatsAppService()
                if whatsapp.send_temp_password(user, temp_password):
                    logger.info(f"[RESET] WhatsApp envoyé → {user.telephone}")
                    results['whatsapp'] = True
                else:
                    logger.error(f"[RESET] Échec WhatsApp → {user.telephone}")
            except Exception as e:
                logger.error(f"[RESET] Erreur WhatsApp : {e}")

        # ── Thread Email ──────────────────────────────────────────────
        def send_email():
            if not user.email:
                logger.warning('[RESET] Pas d\'email pour cet utilisateur.')
                return
            try:
                from django.core.mail import send_mail

                sujet = "🔐 RAMAQS — Votre mot de passe temporaire"
                corps_html = f"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px;
              padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

    <div style="text-align: center; margin-bottom: 24px;">
      <div style="background: #dc2626; color: white; font-size: 24px; font-weight: bold;
                  width: 48px; height: 48px; border-radius: 12px;
                  display: inline-flex; align-items: center; justify-content: center; line-height: 48px;">
        R
      </div>
      <h2 style="color: #111; margin-top: 16px;">RAMAQS Consulting</h2>
    </div>

    <p style="color: #374151;">Bonjour <strong>{user.nom}</strong>,</p>
    <p style="color: #374151;">
      Vous avez demandé la réinitialisation de votre mot de passe.
      Voici votre mot de passe temporaire :
    </p>

    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
                padding: 16px; text-align: center; margin: 24px 0;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">MOT DE PASSE TEMPORAIRE</p>
      <p style="font-size: 22px; font-weight: bold; color: #dc2626;
                letter-spacing: 3px; margin: 0; font-family: monospace;">
        {temp_password}
      </p>
    </div>

    <p style="color: #374151;">
      Connectez-vous avec ce mot de passe, puis changez-le immédiatement depuis votre profil.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="{settings.FRONTEND_URL}/login"
         style="background: #dc2626; color: white; padding: 12px 32px;
                border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        Se connecter
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.<br>
      © RAMAQS Consulting — {settings.COMPANY_NAME}
    </p>
  </div>
</body>
</html>"""

                corps_texte = (
                    f"Bonjour {user.nom},\n\n"
                    f"Votre mot de passe temporaire RAMAQS : {temp_password}\n\n"
                    f"Connectez-vous sur : {settings.FRONTEND_URL}/login\n"
                    f"puis changez votre mot de passe immédiatement.\n\n"
                    f"Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n"
                    f"© RAMAQS Consulting — {settings.COMPANY_NAME}"
                )

                sent = send_mail(
                    subject=sujet,
                    message=corps_texte,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    html_message=corps_html,
                    fail_silently=False,
                )
                if sent:
                    logger.info(f"[RESET] Email envoyé → {user.email}")
                    results['email'] = True
                else:
                    logger.error(f"[RESET] Échec email → {user.email}")
            except Exception as e:
                logger.error(f"[RESET] Erreur email : {e}")

        # ── Lancer les deux en parallèle et attendre ──────────────────
        t_ws    = threading.Thread(target=send_whatsapp, daemon=True)
        t_email = threading.Thread(target=send_email,    daemon=True)
        t_ws.start()
        t_email.start()
        t_ws.join(timeout=15)    # max 15 s pour WhatsApp
        t_email.join(timeout=15) # max 15 s pour l'email

        # ── Réponse finale ────────────────────────────────────────────
        channels = []
        if results['whatsapp']:
            channels.append('WhatsApp')
        if results['email']:
            channels.append('email')

        if channels:
            return Response(
                {
                    'message': f"Un mot de passe temporaire vous a été envoyé par {' et '.join(channels)}.",
                    'success': True,
                    'channels': channels,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {'error': 'Impossible d\'envoyer le mot de passe. Veuillez contacter l\'administrateur.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

class ValidateResetTokenView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response({'valid': False, 'error': 'Token requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            reset_token = PasswordResetToken.objects.get(token=token, used=False)
        except PasswordResetToken.DoesNotExist:
            return Response({'valid': False, 'error': 'Token invalide'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not reset_token.is_valid():
            return Response({'valid': False, 'error': 'Token expiré'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'valid': True,
            'email': reset_token.user.email
        }, status=status.HTTP_200_OK)




class ResetPasswordView(APIView):
    """
    Réinitialiser le mot de passe avec un token (après réception du mot de passe temporaire)
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        ancien_mot_de_passe = request.data.get('ancien_mot_de_passe')  # Optionnel: pour vérification
        
        
        if not token or not new_password or not confirm_password:
            return Response({
                'error': 'Tous les champs sont requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        
        if new_password != confirm_password:
            return Response({
                'error': 'Les mots de passe ne correspondent pas'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        
        if len(new_password) < 6:
            return Response({
                'error': 'Le mot de passe doit contenir au moins 6 caractères'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        
        try:
            reset_token = PasswordResetToken.objects.get(token=token, used=False)
        except PasswordResetToken.DoesNotExist:
            return Response({
                'error': 'Token invalide'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        
        if not reset_token.is_valid():
            return Response({
                'error': 'Token expiré'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        
        user = reset_token.user
        
        
        if ancien_mot_de_passe:
            if not user.check_password(ancien_mot_de_passe):
                return Response({
                    'error': 'Mot de passe actuel incorrect'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # 8️⃣ Réinitialiser le mot de passe
        user.set_password(new_password)
        user.doit_changer_mot_de_passe = False
        user.save()
        
        # 9️⃣ Marquer le token comme utilisé
        reset_token.used = True
        reset_token.save()
        
        # 🔟 Supprimer tous les autres tokens de cet utilisateur
        PasswordResetToken.objects.filter(user=user).exclude(id=reset_token.id).delete()
        
        # 📧 Optionnel: Envoyer une confirmation par WhatsApp/Email
        try:
           
            whatsapp = WhatsAppService()
            confirmation_message = f"""✅ *RAMAQS Consulting* - Mot de passe changé

Bonjour *{user.nom}*,

Votre mot de passe a été changé avec succès.

🔐 *Sécurité:*
   • Si vous n'êtes pas à l'origine de ce changement, contactez-nous immédiatement

🔗 *Se connecter:* {settings.FRONTEND_URL}/login

---
*RAMAQS Consulting* - Votre partenaire de confiance
"""
            whatsapp.send_message(user.telephone, confirmation_message)
            logger.info(f"Confirmation WhatsApp envoyée à {user.telephone}")
        except Exception as e:
            logger.warning(f"Erreur envoi confirmation WhatsApp: {str(e)}")
        
        return Response({
            'message': 'Mot de passe réinitialisé avec succès',
            'success': True
        }, status=status.HTTP_200_OK)


class ChefProjetConsultantsView(APIView):
    """Récupère tous les consultants d'un chef de projet pour un projet donné"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, projet_id):
        user = request.user
        tenant = request.tenant
        
        # Vérifier que l'utilisateur est chef de projet sur ce projet
        try:
            projet = Projet.objects.get(id=projet_id, tenant=tenant)
        except Projet.DoesNotExist:
            return Response({'error': 'Projet non trouvé'}, status=404)
        
        # Vérifier les droits (chef projet ou direction)
        role = user.get_role_in_tenant(tenant)
        if role not in ['direction', 'chef_projet']:
            return Response({'error': 'Non autorisé'}, status=403)
        
        # Si chef projet, vérifier qu'il est bien le chef de ce projet
        if role == 'chef_projet' and projet.chef_projet != user:
            return Response({'error': 'Vous n\'êtes pas le chef de ce projet'}, status=403)
        
        # Récupérer tous les consultants du projet (via les tâches)
        consultants = Utilisateur.objects.filter(
            taches__projet=projet,
            role='consultant'
        ).distinct()
        
        # Formatage des données
        data = []
        for consultant in consultants:
            # Récupérer les tâches du consultant sur ce projet
            taches = Tache.objects.filter(consultant=consultant, projet=projet)
            
            data.append({
                'id': str(consultant.id),
                'nom': consultant.nom,
                'email': consultant.email,
                'telephone': consultant.telephone,
                'photo_profil': consultant.photo_profil.url if consultant.photo_profil else None,
                'competences': consultant.competences,
                'taches': [
                    {
                        'id': str(tache.id),
                        'titre': tache.titre,
                        'avancement': tache.avancement,
                        'statut': tache.statut
                    } for tache in taches
                ],
                'total_taches': taches.count(),
                'avancement_moyen': sum(t.avancement for t in taches) / taches.count() if taches else 0
            })
        
        return Response({
            'projet': {
                'id': str(projet.id),
                'nom': projet.nom,
                'chef_projet': {
                    'id': str(projet.chef_projet.id),
                    'nom': projet.chef_projet.nom,
                    'email': projet.chef_projet.email
                }
            },
            'consultants': data,
            'total_consultants': len(data)
        })
    

class CurrentUserView(APIView):
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user

        photo_url = None
        if user.photo_profil and user.photo_profil.name:
            try:
                # Retourner l'URL complète
                photo_url = request.build_absolute_uri(user.photo_profil.url)
            except:
                photo_url = None
        
        # Récupérer le rôle dans le tenant
        role = user.get_role_in_tenant(request.tenant) if hasattr(user, 'get_role_in_tenant') else user.role
        
        return Response({
            'id': str(user.id),
            'nom': user.nom,
            'email': user.email,
            'telephone': user.telephone or None,
            'poste': user.poste or None,
            'departement': None,  # Votre modèle n'a pas de champ 'departement'
            'entreprise': user.entreprise or None,
            'dateEntree': user.date_creation,
            'photo_profil': photo_url,
            'role': role,
        })

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                from rest_framework_simplejwt.tokens import RefreshToken
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Déconnecté avec succès'})
        except Exception:
            return Response({'message': 'Déconnecté'})
        
class UtilisateurDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UtilisateurSerializer
    
    def get_queryset(self):
        # L'utilisateur ne peut voir/modifier que son propre profil
        return Utilisateur.objects.filter(id=self.request.user.id)
    
    def get_object(self):
        # Retourne l'utilisateur connecté, indépendamment de l'ID dans l'URL
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        user = self.request.user
        
        # Gérer spécialement l'upload de photo
        if 'photo_profil' in request.FILES:
            user.photo_profil = request.FILES['photo_profil']
        
        # Mettre à jour les autres champs
        for field in ['nom', 'telephone', 'poste', 'entreprise']:
            if field in request.data:
                setattr(user, field, request.data[field])
        
        user.save()
        
        return Response({
            'id': str(user.id),
            'nom': user.nom,
            'email': user.email,
            'telephone': user.telephone,
            'poste': user.poste,
            'entreprise': user.entreprise,
            'photo_profil': user.photo_profil.url if user.photo_profil else None,
            'role': user.get_role_in_tenant(request.tenant) if hasattr(user, 'get_role_in_tenant') else user.role,
        })
    

class UtilisateurViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UtilisateurSerializer
    
    def get_queryset(self):
        # L'utilisateur ne peut voir que son propre profil
        return Utilisateur.objects.filter(id=self.request.user.id)
    
    def get_object(self):
        # Retourne l'utilisateur connecté
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        user = self.request.user
        
        # Gérer l'upload de photo
        if 'photo_profil' in request.FILES:
            user.photo_profil = request.FILES['photo_profil']
        
        # Mettre à jour les champs texte
        updatable_fields = ['nom', 'telephone', 'poste', 'entreprise']
        for field in updatable_fields:
            if field in request.data and request.data[field]:
                setattr(user, field, request.data[field])
        
        user.save()
        
        # Construire la réponse
        photo_url = None
        if user.photo_profil:
            try:
                photo_url = user.photo_profil.url
            except:
                photo_url = None
        
        return Response({
            'id': str(user.id),
            'nom': user.nom,
            'email': user.email,
            'telephone': user.telephone,
            'poste': user.poste,
            'entreprise': user.entreprise,
            'photo_profil': photo_url,
            'role': user.get_role_in_tenant(request.tenant) if hasattr(user, 'get_role_in_tenant') else getattr(user, 'role', 'consultant'),
            'dateEntree': user.date_creation,
        })
    



class TacheListCreateView(generics.ListCreateAPIView):
    queryset = Tache.objects.all()
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        data = []
        for task in queryset:
            data.append({
                'id': str(task.id),
                'title': task.titre,
                'description': task.description,
                'priority': task.priorite,
                'status': self.map_status(task.statut),
                'avancement': float(task.avancement),
                'dateEcheance': task.date_fin_prevue,
                'projetId': str(task.projet.id) if task.projet else None,
                'assigneA': str(task.consultant.id) if task.consultant else None,
                'assigneNom': task.consultant.nom if task.consultant else None,
            })
        
        return Response({
            'count': len(data),
            'results': data
        })
    
    def map_status(self, statut):
        mapping = {
            'en cours': 'en_cours',
            'termine': 'termine',
            'a_faire': 'a_faire'
        }
        return mapping.get(statut, 'a_faire')
    
class TacheDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TacheSerializer
    
    def get_queryset(self):
        tenant = self.request.tenant
        return Tache.objects.filter(tenant=tenant)
    
    def retrieve(self, request, *args, **kwargs):
        task = self.get_object()
        
        data = {
            'id': str(task.id),
            'title': task.titre,
            'description': task.description,
            'priority': task.priorite,
            'status': 'en_cours' if task.statut == 'en cours' else task.statut,
            'avancement': float(task.avancement),
            'dateEcheance': task.date_fin_prevue,
            'projetId': str(task.projet.id) if task.projet else None,
            'assigneA': str(task.consultant.id) if task.consultant else None,
            'assigneNom': task.consultant.nom if task.consultant else None,
        }
        
        return Response(data)



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

class ChangerMotDePasseView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        ancien_mot_de_passe = request.data.get('ancien_mot_de_passe')
        nouveau_mot_de_passe = request.data.get('nouveau_mot_de_passe')
        confirmation = request.data.get('confirmation')
        
        print("=" * 50)
        print("🔐 [ChangerMotDePasseView] Appelée")
        print(f"👤 Utilisateur: {user.email}")
        print(f"📝 Ancien: {ancien_mot_de_passe}")
        print(f"📝 Nouveau: {nouveau_mot_de_passe}")
        print(f"📝 Confirmation: {confirmation}")
        print("=" * 50)
        
        # Vérifier que tous les champs sont présents
        if not ancien_mot_de_passe or not nouveau_mot_de_passe or not confirmation:
            return Response(
                {'error': 'Tous les champs sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier l'ancien mot de passe
        if not user.check_password(ancien_mot_de_passe):
            print(f" Ancien mot de passe incorrect")
            return Response(
                {'error': 'Ancien mot de passe incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier la confirmation
        if nouveau_mot_de_passe != confirmation:
            return Response(
                {'error': 'Les mots de passe ne correspondent pas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier la longueur
        if len(nouveau_mot_de_passe) < 6:
            return Response(
                {'error': 'Le mot de passe doit contenir au moins 6 caractères'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que le nouveau mot de passe est différent
        if ancien_mot_de_passe == nouveau_mot_de_passe:
            return Response(
                {'error': 'Le nouveau mot de passe doit être différent de l\'ancien'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Changer le mot de passe
        user.set_password(nouveau_mot_de_passe)
        user.doit_changer_mot_de_passe = False
        user.save()
        
        print(f"Mot de passe changé pour {user.email}")
        
        return Response(
            {'message': 'Mot de passe changé avec succès'},
            status=status.HTTP_200_OK
        )
    


from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Utilisateur
from .serializers import UtilisateurSerializer

class ChefProjetListView(generics.ListAPIView):
    """
    Liste des chefs de projet (Direction et Chef projet uniquement)
    """
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        tenant = self.request.tenant
        return Utilisateur.objects.filter(
            role='chef_projet',
            memberships__tenant=tenant,
            is_active=True,
            statut_approbation='approved'
        ).order_by('nom')

class ChefProjetDetailView(generics.RetrieveAPIView):
    """
    Détails d'un chef de projet
    """
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        tenant = self.request.tenant
        return Utilisateur.objects.filter(
            role='chef_projet',
            memberships__tenant=tenant,
            is_active=True,
            statut_approbation='approved'
        )
#-----------------------------------------------fichier excel projets--------------------------------------------
STATUTS_VALIDES = ['planifie', 'en_cours', 'termine', 'en_pause', 'a_risque']
def parse_date_excel(value):
    """
    Convertit une cellule Excel en objet date.
    Gère à la fois les objets datetime/date natifs d'Excel
    et les chaînes de texte dans plusieurs formats courants.
    Retourne None si la valeur est vide ou illisible.
    """
    if value in (None, ''):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    texte = str(value).strip()
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d'):
        try:
            return datetime.strptime(texte, fmt).date()
        except ValueError:
            continue
    return None

import secrets

def resoudre_ou_creer_utilisateur(valeur, role):
    valeur = str(valeur).strip()
    if not valeur:
        return None, None

    if '@' in valeur:
        utilisateur = Utilisateur.objects.filter(
            email__iexact=valeur, role=role
        ).first()
    else:
        utilisateur = Utilisateur.objects.filter(
            nom__iexact=valeur, role=role
        ).first()

    if utilisateur:
        return utilisateur, None

    # Pas trouvé → création automatique
    if '@' in valeur:
        email = valeur.lower()
        nom = valeur.split('@')[0].replace('.', ' ').title()
    else:
        nom = valeur
        slug = valeur.lower().replace(' ', '.').replace("'", '')
        email = f"{slug}@ramaqs-import.com"

    # Email déjà pris par un autre rôle
    existant = Utilisateur.objects.filter(email__iexact=email).first()
    if existant:
        return existant, f"'{valeur}' existe déjà avec le rôle '{existant.role}' — utilisé tel quel"

    mot_de_passe_temp = secrets.token_urlsafe(12)
    utilisateur = Utilisateur.objects.create_user(
        username=email,
        email=email,
        nom=nom,
        role=role,
        password=mot_de_passe_temp,
        is_active=True,
        statut_approbation='approved',
    )
    info = f"Compte créé automatiquement : {nom} ({email}) — rôle {role}"
    return utilisateur, info
 
class ImportProjetsExcelView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]
 
    def post(self, request):
        user = request.user
 
        # Seule la direction peut importer
        if user.role != 'direction':
            return Response(
                {'error': 'Accès refusé'},
                status=status.HTTP_403_FORBIDDEN
            )
 
        fichier = request.FILES.get('fichier')
        if not fichier:
            return Response(
                {'error': 'Aucun fichier fourni'},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        try:
            wb = openpyxl.load_workbook(fichier, data_only=True)
            ws = wb.active
        except Exception:
            return Response(
                {'error': 'Fichier Excel invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        headers = [str(cell.value).strip().lower() if cell.value else ''
                   for cell in ws[1]]
 
        projets_crees = []
        erreurs = []
        tenant = Tenant.objects.first()
 
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            if not any(row):
                continue  # ligne vide
 
            row_data = {headers[i]: row[i] for i in range(len(headers)) if i < len(row)}
            row_errors = []
 
            # --- Champs obligatoires ---
            nom = row_data.get('nom') or row_data.get('name')
            if not nom:
                erreurs.append(f"Ligne {row_idx} : nom manquant")
                continue
 
            date_debut = parse_date_excel(row_data.get('date_debut'))
            date_fin_prevue = parse_date_excel(row_data.get('date_fin_prevue'))
            if not date_debut:
                row_errors.append(f"Ligne {row_idx} : date_debut manquante ou invalide "
                                   f"(valeur reçue : '{row_data.get('date_debut')}'). Format attendu : AAAA-MM-JJ")
            if not date_fin_prevue:
                row_errors.append(f"Ligne {row_idx} : date_fin_prevue manquante ou invalide "
                                   f"(valeur reçue : '{row_data.get('date_fin_prevue')}'). Format attendu : AAAA-MM-JJ")
 
            # Client (obligatoire dans le modèle Projet)
            client = None
            client_valeur = row_data.get('client')
            if not client_valeur:
                row_errors.append(f"Ligne {row_idx} : client manquant (obligatoire)")
            else:
                client, err = resoudre_ou_creer_utilisateur(client_valeur, 'client')
                if err:
                    row_errors.append(f"Ligne {row_idx} : {err}")
 
            # Si un champ obligatoire manque, on saute la ligne SANS toucher la base
            if row_errors:
                erreurs.extend(row_errors)
                continue
 
            # --- Champs optionnels ---
            chefs = []
            chef_valeur = row_data.get('chef_projet') or row_data.get('chef')
            if chef_valeur:
                for valeur in str(chef_valeur).split(','):
                    chef, err = resoudre_ou_creer_utilisateur(valeur, 'chef_projet')
                    if chef:
                        chefs.append(chef)
                    elif err:
                        erreurs.append(f"Ligne {row_idx} : {err}")
 
            partenaires = []
            partenaires_valeur = row_data.get('partenaires') or row_data.get('partenaire')
            if partenaires_valeur:
                for valeur in str(partenaires_valeur).split(','):
                    partenaire, err = resoudre_ou_creer_utilisateur(valeur, 'partenaire')
                    if partenaire:
                        partenaires.append(partenaire)
                    elif err:
                        erreurs.append(f"Ligne {row_idx} : {err}")
 
            budget_raw = row_data.get('budget') or 0
            try:
                budget = float(str(budget_raw).replace(' ', '').replace(',', '.'))
            except ValueError:
                budget = 0
 
            statut_raw = str(row_data.get('statut', 'planifie') or 'planifie').lower().strip()
            statut = statut_raw if statut_raw in STATUTS_VALIDES else 'planifie'
 
            try:
                projet = Projet.objects.create(
                    nom=str(nom).strip(),
                    description=str(row_data.get('description', '') or ''),
                    objectsif=str(row_data.get('objectsif', '') or ''),
                    statut=statut,
                    budget=budget,
                    domaine=str(row_data.get('domaine', '') or ''),
                    priorite=str(row_data.get('priorite', 'normale') or 'normale'),
                    date_debut=date_debut,
                    date_fin_prevue=date_fin_prevue,
                    client=client,
                    tenant=tenant,
                )
 
                if chefs:
                    projet.chef_projet.set(chefs)
                if partenaires:
                    projet.partenaires.set(partenaires)  # ✅ pluriel corrigé
 
                projets_crees.append({
                    'id': str(projet.id),
                    'nom': projet.nom,
                    'statut': projet.statut,
                    'budget': float(projet.budget or 0),
                })
 
            except Exception as e:
                erreurs.append(f"Ligne {row_idx} : erreur — {str(e)}")
 
        return Response({
            'success': len(projets_crees) > 0,
            'projets_crees': len(projets_crees),
            'projets': projets_crees,
            'erreurs': erreurs,
        }, status=status.HTTP_201_CREATED if projets_crees else status.HTTP_400_BAD_REQUEST)