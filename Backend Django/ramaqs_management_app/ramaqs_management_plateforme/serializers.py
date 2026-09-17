from rest_framework import serializers
from .models import (
    Projet, Tache, SousTache, Document, Commentaire,
    Notification, Kpi, Budget,
    Ressource, Utilisateur,
    Direction, ChefProjet, Consultant, Client, Partenaire
)

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Avg
from django.urls import reverse
# serializers.py
from .services.notification_service import NotificationService
# serializers.py
from rest_framework import serializers
from .models import Document, Notification, Utilisateur, Projet
from .services.notification_service import NotificationService
from rest_framework import serializers
from .models import Utilisateur, Tache

# ========== UTILISATEUR & TENANT ==========

class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = [
            'id', 
            'username',
            'nom', 
            'email', 
            'telephone', 
            'photo_profil', 
            'date_creation', 
            'dernier_connexion', 
            'actif',
            'role',
            'statut_approbation',
            'justification_rejet',
            'date_approbation',
            'approuve_par',
            'is_active',
            'entreprise',
            'poste',
            'doit_changer_mot_de_passe', 
        ]
        read_only_fields = [
            'id', 
            'date_creation', 
            'dernier_connexion', 
            'role', 
            'statut_approbation', 
            'justification_rejet', 
            'date_approbation', 
            'approuve_par', 
            'is_active', 
            'doit_changer_mot_de_passe'
        ]

# ========== MODÈLES SPÉCIFIQUES (HÉRITENT DE UTILISATEUR) ==========

class DirectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Direction
        fields = ['id', 'nom', 'email', 'telephone', 'photo_profil', 
                   'date_creation', 'actif']
        read_only_fields = ['id', 'date_creation']


class ChefProjetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChefProjet
        fields = ['id', 'nom', 'email', 'telephone', 'photo_profil',
                    'date_creation', 'actif']
        read_only_fields = ['id', 'date_creation']




class ConsultantSerializer(serializers.ModelSerializer):
    chef_projet_noms = serializers.SerializerMethodField()
    nombre_taches = serializers.SerializerMethodField()
    avancement_moyen = serializers.SerializerMethodField()
    
    class Meta:
        model = Utilisateur
        fields = [
            'id', 
            'nom', 
            'email', 
            'telephone', 
            'photo_profil',
            'entreprise', 
            'poste',
            'role',
            'chef_projet_noms',
            'nombre_taches',
            'avancement_moyen',
            'date_creation', 
            'actif'
        ]
        read_only_fields = ['id', 'date_creation']
    
    # ✅ OU - Récupérer tous les chefs
    def get_chef_projet_noms(self, obj):
        try:
            # ✅ Récupérer les tâches du consultant
            taches = obj.taches.all()
            chefs_noms = set()  # Utiliser un set pour éviter les doublons
            
            for tache in taches:
                if hasattr(tache, 'projet') and tache.projet:
                    # ✅ Récupérer les chefs du projet via la relation ManyToMany
                    chefs = tache.projet.chef_projet.all()
                    for chef in chefs:
                        if chef.nom:
                            chefs_noms.add(chef.nom)
            
            return list(chefs_noms) if chefs_noms else []
            
        except Exception as e:
            
            
            return []
    def get_nombre_taches(self, obj):
        """Nombre total de tâches assignées à ce consultant"""
        return obj.taches.count()
    
    def get_avancement_moyen(self, obj):
        """Avancement moyen des tâches du consultant"""
        taches = obj.taches.all()
        if taches.exists():
            avg = taches.aggregate(avg_avancement=Avg('avancement'))['avg_avancement']
            return round(avg or 0, 1)
        return 0


# serializers.py
from rest_framework import serializers
from .models import Client

class ClientSerializer(serializers.ModelSerializer):
    status_label = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = [
            'id', 
            'nom', 
            'email', 
            'telephone', 
            'photo_profil',
            'entreprise',        # ← au lieu de 'societe'
            'poste',
            'statut_approbation',
            'status_label',
            'justification_rejet',
            'date_creation', 
            'actif'
        ]
        read_only_fields = ['id', 'date_creation', 'statut_approbation']
    
    def get_status_label(self, obj):
        labels = {
            'pending': 'En attente',
            'approved': 'Approuvé',
            'rejected': 'Rejeté',
            None: 'En attente'
        }
        return labels.get(getattr(obj, 'statut_approbation', None), 'En attente')


class PartenaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partenaire
        fields = ['id', 'nom', 'email', 'telephone', 'photo_profil',
                    'date_debut_partenariat', 'date_fin_partenariat', 'date_creation', 'actif']
        read_only_fields = ['id', 'date_creation', 'date_debut_partenariat']


# ========== PROJET & TÂCHES ==========

class ProjetSerializer(serializers.ModelSerializer):
    client_nom = serializers.ReadOnlyField(source='client.nom', default=None)
    chef_projet_nom = serializers.SerializerMethodField()
    partenaires_noms = serializers.SerializerMethodField()
    avancement_globale = serializers.SerializerMethodField()  # ← Écrase le champ existant
    nombre_membres = serializers.SerializerMethodField()
    
    class Meta:
        model = Projet
        fields = ['id', 'nom', 'description', 'objectsif', 'date_debut',
                  'date_fin_prevue', 'date_fin_reelle', 'budget', 'statut',
                  'avancement_globale', 'client', 'client_nom', 'chef_projet',
                  'chef_projet_nom', 'partenaires', 'partenaires_noms', 'domaine',
                  'priorite', 'nombre_membres']
        read_only_fields = ['id']
    
    def get_partenaires_noms(self, obj):
        return [p.nom for p in obj.partenaires.all()]

    def get_chef_projet_nom(self, obj):
        return ', '.join(chef.nom for chef in obj.chef_projet.all())

    def get_avancement_globale(self, obj):
        """Calcule l'avancement moyen des tâches du projet"""
        taches = obj.taches.all()
        if taches.exists():
            avg = taches.aggregate(avg_avancement=Avg('avancement'))['avg_avancement']
            return round(avg or 0, 1)
        return 0
    
    def get_nombre_membres(self, obj):
        """Calcule le nombre total de membres (chef + consultants)"""
        membres = set()
        
        #  CHEF PROJET (ManyToManyField)
        if hasattr(obj, 'chef_projet'):
          for chef in obj.chef_projet.all():
            membres.add(chef.id)
    
         #  PARTENAIRES (ManyToManyField)
        if hasattr(obj, 'partenaires'):
          for partenaire in obj.partenaires.all():
            membres.add(partenaire.id)
        
         #  CONSULTANTS (via les tâches)
        if hasattr(obj, 'taches'):
           consultants = obj.taches.filter(consultant__isnull=False).values_list('consultant', flat=True).distinct()
           for consultant_id in consultants:
            membres.add(consultant_id)
        

        return len(membres)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        self.fields['partenaires'].queryset = Utilisateur.objects.filter(role='partenaire', is_active=True)

    def validate(self, data):
        date_debut = data.get('date_debut', self.instance.date_debut if self.instance else None)
        date_fin = data.get('date_fin_prevue', self.instance.date_fin_prevue if self.instance else None)
        budget = data.get('budget', self.instance.budget if self.instance else None)
        if date_debut and date_fin and date_fin < date_debut:
            raise serializers.ValidationError({'date_fin_prevue': 'La date de fin doit être postérieure à la date de début.'})
        if budget is not None and budget < 0:
            raise serializers.ValidationError({'budget': 'Le budget ne peut pas être négatif.'})
        return data

    # serializers.py
from rest_framework import serializers
from django.db import models
from .models import Tache, Notification, Utilisateur, Projet
from .services.notification_service import NotificationService

# serializers.py
from rest_framework import serializers
from django.db import models
from .models import Tache, Notification, Utilisateur, Projet
from .services.notification_service import NotificationService

class TacheSerializer(serializers.ModelSerializer):
    projet_nom = serializers.ReadOnlyField(source='projet.nom')
    consultant_nom = serializers.ReadOnlyField(source='consultant.nom', default=None)
    
    class Meta:
        model = Tache
        fields = ['id', 'titre', 'description', 'priorite', 'avancement',
                  'date_debut', 'date_fin_prevue', 'date_fin_reelle', 'statut',
                  'projet', 'projet_nom', 'consultant', 'consultant_nom']
        read_only_fields = ['id']

    def update(self, instance, validated_data):
                    
        # Sauvegarder les anciennes valeurs
        ancien_statut = instance.statut
        ancien_avancement = instance.avancement
        ancien_titre = instance.titre
        ancien_consultant = instance.consultant
        ancien_priorite = instance.priorite
        
        nouvel_statut = validated_data.get('statut', instance.statut)
        nouvel_avancement = validated_data.get('avancement', instance.avancement)
        nouvel_titre = validated_data.get('titre', instance.titre)
        nouvel_consultant = validated_data.get('consultant', instance.consultant)
        nouvel_priorite = validated_data.get('priorite', instance.priorite)

       
        
        # Liste des champs modifiés (pour notification générale)
        champs_modifies = []
        if ancien_titre != nouvel_titre:
            champs_modifies.append("titre")
        if ancien_consultant != nouvel_consultant:
            champs_modifies.append("consultant assigné")
        if ancien_priorite != nouvel_priorite:
            champs_modifies.append("priorité")
        #  AJOUTER LA GESTION DU STATUT EN_ATTENTE_VALIDATION
        if nouvel_avancement == 100 and nouvel_statut in ['a_faire', 'en_cours']:
            validated_data['statut'] = 'en_attente_validation'
            

        # Logique d'avancement automatique selon le statut
        if nouvel_statut == 'a_faire':
            validated_data['avancement'] = 0
        elif nouvel_statut == 'termine':
            validated_data['avancement'] = 100
        
        # Sauvegarde
        instance = super().update(instance, validated_data)
        
        # Récupérer l'utilisateur depuis le contexte
        request = self.context.get('request')
        
        utilisateur = request.user if request and hasattr(request, 'user') else None
        
        if not utilisateur:
            return instance
         # NOTIFICATION : Changement de statut (incluant 'en_attente_validation')
        if ancien_statut != nouvel_statut:
          NotificationService.notifier_changement_statut_tache(
            tache=instance,
            ancien_statut=ancien_statut,
            nouveau_statut=nouvel_statut,
            utilisateur=utilisateur
        )
        
        
        # NOTIFICATION : Modification générale
        if champs_modifies:
            NotificationService.notifier_modification_tache(
                tache=instance,
                utilisateur=utilisateur,
                champs_modifies=champs_modifies
            )
        
        # NOTIFICATION : Avancement significatif (25% ou plus)
        if abs(nouvel_avancement - ancien_avancement) >= 25:
            NotificationService.notifier_avancement_tache(
                tache=instance,
                ancien_avancement=ancien_avancement,
                nouvel_avancement=nouvel_avancement,
                utilisateur=utilisateur
            )
        
        #  Mettre à jour l'avancement du projet
        self.mettre_a_jour_avancement_projet(instance.projet)
        
        return instance
    def create(self, validated_data):
    
    
        request = self.context.get('request')
    
    # UNE SEULE CRÉATION
        instance = super().create(validated_data)
       
    
      # NOTIFICATION : Nouvelle tâche créée
        utilisateur = request.user if request and hasattr(request, 'user') else None
        if utilisateur:
            NotificationService.notifier_creation_tache(
                tache=instance,
                utilisateur=utilisateur
            )

        self.mettre_a_jour_avancement_projet(instance.projet)

        return instance  
    

    
    def delete(self, instance):
        """Méthode appelée avant la suppression"""
        projet = instance.projet
        
        # Récupérer l'utilisateur depuis le contexte
        request = self.context.get('request')
        utilisateur = request.user if request and hasattr(request, 'user') else None
        
        # NOTIFICATION : Suppression de tâche
        if utilisateur:
            NotificationService.notifier_suppression_tache(
                tache=instance,
                utilisateur=utilisateur
            )
        
        # Mettre à jour l'avancement du projet après suppression
        self.mettre_a_jour_avancement_projet(projet)
        
        return instance
    
    def mettre_a_jour_avancement_projet(self, projet):
        """Met à jour l'avancement du projet et son statut"""
        taches = projet.taches.all()
        if taches.exists():
            # Calculer l'avancement moyen
            avancement_moyen = taches.aggregate(
                avg_avancement=models.Avg('avancement')
            )['avg_avancement'] or 0
            
            projet.avancement_globale = round(avancement_moyen, 1)
            
            # Logique : Si avancement = 100% et toutes les tâches sont terminées
            toutes_terminees = all(t.statut == 'termine' for t in taches)
            
            if projet.avancement_globale == 100 and toutes_terminees:
                if projet.statut != 'termine':
                    projet.statut = 'termine'
                    projet.save()
                    from .services.notification_service import NotificationService
                    NotificationService.notifier_fin_projet(projet)
                    return
            elif projet.avancement_globale < 100 and projet.statut == 'termine':
                projet.statut = 'en_cours'
            projet.save()
        else:
            projet.avancement_globale = 0
            if projet.statut == 'termine':
                projet.statut = 'en_cours'
            projet.save(update_fields=['avancement_globale', 'statut'])
    

    # VALIDATION DU STATUT
    def validate_statut(self, value):
        """Valider que le statut est valide"""
        valid_statuses = ['a_faire', 'en_cours', 'en_attente_validation', 'termine']
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Statut invalide. Choisissez parmi: {', '.join(valid_statuses)}"
            )
        return value
     # VALIDATION DE L'AVANCEMENT AVEC LE STATUT
    def validate(self, data):
        """Validation croisée entre avancement et statut"""
        avancement = data.get('avancement', self.instance.avancement if self.instance else 0)
        statut = data.get('statut', self.instance.statut if self.instance else 'a_faire')

        if avancement < 0 or avancement > 100:
            raise serializers.ValidationError({'avancement': "L'avancement doit être compris entre 0 et 100."})

     # Si avancement = 100 et statut = 'a_faire' ou 'en_cours' -> passer en 'en_attente_validation'
        if avancement == 100 and statut in ['a_faire', 'en_cours']:
            data['statut'] = 'en_attente_validation'
        
        # Si avancement < 100 et statut = 'termine' -> erreur
        if avancement < 100 and statut == 'termine':
            raise serializers.ValidationError({
                'statut': 'Une tâche ne peut pas être terminée avec un avancement inférieur à 100%'
            })
     # Si avancement < 100 et statut = 'en_attente_validation' -> rejeter
        if avancement < 100 and statut == 'en_attente_validation':
            raise serializers.ValidationError({
                'statut': 'Une tâche en attente de validation doit avoir 100% d\'avancement'
            })
        
        return data

class SousTacheSerializer(serializers.ModelSerializer):
    tache_titre = serializers.ReadOnlyField(source='tache.titre')
    
    class Meta:
        model = SousTache
        fields = ['id', 'titre', 'statut', 'avancement', 'date_echeance',
                  'tache', 'tache_titre']
        read_only_fields = ['id']


# ========== DOCUMENTS & COMMENTAIRES ==========


class DocumentSerializer(serializers.ModelSerializer):
    fichier = serializers.FileField(write_only=True)
    chemin = serializers.SerializerMethodField()
    taille_formatee = serializers.SerializerMethodField()
    projet_nom = serializers.CharField(source='projet.nom', read_only=True)
    uploaded_by_nom = serializers.CharField(source='uploaded_by.nom', read_only=True, default='—')

    class Meta:
        model = Document
        fields = [
            'id', 'nom', 'description', 'type', 'fichier', 'chemin',
            'taille', 'taille_formatee', 'version',
            'projet', 'projet_nom', 'uploaded_by', 'uploaded_by_nom', 'date_upload',
        ]
        read_only_fields = ['id', 'chemin', 'taille', 'taille_formatee', 'projet_nom', 'uploaded_by', 'uploaded_by_nom', 'date_upload']

    def get_chemin(self, obj):
        request = self.context.get('request')
        if not obj.fichier:
            return None
        url = reverse('document-download', kwargs={'pk': obj.id})
        return request.build_absolute_uri(url) if request else url

    def get_taille_formatee(self, obj):
        if not obj.taille:
            return "—"
        size = obj.taille
        for unit in ['o', 'Ko', 'Mo', 'Go']:
            if size < 1024:
                return f"{size:.0f} {unit}" if unit == 'o' else f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} To"

    def validate_fichier(self, fichier):
        allowed_extensions = {'.pdf', '.docx', '.xlsx', '.pptx', '.png', '.jpg', '.jpeg'}
        allowed_content_types = {
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/png', 'image/jpeg',
        }
        name = fichier.name.lower()
        extension = '.' + name.rsplit('.', 1)[-1] if '.' in name else ''
        if extension not in allowed_extensions or fichier.content_type not in allowed_content_types:
            raise serializers.ValidationError("Type de fichier non autorisé.")
        if fichier.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Le fichier ne doit pas dépasser 10 Mo.")
        signatures = {
            '.pdf': (b'%PDF-',),
            '.png': (b'\x89PNG\r\n\x1a\n',),
            '.jpg': (b'\xff\xd8\xff',),
            '.jpeg': (b'\xff\xd8\xff',),
            # Les formats Office Open XML sont des archives ZIP.
            '.docx': (b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08'),
            '.xlsx': (b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08'),
            '.pptx': (b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08'),
        }
        try:
            header = fichier.read(8)
            fichier.seek(0)
        except (AttributeError, OSError) as exc:
            raise serializers.ValidationError("Le fichier est illisible.") from exc
        if not header.startswith(signatures[extension]):
            raise serializers.ValidationError("Le contenu du fichier ne correspond pas à son type déclaré.")
        return fichier

class CommentaireSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.ReadOnlyField(source='utilisateur.nom')
    tache_titre = serializers.ReadOnlyField(source='tache.titre')
    
    class Meta:
        model = Commentaire
        fields = ['id', 'contenu', 'date_publication', 'utilisateur',
                  'utilisateur_nom', 'tache', 'tache_titre']
        read_only_fields = ['id', 'date_publication']


# ========== NOTIFICATIONS ==========

class NotificationSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.ReadOnlyField(source='utilisateur.nom')
    
    class Meta:
        model = Notification
        fields = ['id', 'type', 'titre', 'message', 'lue', 'lien_action',
                  'entite_id', 'entite_type', 'projet', 'date_envoi',
                  'utilisateur', 'utilisateur_nom']
        read_only_fields = ['id', 'date_envoi', 'utilisateur']


# ========== KPI & BUDGET ==========

class KpiSerializer(serializers.ModelSerializer):
    projet_nom = serializers.ReadOnlyField(source='projet.nom')
    
    class Meta:
        model = Kpi
        fields = ['id', 'nom', 'valeur_cible', 'valeur_actuelle',
                  'unite', 'seuil_alerte', 'projet', 'projet_nom']
        read_only_fields = ['id']


class BudgetSerializer(serializers.ModelSerializer):
    projet_nom = serializers.ReadOnlyField(source='projet.nom')
    
    class Meta:
        model = Budget
        fields = ['id', 'montant_total', 'montant_depense', 
                  'montant_restant', 'devise', 'projet', 'projet_nom']
        read_only_fields = ['id']


# ========== RESSOURCES ==========

class RessourceSerializer(serializers.ModelSerializer):
    projets_noms = serializers.SerializerMethodField()
    
    class Meta:
        model = Ressource
        fields = ['id', 'type', 'nom', 'cout_unitaire', 'disponible', 
                  'projet', 'projets_noms']
        read_only_fields = ['id']
    
    def get_projets_noms(self, obj):
        return [p.nom for p in obj.projet.all()]
    

# ramaqs_management_plateforme/serializers.py

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework import serializers

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    def validate(self, attrs):
        
        # Récupérer l'email et le password
        email = attrs.get('email', attrs.get('username'))
        password = attrs.get('password')
        
        
        #  Vérifier si l'utilisateur existe
        from ramaqs_management_plateforme.models import Utilisateur
        from django.contrib.auth.hashers import check_password
        from rest_framework_simplejwt.tokens import RefreshToken
        
        try:
            user = Utilisateur.objects.get(email=email)
           
        except Utilisateur.DoesNotExist:
            
            raise serializers.ValidationError('Email ou mot de passe incorrect')
        
        # Vérifier le mot de passe
        password_correct = check_password(password, user.password)
        
        
        if not password_correct:
            
            raise serializers.ValidationError('Email ou mot de passe incorrect')
        
        
        
        # VÉRIFIER PENDING (UN SEUL BLOC, AVANT is_active)
        if user.statut_approbation == 'pending':
            raise serializers.ValidationError(
                'Votre compte est en attente d\'approbation. '
                'Vous recevrez un email une fois votre compte validé par la direction.'
            )
        
        # Vérifier rejected
        if user.statut_approbation == 'rejected':
            raise serializers.ValidationError(
                'Votre compte a été rejeté. Veuillez contacter l\'administrateur.'
            )
        
        # Vérifier is_active (après pending et rejected)
        if not user.is_active:
            raise serializers.ValidationError('Compte désactivé')
        
        
        
        # Générer les tokens
        refresh = RefreshToken.for_user(user)
        
        # Structure de la réponse
        data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'nom': user.nom,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active,
                'statut_approbation': user.statut_approbation,
            }
        }
        
        # Vérifier si l'utilisateur doit changer son mot de passe
        if hasattr(user, 'doit_changer_mot_de_passe') and user.doit_changer_mot_de_passe:
            data['doit_changer_mot_de_passe'] = True
        
        return data
