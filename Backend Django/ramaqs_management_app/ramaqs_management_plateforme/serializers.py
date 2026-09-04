from email import message
from turtle import title

from rest_framework import serializers
from .models import (
    Projet, Tache, SousTache, Document, Commentaire,
    Notification, Conversation, Message, Kpi, Budget,
    Ressource, Utilisateur, Tenant, TenantMembership,
    Direction, ChefProjet, Consultant, Client, Partenaire
)

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Avg
# serializers.py
from .services.notification_service import NotificationService
# serializers.py
from rest_framework import serializers
from .models import Document, Notification, Utilisateur, Projet
from .services.notification_service import NotificationService
from ramaqs_management_plateforme.models import Tenant
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
        read_only_fields = ['id', 'date_creation', 'dernier_connexion']

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'nom', 'slug', 'secteur_activite', 'logo', 'date_creation', 'actif']
        read_only_fields = ['id', 'date_creation']


class TenantMembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    tenant_nom = serializers.ReadOnlyField(source='tenant.nom')
    
    class Meta:
        model = TenantMembership
        fields = ['id', 'user', 'user_email', 'tenant', 'tenant_nom', 'role', 'date_joined']
        read_only_fields = ['id', 'date_joined']


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
            # En cas d'erreur, retourner une liste vide
            print(f"Erreur dans get_chef_projet_noms: {e}")
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
    chef_projet_nom = serializers.ReadOnlyField(source='chef_projet.nom', default=None)
    partenaires_noms = serializers.SerializerMethodField()
    avancement_globale = serializers.SerializerMethodField()  # ← Écrase le champ existant
    nombre_membres = serializers.SerializerMethodField()
    
    class Meta:
        model = Projet
        fields = ['id', 'tenant', 'nom', 'description', 'objectsif', 'date_debut',
                  'date_fin_prevue', 'date_fin_reelle', 'budget', 'statut',
                  'avancement_globale', 'client', 'client_nom', 'chef_projet',
                  'chef_projet_nom', 'partenaires', 'partenaires_noms', 'domaine','nombre_membres']
        read_only_fields = ['id', 'tenant']
    
    def get_partenaires_noms(self, obj):
        return [p.nom for p in obj.partenaires.all()]
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
        # Pour le formulaire HTML de DRF, limiter les choix aux utilisateurs avec rôle partenaire
        if 'request' in self.context:
            tenant = Tenant.objects.first()
            self.fields['partenaires'].queryset = Utilisateur.objects.filter(
                role='partenaire',
                memberships__tenant=tenant
            )

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
        fields = ['id', 'tenant', 'titre', 'description', 'priorite', 'avancement',
                  'date_debut', 'date_fin_prevue', 'date_fin_reelle', 'statut',
                  'projet', 'projet_nom', 'consultant', 'consultant_nom']
        read_only_fields = ['id', 'tenant']

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

        print(f"[SERIALIZER] Tâche: {instance.titre}")
        print(f"[SERIALIZER] Ancien statut: '{ancien_statut}'")
        print(f"[SERIALIZER] Nouveau statut: '{nouvel_statut}'")
        print(f"[SERIALIZER] Changement statut: {ancien_statut != nouvel_statut}")
        
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
            print(f"[SERIALIZER]  Tâche passée en 'en_attente_validation'")

        # Logique d'avancement automatique selon le statut
        if nouvel_statut == 'a_faire':
            validated_data['avancement'] = 0
        elif nouvel_statut == 'termine':
            validated_data['avancement'] = 100
        
        # Sauvegarde
        instance = super().update(instance, validated_data)
        
        # Récupérer l'utilisateur depuis le contexte
        request = self.context.get('request')
        print(f"[SERIALIZER] Contexte request présent: {request is not None}")
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
    
    
    #  Ajouter le tenant
        request = self.context.get('request')
        if request and hasattr(request, 'tenant'):
            validated_data['tenant'] = request.tenant
            print(f"Tenant ajouté: {request.tenant}")
    
    # UNE SEULE CRÉATION
        instance = super().create(validated_data)
        print(f"Instance créée avec ID: {instance.id}")
    
      # NOTIFICATION : Nouvelle tâche créée
        utilisateur = request.user if request and hasattr(request, 'user') else None
        if utilisateur:
            NotificationService.notifier_creation_tache(
                tache=instance,
                utilisateur=utilisateur
            )

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
        fields = ['id', 'tenant', 'titre', 'statut', 'avancement', 'date_echeance',
                  'tache', 'tache_titre']
        read_only_fields = ['id', 'tenant']


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
        read_only_fields = ['id', 'chemin', 'taille', 'taille_formatee', 'projet_nom', 'uploaded_by_nom', 'date_upload']

    def get_chemin(self, obj):
        request = self.context.get('request')
        if obj.fichier and request:
            return request.build_absolute_uri(obj.fichier.url)
        return obj.fichier.url if obj.fichier else None

    def get_taille_formatee(self, obj):
        if not obj.taille:
            return "—"
        size = obj.taille
        for unit in ['o', 'Ko', 'Mo', 'Go']:
            if size < 1024:
                return f"{size:.0f} {unit}" if unit == 'o' else f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} To"

class CommentaireSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.ReadOnlyField(source='utilisateur.nom')
    tache_titre = serializers.ReadOnlyField(source='tache.titre')
    
    class Meta:
        model = Commentaire
        fields = ['id', 'tenant', 'contenu', 'date_publication', 'utilisateur',
                  'utilisateur_nom', 'tache', 'tache_titre']
        read_only_fields = ['id', 'tenant', 'date_publication']


# ========== NOTIFICATIONS ==========

class NotificationSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.ReadOnlyField(source='utilisateur.nom')
    
    class Meta:
        model = Notification
        fields = ['id', 'tenant', 'type', 'titre', 'message', 'lue',
                  'date_envoi', 'utilisateur', 'utilisateur_nom']
        read_only_fields = ['id', 'tenant', 'date_envoi']


# ========== CONVERSATIONS & MESSAGES ==========

class ConversationSerializer(serializers.ModelSerializer):
    projet_nom = serializers.ReadOnlyField(source='projet.nom')
    dernier_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'tenant', 'titre', 'date_creation', 'date_dernier_message',
                  'projet', 'projet_nom', 'dernier_message']
        read_only_fields = ['id', 'tenant', 'date_creation', 'date_dernier_message']
    
    def get_dernier_message(self, obj):
        dernier = obj.messages.order_by('-date_envoi').first()
        if dernier:
            return {
                'contenu': dernier.contenu[:50],
                'date': dernier.date_envoi,
                'expediteur': dernier.expediteur.nom
            }
        return None


class MessageSerializer(serializers.ModelSerializer):
    expediteur_nom = serializers.ReadOnlyField(source='expediteur.nom')
    
    class Meta:
        model = Message
        fields = ['id', 'tenant', 'contenu', 'date_envoi', 'lu', 'type_message',
                  'conversation', 'expediteur', 'expediteur_nom']
        read_only_fields = ['id', 'tenant', 'date_envoi']


# ========== KPI & BUDGET ==========

class KpiSerializer(serializers.ModelSerializer):
    projet_nom = serializers.ReadOnlyField(source='projet.nom')
    
    class Meta:
        model = Kpi
        fields = ['id', 'tenant', 'nom', 'valeur_cible', 'valeur_actuelle',
                  'unite', 'seuil_alerte', 'projet', 'projet_nom']
        read_only_fields = ['id', 'tenant']


class BudgetSerializer(serializers.ModelSerializer):
    projet_nom = serializers.ReadOnlyField(source='projet.nom')
    
    class Meta:
        model = Budget
        fields = ['id', 'tenant', 'montant_total', 'montant_depense', 
                  'montant_restant', 'devise', 'projet', 'projet_nom']
        read_only_fields = ['id', 'tenant']


# ========== RESSOURCES ==========

class RessourceSerializer(serializers.ModelSerializer):
    projets_noms = serializers.SerializerMethodField()
    
    class Meta:
        model = Ressource
        fields = ['id', 'tenant', 'type', 'nom', 'cout_unitaire', 'disponible', 
                  'projet', 'projets_noms']
        read_only_fields = ['id', 'tenant']
    
    def get_projets_noms(self, obj):
        return [p.nom for p in obj.projet.all()]
    

# ramaqs_management_plateforme/serializers.py

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework import serializers

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    def validate(self, attrs):
        print(f"Données reçues: {attrs}")
        
        # Récupérer l'email et le password
        email = attrs.get('email', attrs.get('username'))
        password = attrs.get('password')
        print(f"Tentative de connexion: email={email}")
        print(f"Longueur du mot de passe: {len(password) if password else 0}")
        
        #  Vérifier si l'utilisateur existe
        from ramaqs_management_plateforme.models import Utilisateur
        from django.contrib.auth.hashers import check_password
        from rest_framework_simplejwt.tokens import RefreshToken
        
        try:
            user = Utilisateur.objects.get(email=email)
            print(f"Utilisateur trouvé dans la base:")
            print(f"   - Email: {user.email}")
            print(f"   - statut_approbation: {user.statut_approbation}")
            print(f"   - is_active: {user.is_active}")
        except Utilisateur.DoesNotExist:
            print(f"Aucun utilisateur trouvé avec l'email: '{email}'")
            raise serializers.ValidationError('Email ou mot de passe incorrect')
        
        # Vérifier le mot de passe
        password_correct = check_password(password, user.password)
        print(f"Résultat check_password: {password_correct}")
        
        if not password_correct:
            print(f" Mot de passe incorrect pour: {email}")
            raise serializers.ValidationError('Email ou mot de passe incorrect')
        
        print("Mot de passe correct!")
        
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
        
        print(f"Utilisateur authentifié: {user.email}, rôle: {user.role}")
        
        # Générer les tokens
        refresh = RefreshToken.for_user(user)
        
        # Récupérer le membership
        membership = None
        if hasattr(user, 'memberships') and user.memberships.exists():
            membership = user.memberships.first()
        
        # Structure de la réponse
        data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'nom': user.nom,
                'email': user.email,
                'role': membership.role if membership else user.role,
                'is_active': user.is_active,
                'statut_approbation': user.statut_approbation,
            }
        }
        
        # Vérifier si l'utilisateur doit changer son mot de passe
        if hasattr(user, 'doit_changer_mot_de_passe') and user.doit_changer_mot_de_passe:
            data['doit_changer_mot_de_passe'] = True
        
        # Ajouter les infos tenant si disponible
        if membership and membership.tenant:
            data['tenant'] = {
                'id': str(membership.tenant.id),
                'nom': membership.tenant.nom,
                'slug': getattr(membership.tenant, 'slug', None),
            }
        
        print(f"✅ Connexion réussie pour {user.email}")
        print("=" * 60)
        
        return data