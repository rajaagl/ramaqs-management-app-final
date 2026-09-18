from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from . import views
from .views import *
from .views import ChangerMotDePasseView ,ChefProjetListView,ChefProjetDetailView


from .user_register_views import (
    UserRegisterView,
    UserApproveRejectView,
    UserListView,
)


try:
    from .user_register_views import (
        UserRegisterView,
        UserApproveRejectView,
        UserListView,
    )
except ImportError as e:
    UserRegisterView = None
    UserApproveRejectView = None
    UserListView = None


router = DefaultRouter()
router.register('projets', views.ProjetViewSet)
router.register('taches', views.TacheViewSet)
router.register('consultants', views.ConsultantViewSet)
router.register('clients', views.ClientViewSet)
router.register('chefProjets', views.ChefProjetViewSet)
router.register('directions', views.DirectionViewSet)
router.register('partenaires', views.PartenaireViewSet)
# Les modules Ressources, KPI et Finance ne font pas partie de cette livraison.
# Ils restent volontairement hors de l'API publique jusqu'à leur recette complète.
router.register('sousTaches', views.SousTacheViewSet)
router.register('documents', views.DocumentViewSet, basename='document')
router.register('commentaires', views.CommentaireViewSet)
router.register('utilisateurs', views.UtilisateurViewSet, basename='utilisateur')
router.register('notifications', views.NotificationViewSet, basename='notification')
# Si vous avez un ViewSet pour les chefs de projet
router.register('chefs-projet', views.ChefProjetViewSet, basename='chefs-projet')

urlpatterns = [
    path('projets/import-excel/', ImportProjetsExcelView.as_view(), name='import-projets-excel'),
    path('documents/<uuid:pk>/download/', DocumentDownloadView.as_view(), name='document-download'),
    path('', include(router.urls)),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/validate-reset-token/', ValidateResetTokenView.as_view(), name='validate-reset-token'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('projets/<uuid:projet_id>/consultants/', ChefProjetConsultantsView.as_view(), name='projet-consultants'),
    path('auth/register/', UserRegisterView.as_view(), name='register'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    path('notifications/<uuid:pk>/lire/', views.NotificationViewSet.as_view({'patch': 'lire'}), name='notification-mark-read'),
    path('notifications/lire-tout/', views.NotificationViewSet.as_view({'patch': 'lire_tout'}), name='notification-mark-all-read'),
    path('users/register/', UserRegisterView.as_view(), name='user-register'),
    path('users/<uuid:pk>/approve-reject/', UserApproveRejectView.as_view(), name='user-approve-reject'),
    path('users/pending/', UserListView.as_view(), name='user-list'),
    path('auth/changer-mot-de-passe/', ChangerMotDePasseView.as_view(), name='changer-mot-de-passe'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
