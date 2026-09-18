from datetime import date

from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch

from .models import Document, Notification, PasswordResetToken, Projet, Tache, Utilisateur
from .services.email_service import EmailService
from .views import resoudre_utilisateur_existant


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    FRONTEND_URL='https://preprod.ramaqs.test',
    PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'],
)
class PreproductionApiTests(APITestCase):
    """Recette des flux d'accès et des protections critiques de l'API."""

    password = 'Ramaqs-Preprod-2026!'

    def setUp(self):
        self.direction = self.create_user('direction', 'direction@ramaqs.test')
        self.chef = self.create_user('chef_projet', 'chef@ramaqs.test')
        self.consultant = self.create_user('consultant', 'consultant@ramaqs.test')
        self.client_user = self.create_user('client', 'client@ramaqs.test')
        self.outsider = self.create_user('consultant', 'outsider@ramaqs.test')

        self.projet = Projet.objects.create(
            nom='Projet recette',
            description='Projet créé pour les tests de préproduction.',
            objectsif='Valider les contrôles d’accès',
            date_debut=date(2026, 1, 1),
            date_fin_prevue=date(2026, 12, 31),
            budget='10000.00',
            statut='en_cours',
            client=self.client_user,
            domaine=['Conseil'],
        )
        self.projet.chef_projet.add(self.chef)
        self.second_projet = Projet.objects.create(
            nom='Second projet',
            description='Projet séparé pour les tests de frontières.',
            objectsif='Ne pas déplacer les documents',
            date_debut=date(2026, 3, 1),
            date_fin_prevue=date(2026, 11, 30),
            budget='5000.00',
            statut='en_cours',
            client=self.client_user,
            domaine=['Conseil'],
        )
        self.tache = Tache.objects.create(
            titre='Tâche de recette',
            description='Vérification des permissions.',
            priorite='haute',
            date_debut=date(2026, 1, 2),
            date_fin_prevue=date(2026, 2, 1),
            statut='a_faire',
            projet=self.projet,
            consultant=self.consultant,
        )

    def create_user(self, role, email):
        return Utilisateur.objects.create_user(
            username=email,
            email=email,
            nom=email.split('@')[0],
            telephone='0600000000',
            password=self.password,
            role=role,
            statut_approbation='approved',
            is_active=True,
        )

    def test_login_issues_jwt_for_approved_user(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': self.direction.email, 'password': self.password},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_project_api_rejects_anonymous_and_limits_consultant(self):
        anonymous = self.client.get('/api/projets/')
        self.assertEqual(anonymous.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.consultant)
        visible = self.client.get('/api/projets/')
        self.assertEqual(visible.status_code, status.HTTP_200_OK)
        self.assertEqual(len(visible.data), 1)

        forbidden_create = self.client.post('/api/projets/', {}, format='json')
        self.assertEqual(forbidden_create.status_code, status.HTTP_403_FORBIDDEN)

    def test_outsider_cannot_read_or_modify_task(self):
        self.client.force_authenticate(self.outsider)
        listing = self.client.get('/api/taches/')
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertEqual(len(listing.data), 0)

        update = self.client.patch(
            f'/api/taches/{self.tache.id}/', {'titre': 'Tentative non autorisée'}, format='json'
        )
        self.assertEqual(update.status_code, status.HTTP_404_NOT_FOUND)
        self.tache.refresh_from_db()
        self.assertEqual(self.tache.titre, 'Tâche de recette')

    def test_consultant_cannot_change_sensitive_task_fields(self):
        self.client.force_authenticate(self.consultant)
        response = self.client.patch(
            f'/api/taches/{self.tache.id}/', {'titre': 'Titre interdit'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.tache.refresh_from_db()
        self.assertEqual(self.tache.titre, 'Tâche de recette')

    def test_consultant_cannot_approve_own_task_and_chef_can_validate_it(self):
        self.client.force_authenticate(self.consultant)
        forbidden = self.client.patch(
            f'/api/taches/{self.tache.id}/', {'statut': 'termine', 'avancement': 100}, format='json'
        )
        self.assertEqual(forbidden.status_code, status.HTTP_403_FORBIDDEN)

        submitted = self.client.patch(
            f'/api/taches/{self.tache.id}/', {'avancement': 100}, format='json'
        )
        self.assertEqual(submitted.status_code, status.HTTP_200_OK)
        self.tache.refresh_from_db()
        self.assertEqual(self.tache.statut, 'en_attente_validation')

        self.client.force_authenticate(self.chef)
        approved = self.client.post(f'/api/taches/{self.tache.id}/approuver_validation/', {}, format='json')
        self.assertEqual(approved.status_code, status.HTTP_200_OK)
        self.tache.refresh_from_db()
        self.assertEqual(self.tache.statut, 'termine')

    def test_document_cannot_be_moved_or_updated_by_consultant(self):
        document = Document.objects.create(
            nom='Livrable', type='livrable', projet=self.projet, uploaded_by=self.consultant
        )
        self.client.force_authenticate(self.consultant)
        response = self.client.patch(
            f'/api/documents/{document.id}/', {'projet': str(self.second_projet.id)}, format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        document.refresh_from_db()
        self.assertEqual(document.projet_id, self.projet.id)

    def test_document_download_uses_authorized_api_endpoint(self):
        document = Document.objects.create(
            nom='Livrable PDF', type='livrable', projet=self.projet, uploaded_by=self.consultant,
            fichier=SimpleUploadedFile('livrable.pdf', b'%PDF-1.4\ncontenu', content_type='application/pdf'),
        )
        self.client.force_authenticate(self.outsider)
        forbidden = self.client.get(f'/api/documents/{document.id}/download/')
        self.assertEqual(forbidden.status_code, status.HTTP_404_NOT_FOUND)

        self.client.force_authenticate(self.consultant)
        allowed = self.client.get(f'/api/documents/{document.id}/download/')
        self.assertEqual(allowed.status_code, status.HTTP_200_OK)
        self.assertEqual(allowed['Content-Disposition'], 'attachment; filename="Livrable PDF"')

    def test_notifications_are_strictly_personal(self):
        own = Notification.objects.create(
            utilisateur=self.chef, titre='Personnel', message='Visible uniquement par son destinataire', projet=self.projet
        )
        other = Notification.objects.create(
            utilisateur=self.consultant, titre='Consultant', message='Ne doit pas être visible par le chef', projet=self.projet
        )
        self.client.force_authenticate(self.chef)
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        visible_ids = {item['id'] for item in response.data}
        self.assertIn(str(own.id), visible_ids)
        self.assertNotIn(str(other.id), visible_ids)

    def test_forced_password_change_blocks_normal_api_access(self):
        self.consultant.doit_changer_mot_de_passe = True
        self.consultant.save(update_fields=['doit_changer_mot_de_passe'])
        self.client.force_authenticate(self.consultant)
        response = self.client.get('/api/taches/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_project_domains_and_business_validation_are_exposed(self):
        self.client.force_authenticate(self.direction)
        response = self.client.get(f'/api/projets/{self.projet.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['domaine'], ['Conseil'])
        updated = self.client.patch(
            f'/api/projets/{self.projet.id}/',
            {'domaine': ['AgriTech', 'IoT']},
            format='json',
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(updated.data['domaine'], ['AgriTech', 'IoT'])
        invalid = self.client.patch(
            f'/api/projets/{self.projet.id}/',
            {'date_fin_prevue': '2025-12-31', 'budget': '-1'},
            format='json',
        )
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_excel_import_does_not_create_unusable_accounts(self):
        before = Utilisateur.objects.count()
        user, error = resoudre_utilisateur_existant('nouveau-client@ramaqs.test', 'client')
        self.assertIsNone(user)
        self.assertIn('Créez et approuvez', error)
        self.assertEqual(Utilisateur.objects.count(), before)

    def test_unreleased_finance_and_resource_endpoints_are_not_public(self):
        self.client.force_authenticate(self.direction)
        for endpoint in ('/api/budgets/', '/api/kpis/', '/api/ressources/'):
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.client.get(endpoint).status_code, status.HTTP_404_NOT_FOUND)

    @patch('ramaqs_management_plateforme.services.email_service.send_mail')
    def test_approval_email_uses_the_configured_sender(self, mock_send_mail):
        mock_send_mail.return_value = 1
        self.assertTrue(EmailService.send_approval_email(self.consultant, 'Consultant'))
        self.assertEqual(mock_send_mail.call_args.kwargs['from_email'], settings.DEFAULT_FROM_EMAIL)

    def test_document_upload_rejects_an_executable_disguised_as_document(self):
        self.client.force_authenticate(self.consultant)
        malicious_file = SimpleUploadedFile(
            'payload.exe', b'MZ malicious executable', content_type='application/octet-stream'
        )
        response = self.client.post(
            '/api/documents/',
            {
                'nom': 'Fichier interdit',
                'type': 'document',
                'projet': str(self.projet.id),
                'fichier': malicious_file,
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('ramaqs_management_plateforme.views.send_mail')
    def test_password_reset_creates_single_use_token_without_disclosing_account(self, mock_send_mail):
        mock_send_mail.return_value = 1
        response = self.client.post(
            '/api/auth/forgot-password/',
            {'email': self.consultant.email},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PasswordResetToken.objects.filter(user=self.consultant, used=False).count(), 1)
        mock_send_mail.assert_called_once()
        self.assertNotIn(self.password, mock_send_mail.call_args.kwargs['message'])
        self.assertIn('Réinitialiser mon mot de passe', mock_send_mail.call_args.kwargs['html_message'])
        self.assertEqual(mock_send_mail.call_args.kwargs['from_email'], settings.DEFAULT_FROM_EMAIL)
