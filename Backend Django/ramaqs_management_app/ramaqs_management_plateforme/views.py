from datetime import datetime, date
from .permissions import IsDirectionUser, IsEligibleUser, IsProjectMemberReadOnly, IsTaskMember, is_direction
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
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import escape, strip_tags
import secrets
from datetime import timedelta
from .models import Utilisateur, PasswordResetToken
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
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
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from .models import Tache

logger = logging.getLogger(__name__)


def validate_profile_photo(upload):
    """Refuse les fichiers qui ne sont pas de vraies images JPEG ou PNG."""
    if upload.size > 5 * 1024 * 1024:
        raise ValidationError("La photo de profil ne doit pas dépasser 5 Mo.")
    if upload.content_type not in {'image/jpeg', 'image/png'}:
        raise ValidationError("Seules les images JPEG et PNG sont autorisées.")

    try:
        from PIL import Image, UnidentifiedImageError

        image = Image.open(upload)
        if image.format not in {'JPEG', 'PNG'}:
            raise ValidationError("Le contenu du fichier ne correspond pas à une image autorisée.")
        if image.width * image.height > 20_000_000:
            raise ValidationError("La résolution de l'image est trop élevée.")
        image.verify()
    except (ImportError, UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValidationError("Le fichier image est invalide.") from exc
    finally:
        upload.seek(0)
from .models import (
    Projet, RoleChoices, Tache, Consultant, Client, ChefProjet, 
    Partenaire, Direction, Ressource, SousTache, 
    Document, Commentaire, Notification,
    Kpi, Budget,
    Direction, ChefProjet, Consultant, Client, Partenaire, 
    RoleChoices
)
from .serializers import (
    ProjetSerializer, TacheSerializer, 
    ConsultantSerializer, ClientSerializer,
    BudgetSerializer,
    CommentaireSerializer, DirectionSerializer,
    DocumentSerializer, NotificationSerializer,
    PartenaireSerializer, RessourceSerializer,
    SousTacheSerializer, KpiSerializer,
    DirectionSerializer, ChefProjetSerializer, ConsultantSerializer, ClientSerializer, PartenaireSerializer, UtilisateurSerializer

)


# ========== VIEWSETS PROTÉGÉS ==========

class BaseProtectedViewSet(viewsets.ModelViewSet):
    """Ressources administratives réservées à la direction."""
    permission_classes = [IsDirectionUser]
    
    def get_queryset(self):
        return self.queryset.all()
    
class ProjetViewSet(BaseProtectedViewSet):
    queryset = Projet.objects.all()
    serializer_class = ProjetSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Filtres exacts
    filterset_fields = {
        'statut': ['exact'],
        'avancement_globale': ['gte', 'lte'],
        'date_debut': ['gte', 'lte'],
        'date_fin_prevue': ['gte', 'lte'],
    }
    
    # Recherche texte
    search_fields = ['nom', 'description', 'client__nom']
    
    # Tri
    ordering_fields = ['nom', 'date_debut', 'date_fin_prevue', 'avancement_globale', 'budget']
    ordering = ['-date_debut']
    permission_classes = [IsProjectMemberReadOnly]

    def get_permissions(self):
        if self.action in {'create', 'update', 'partial_update', 'destroy'}:
            return [IsDirectionUser()]
        return [IsProjectMemberReadOnly()]

    def get_queryset(self):
        user = self.request.user
       
       
        if is_direction(user):
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
        if not is_direction(request.user):
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

class TacheViewSet(BaseProtectedViewSet):
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
    permission_classes = [IsTaskMember]

    def perform_create(self, serializer):
        projet = serializer.validated_data['projet']
        if not is_direction(self.request.user) and not projet.chef_projet.filter(id=self.request.user.id).exists():
            raise PermissionDenied("Seule la direction ou le chef du projet peut créer une tâche.")
        task = serializer.save()
        serializer.mettre_a_jour_avancement_projet(task.projet)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        user = self.request.user
        role = user.role
        queryset = Tache.objects.all()
        
        if is_direction(user):
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
        role = user.role
        
        # Seuls direction et chef_projet peuvent supprimer
        if not is_direction(user) and role != 'chef_projet':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'avez pas la permission de supprimer cette tâche")
        
        projet = instance.projet
        # Suppression réelle
        instance.delete()
        TacheSerializer().mettre_a_jour_avancement_projet(projet)
        logger.info(f"Tâche {instance.id} supprimée avec succès")
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.statut == 'en_attente_validation' and 'statut' in request.data:
            return Response(
                {'detail': "Utilisez les actions d'approbation ou de rejet pour une tâche à valider."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not is_direction(request.user) and not instance.projet.chef_projet.filter(id=request.user.id).exists():
            forbidden = {
                'projet', 'consultant', 'titre', 'description', 'priorite',
                'date_debut', 'date_fin_prevue', 'date_fin_reelle', 'statut',
            }
            if forbidden.intersection(request.data.keys()):
                raise PermissionDenied("Un consultant ne peut modifier que l'avancement de sa propre tâche.")
        return super().update(request, *args, **kwargs)

    def _can_validate(self, user, task):
        return is_direction(user) or task.projet.chef_projet.filter(id=user.id).exists()

    @action(detail=True, methods=['post'], url_path='approuver_validation')
    def approuver_validation(self, request, pk=None):
        task = self.get_object()
        if not self._can_validate(request.user, task):
            raise PermissionDenied("Seule la direction ou le chef du projet peut approuver une tâche.")
        if not task.approuver_validation():
            return Response({'detail': "La tâche n'est pas en attente de validation."}, status=status.HTTP_400_BAD_REQUEST)
        TacheSerializer().mettre_a_jour_avancement_projet(task.projet)
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=['post'], url_path='rejeter_validation')
    def rejeter_validation(self, request, pk=None):
        task = self.get_object()
        if not self._can_validate(request.user, task):
            raise PermissionDenied("Seule la direction ou le chef du projet peut rejeter une tâche.")
        if not task.rejeter_validation():
            return Response({'detail': "La tâche n'est pas en attente de validation."}, status=status.HTTP_400_BAD_REQUEST)
        TacheSerializer().mettre_a_jour_avancement_projet(task.projet)
        return Response(self.get_serializer(task).data)

    
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

class ConsultantViewSet(BaseProtectedViewSet):
    queryset = Consultant.objects.all()
    serializer_class = ConsultantSerializer


class ClientViewSet(BaseProtectedViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer


class ChefProjetViewSet(BaseProtectedViewSet):
    queryset = ChefProjet.objects.all()
    serializer_class = ChefProjetSerializer


class DirectionViewSet(BaseProtectedViewSet):
    queryset = Direction.objects.all()
    serializer_class = DirectionSerializer


class PartenaireViewSet(BaseProtectedViewSet):
    queryset = Partenaire.objects.all()
    serializer_class = PartenaireSerializer


class RessourceViewSet(BaseProtectedViewSet):
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
        

        


class SousTacheViewSet(BaseProtectedViewSet):
    queryset = SousTache.objects.all()
    serializer_class = SousTacheSerializer
    
#--------------------------------------doc----------------------------------------------------------



def documents_accessibles_a(user):
    """Single source of truth for document visibility, including downloads."""
    qs = Document.objects.select_related('projet', 'uploaded_by')
    if is_direction(user):
        return qs
    if user.role == 'chef_projet':
        return qs.filter(projet__chef_projet=user)
    if user.role == 'consultant':
        projets_ids = Tache.objects.filter(consultant=user).values_list('projet_id', flat=True).distinct()
        return qs.filter(projet_id__in=projets_ids).filter(models.Q(type='livrable') | models.Q(uploaded_by=user))
    if user.role == 'partenaire':
        return qs.filter(projet__partenaires=user).filter(models.Q(type='livrable') | models.Q(uploaded_by=user))
    if user.role == 'client':
        return qs.filter(projet__client=user).filter(models.Q(type='livrable') | models.Q(uploaded_by=user))
    return qs.none()


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsEligibleUser]

    def get_queryset(self):
        return documents_accessibles_a(self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        projet = serializer.validated_data.get('projet')

        if is_direction(user):
            pass
        elif user.role == 'chef_projet' and not projet.chef_projet.filter(id=user.id).exists():
            raise PermissionDenied("Vous ne pouvez téléverser que sur vos propres projets.")
        elif user.role == 'consultant' and not Tache.objects.filter(consultant=user, projet=projet).exists():
            raise PermissionDenied("Vous n'êtes assigné à aucune tâche sur ce projet.")
        elif user.role == 'partenaire' and not projet.partenaires.filter(id=user.id).exists():
            raise PermissionDenied("Vous n'êtes pas partenaire sur ce projet.")
        elif user.role == 'client' and projet.client_id != user.id:
            raise PermissionDenied("Ce projet n'est pas le vôtre.")
        elif user.role not in {'chef_projet', 'consultant', 'partenaire', 'client'}:
            raise PermissionDenied("Votre rôle ne peut pas téléverser de documents.")

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
        if not is_direction(user) and not is_chef_owner:
            return Response(
                {"detail": "Vous n'avez pas la permission de supprimer ce document."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        requested_project = serializer.validated_data.get('projet', instance.projet)
        is_chef_owner = user.role == 'chef_projet' and instance.projet.chef_projet.filter(id=user.id).exists()

        if not is_direction(user) and not is_chef_owner:
            raise PermissionDenied("Vous n'avez pas la permission de modifier ce document.")
        if requested_project.id != instance.projet_id and not is_direction(user):
            raise PermissionDenied("Seule la direction peut déplacer un document entre projets.")
        serializer.save()


class DocumentDownloadView(APIView):
    permission_classes = [IsEligibleUser]

    def get(self, request, pk):
        document = get_object_or_404(documents_accessibles_a(request.user), pk=pk)
        if not document.fichier:
            return Response({'detail': 'Fichier indisponible.'}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(
            document.fichier.open('rb'),
            as_attachment=True,
            filename=document.nom,
        )


class CommentaireViewSet(BaseProtectedViewSet):
    queryset = Commentaire.objects.all()
    serializer_class = CommentaireSerializer


class NotificationViewSet(BaseProtectedViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer 
    permission_classes = [IsEligibleUser]
    
    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', None)
        base_qs = Notification.objects.filter(utilisateur=user)


        if is_direction(user):
            return base_qs.order_by('-date_envoi')

        return base_qs.order_by('-date_envoi')

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

class KpiViewSet(BaseProtectedViewSet):
    queryset = Kpi.objects.all()
    serializer_class = KpiSerializer


class BudgetViewSet(BaseProtectedViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer

class DirectionViewSet(BaseProtectedViewSet):
    queryset = Direction.objects.all()
    serializer_class = DirectionSerializer  # À créer

class ChefProjetViewSet(BaseProtectedViewSet):
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
        
        return Utilisateur.objects.filter(
            role='consultant',
            is_active=True
        ).order_by('nom')


class ConsultantDetailAPIView(generics.RetrieveAPIView):
    serializer_class = ConsultantSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        return Utilisateur.objects.filter(
            role='consultant',
            is_active=True
        )

class ClientViewSet(BaseProtectedViewSet):
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

class PartenaireViewSet(BaseProtectedViewSet):
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

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    
# ========== MOT DE PASSE OUBLIÉ ==========

class ForgotPasswordView(APIView):
    """Envoie un lien de réinitialisation à usage unique, valable 10 minutes."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip()

        if not email:
            return Response(
                {'error': 'Email requis'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        generic_response = Response(
            {'message': 'Si un compte correspond, un lien de réinitialisation vous sera envoyé.'},
            status=status.HTTP_200_OK,
        )
        try:
            user = Utilisateur.objects.get(
                email__iexact=email,
                is_active=True,
                statut_approbation='approved',
            )
        except Utilisateur.DoesNotExist:
            return generic_response

        PasswordResetToken.objects.filter(user=user, used=False).delete()
        reset_token = PasswordResetToken.objects.create(
            user=user,
            token=secrets.token_urlsafe(32),
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token.token}"
        display_name = escape(user.nom or user.email)
        safe_reset_url = escape(reset_url)
        html_message = f"""
<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#fef2f2;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Réinitialisez votre mot de passe RAMAQS Consulting.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fef2f2;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(127,29,29,.12);">
          <tr><td style="height:6px;background:#dc2626;"></td></tr>
          <tr><td align="center" style="padding:32px 32px 20px;">
            <div style="width:52px;height:52px;line-height:52px;text-align:center;background:#dc2626;border-radius:14px;color:#ffffff;font-size:25px;font-weight:700;">R</div>
            <h1 style="margin:22px 0 8px;font-size:25px;line-height:32px;color:#111827;">Réinitialiser votre mot de passe</h1>
            <p style="margin:0;font-size:16px;line-height:24px;color:#6b7280;">Une demande de réinitialisation a été effectuée pour votre compte RAMAQS.</p>
          </td></tr>
          <tr><td style="padding:0 32px 12px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:24px;">Bonjour <strong>{display_name}</strong>,</p>
            <p style="margin:0;font-size:16px;line-height:24px;color:#374151;">Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>
          </td></tr>
          <tr><td align="center" style="padding:16px 32px 28px;">
            <a href="{safe_reset_url}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:9px;">Réinitialiser mon mot de passe</a>
          </td></tr>
          <tr><td style="padding:0 32px 24px;">
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;font-size:14px;line-height:21px;color:#9a3412;">
              <strong>Important :</strong> ce lien est valable 10 minutes et ne peut être utilisé qu'une seule fois.
            </div>
            <p style="margin:20px 0 0;font-size:13px;line-height:20px;color:#6b7280;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail. Votre mot de passe ne sera pas modifié.</p>
          </td></tr>
          <tr><td style="padding:20px 32px;background:#fffafa;border-top:1px solid #fee2e2;text-align:center;font-size:12px;line-height:18px;color:#9ca3af;">RAMAQS Consulting · Plateforme de gestion de projets</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
"""
        try:
            result = send_mail(
                subject='RAMAQS - Réinitialisation du mot de passe',
                message=strip_tags(html_message),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            if result != 1:
                logger.error("L'email de réinitialisation n'a pas été accepté pour %s.", user.email)
            else:
                logger.info("Email de réinitialisation envoyé à %s.", user.email)
        except Exception:
            logger.exception("Échec de l'envoi du lien de réinitialisation")
        return generic_response

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
    """Réinitialise le mot de passe à partir d'un lien à usage unique."""
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
        
        
        try:
            validate_password(new_password)
        except ValidationError as exc:
            return Response({'error': list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
        
        
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
        # Vérifier que l'utilisateur est chef de projet sur ce projet
        try:
            projet = Projet.objects.get(id=projet_id)
        except Projet.DoesNotExist:
            return Response({'error': 'Projet non trouvé'}, status=404)
        
        # Vérifier les droits (chef projet ou direction)
        role = user.role
        if not is_direction(user) and role != 'chef_projet':
            return Response({'error': 'Non autorisé'}, status=403)
        
        # Si chef projet, vérifier qu'il est bien le chef de ce projet
        if role == 'chef_projet' and not projet.chef_projet.filter(id=user.id).exists():
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
                'chefs_projet': [
                    {'id': str(chef.id), 'nom': chef.nom, 'email': chef.email}
                    for chef in projet.chef_projet.all()
                ]
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
        
        role = user.role
        
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
            try:
                validate_profile_photo(request.FILES['photo_profil'])
            except ValidationError as exc:
                return Response({'photo_profil': exc.messages}, status=status.HTTP_400_BAD_REQUEST)
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
            'role': user.role,
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
            try:
                validate_profile_photo(request.FILES['photo_profil'])
            except ValidationError as exc:
                return Response({'photo_profil': exc.messages}, status=status.HTTP_400_BAD_REQUEST)
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
            'role': user.role,
            'dateEntree': user.date_creation,
        })
    



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
        
        
        
        # Vérifier que tous les champs sont présents
        if not ancien_mot_de_passe or not nouveau_mot_de_passe or not confirmation:
            return Response(
                {'error': 'Tous les champs sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier l'ancien mot de passe
        if not user.check_password(ancien_mot_de_passe):
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
        try:
            validate_password(nouveau_mot_de_passe, user)
        except ValidationError as exc:
            return Response({'error': list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
        
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
        return Utilisateur.objects.filter(
            role='chef_projet',
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
        return Utilisateur.objects.filter(
            role='chef_projet',
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

def resoudre_utilisateur_existant(valeur, role):
    valeur = str(valeur).strip()
    if not valeur:
        return None, None

    if '@' in valeur:
        utilisateur = Utilisateur.objects.filter(
            email__iexact=valeur, role=role, is_active=True, statut_approbation='approved'
        ).first()
    else:
        utilisateur = Utilisateur.objects.filter(
            nom__iexact=valeur, role=role, is_active=True, statut_approbation='approved'
        ).first()

    if utilisateur:
        return utilisateur, None

    return None, (
        f"Utilisateur '{valeur}' introuvable pour le rôle '{role}'. "
        "Créez et approuvez ce compte avant d'importer le projet."
    )
 
class ImportProjetsExcelView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]
 
    def post(self, request):
        user = request.user
 
        # Seule la direction peut importer
        if not is_direction(user):
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

        if fichier.size > 5 * 1024 * 1024 or not fichier.name.lower().endswith('.xlsx'):
            return Response(
                {'error': 'Le fichier doit être un .xlsx de 5 Mo maximum'},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        try:
            wb = openpyxl.load_workbook(fichier, data_only=True, read_only=True)
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
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            if row_idx > 1001:
                erreurs.append('Import limité à 1 000 lignes.')
                break
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
                client, err = resoudre_utilisateur_existant(client_valeur, 'client')
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
                    chef, err = resoudre_utilisateur_existant(valeur, 'chef_projet')
                    if chef:
                        chefs.append(chef)
                    elif err:
                        row_errors.append(f"Ligne {row_idx} : {err}")
 
            partenaires = []
            partenaires_valeur = row_data.get('partenaires') or row_data.get('partenaire')
            if partenaires_valeur:
                for valeur in str(partenaires_valeur).split(','):
                    partenaire, err = resoudre_utilisateur_existant(valeur, 'partenaire')
                    if partenaire:
                        partenaires.append(partenaire)
                    elif err:
                        row_errors.append(f"Ligne {row_idx} : {err}")

            if row_errors:
                erreurs.extend(row_errors)
                continue
 
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
                    domaine=[
                        domain.strip()
                        for domain in str(row_data.get('domaine', '') or '').replace('•', ',').replace(';', ',').split(',')
                        if domain.strip()
                    ],
                    date_debut=date_debut,
                    date_fin_prevue=date_fin_prevue,
                    client=client,
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
