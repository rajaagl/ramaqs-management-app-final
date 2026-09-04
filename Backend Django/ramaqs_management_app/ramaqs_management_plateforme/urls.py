from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from . import views
from .views import *
from .views import ChangerMotDePasseView ,ChefProjetListView,ChefProjetDetailView
from .calendar_views import CalendarEventsView


from .user_register_views import (
    UserRegisterView,
    UserApproveRejectView,
    UserListView,
)

print("📁 CHARGEMENT DE urls.py")


try:
    from .user_register_views import (
        UserRegisterView,
        UserApproveRejectView,
        UserListView,
    )
except ImportError as e:
    print(f"❌ Erreur import user_register_views: {e}")
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
router.register('ressources', views.RessourceViewSet)
router.register('sousTaches', views.SousTacheViewSet)
router.register('documents', views.DocumentViewSet, basename='document')
router.register('commentaires', views.CommentaireViewSet)
router.register('conversations', views.ConversationViewSet)
router.register('messages', views.MessageViewSet)
router.register('kpis', views.KpiViewSet)
router.register('budgets', views.BudgetViewSet)
router.register('utilisateurs', views.UtilisateurViewSet, basename='utilisateur')
router.register('notifications', views.NotificationViewSet, basename='notification')
# Si vous avez un ViewSet pour les chefs de projet
router.register('chefs-projet', views.ChefProjetViewSet, basename='chefs-projet')

urlpatterns = [
    path('projets/import-excel/', ImportProjetsExcelView.as_view(), name='import-projets-excel'),
    path('api/', include(router.urls)),
    path('', include(router.urls)),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/validate-reset-token/', ValidateResetTokenView.as_view(), name='validate-reset-token'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('projets/<uuid:projet_id>/consultants/', ChefProjetConsultantsView.as_view(), name='projet-consultants'),
    path('auth/register/', UserRegisterView.as_view(), name='register'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    path('api/utilisateurs/<uuid:pk>/', UtilisateurDetailView.as_view(), name='utilisateur-detail'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('notifications/<uuid:pk>/lire/', views.NotificationViewSet.as_view({'patch': 'lire'}), name='notification-mark-read'),
    path('notifications/lire-tout/', views.NotificationViewSet.as_view({'patch': 'lire_tout'}), name='notification-mark-all-read'),
    path('api/consultants/', ConsultantListAPIView.as_view(), name='consultant-list'),
    path('api/consultants/<uuid:pk>/', ConsultantDetailAPIView.as_view(), name='consultant-detail'),
    path('taches/', TacheListCreateView.as_view(), name='tache-list'),
    path('taches/<int:pk>/', views.TacheDetailView.as_view(), name='tache-detail'),
    path('users/register/', UserRegisterView.as_view(), name='user-register'),
    path('users/<uuid:pk>/approve-reject/', UserApproveRejectView.as_view(), name='user-approve-reject'),
    path('users/pending/', UserListView.as_view(), name='user-list'),
    path('auth/changer-mot-de-passe/', ChangerMotDePasseView.as_view(), name='changer-mot-de-passe'),
    path('api/chefs-projet/<uuid:pk>/', ChefProjetDetailView.as_view(), name='chefs-projet-detail'),
    path('calendar/events/', CalendarEventsView.as_view(), name='calendar-events'),
    path('calendar/events/<str:event_id>/', CalendarEventsView.as_view(), name='calendar-event-detail'),
    #-----------------------------------------------fichier excel projets--------------------------------------------
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)