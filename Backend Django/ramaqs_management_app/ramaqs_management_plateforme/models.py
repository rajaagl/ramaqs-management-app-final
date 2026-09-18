from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.utils import timezone

# ========== MANAGERS PERSONNALISÉS POUR PROXY MODELS ==========
class ClientManager(models.Manager):
    """Manager pour le modèle Client - Filtre sur role='client'"""
    def get_queryset(self):
        return super().get_queryset().filter(role='client')
    
    def approuves(self):
        return self.get_queryset().filter(statut_approbation='approved')
    
    def en_attente(self):
        return self.get_queryset().filter(statut_approbation='pending')
    
    def actifs(self):
        return self.get_queryset().filter(actif=True)

class ChefProjetManager(models.Manager):
    """Manager pour le modèle ChefProjet - Filtre sur role='chef_projet'"""
    def get_queryset(self):
        return super().get_queryset().filter(role='chef_projet')

class ConsultantManager(models.Manager):
    """Manager pour le modèle Consultant - Filtre sur role='consultant'"""
    def get_queryset(self):
        return super().get_queryset().filter(role='consultant')

class PartenaireManager(models.Manager):
    """Manager pour le modèle Partenaire - Filtre sur role='partenaire'"""
    def get_queryset(self):
        return super().get_queryset().filter(role='partenaire')

class DirectionManager(models.Manager):
    """Manager pour le modèle Direction - Filtre sur role='direction'"""
    def get_queryset(self):
        return super().get_queryset().filter(role='direction')

# ========== RÔLES DÉFINIS ==========

class RoleChoices(models.TextChoices):
    """Les 6 rôles de votre plateforme"""
    SUPER_ADMIN = 'super_admin', 'Super Administrateur RAMAQS'
    DIRECTION = 'direction', 'Direction RAMAQS'
    CHEF_PROJET = 'chef_projet', 'Chef de projet'
    CONSULTANT = 'consultant', 'Consultant'
    CLIENT = 'client', 'Client'
    PARTENAIRE = 'partenaire', 'Partenaire'


# ========== UTILISATEUR ==========

class Utilisateur(AbstractUser):
    """Modèle utilisateur unifié"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=100)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    photo_profil = models.ImageField(upload_to='photos_profils/', null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    dernier_connexion = models.DateTimeField(auto_now=True)
    actif = models.BooleanField(default=True)
    entreprise = models.CharField(max_length=100, blank=True, null=True)
    poste = models.CharField(max_length=100, blank=True, null=True)
    ROLE_CHOICES = [
        ('super_admin', 'Super Administrateur RAMAQS'),
        ('direction', 'Direction'),
        ('chef_projet', 'Chef de projet'),
        ('consultant', 'Consultant'),
        ('client', 'Client'),
        ('partenaire', 'Partenaire'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='consultant') 
    date_debut_partenariat = models.DateField(blank=True, null=True)
    date_fin_partenariat = models.DateField(blank=True, null=True)
    
    doit_changer_mot_de_passe = models.BooleanField(default=False)
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='utilisateur_set',
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='utilisateur_set',
        blank=True,
    )
    
    class Meta:
         db_table = 'ramaqs_management_plateforme_utilisateur'  # ← Nom exact de votre table
    
    def __str__(self):
        return self.email
    
    def is_super_admin(self):
        return self.is_superuser or self.role == RoleChoices.SUPER_ADMIN
    
    # Pour la gestion des clients
    statut_approbation = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'En attente'),
            ('approved', 'Approuvé'),
            ('rejected', 'Rejeté'),
        ],
        default='approved',
        blank=True,
        null=True
    )
    justification_rejet = models.TextField(blank=True, null=True)
    date_approbation = models.DateTimeField(blank=True, null=True)
    approuve_par = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='clients_approuves'
    )


# ========== MODÈLES SPÉCIFIQUES (PROXY) ==========

class Direction(Utilisateur):
    objects = DirectionManager()  # ✅ AJOUTER CETTE LIGNE
    class Meta:
        proxy = True
        default_manager_name = 'objects'  # ✅ FORCE L'UTILISATION DU MANAGER
    
    def __str__(self):
        return f"{self.nom} - Direction"


class ChefProjet(Utilisateur):
    objects = ChefProjetManager()  # ✅ AJOUTER CETTE LIGNE
    class Meta:
        proxy = True
        default_manager_name = 'objects'  # ✅ FORCE L'UTILISATION DU MANAGER
    
    def __str__(self):
        return f"{self.nom} - Chef de projet"


class Consultant(Utilisateur):
    objects = ConsultantManager()  # ✅ AJOUTER CETTE LIGNE
    class Meta:
        proxy = True
        default_manager_name = 'objects'  # ✅ FORCE L'UTILISATION DU MANAGER
    
    def __str__(self):
        return f"{self.nom} - Consultant"


class Client(Utilisateur):
    objects = ClientManager()  # ✅ AJOUTER CETTE LIGNE
    class Meta:
        proxy = True
        default_manager_name = 'objects'  # ✅ FORCE L'UTILISATION DU MANAGER
    
    def __str__(self):
        return f"{self.nom} - Client"


class Partenaire(Utilisateur):
    objects = PartenaireManager()  # ✅ AJOUTER CETTE LIGNE
    class Meta:
        proxy = True
        default_manager_name = 'objects'  # ✅ FORCE L'UTILISATION DU MANAGER
    
    def __str__(self):
        return f"{self.nom} - Partenaire"

# ========== projet ==========----------------------------------------------------------------------------

class Projet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=100)
    description = models.TextField()
    objectsif = models.CharField(max_length=100)
    date_debut = models.DateField()
    date_fin_prevue = models.DateField()
    date_fin_reelle = models.DateField(null=True, blank=True)
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    statut = models.CharField(max_length=50)
    avancement_globale = models.DecimalField(max_digits=5, decimal_places=2, default=0, null=False, blank=True)
    client = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='projets_client')
    chef_projet = models.ManyToManyField(Utilisateur, related_name='projets_chef')
    partenaires = models.ManyToManyField(Utilisateur, related_name='projets_partenaire', limit_choices_to={'role': 'partenaire'})
    domaine = models.JSONField(default=list, blank=True)
    
    class Meta:
        db_table = 'projets'
    
    def __str__(self):
        return self.nom
#------------------------------------------------tache-------------------------------------------------------------
class Tache(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titre = models.CharField(max_length=100)
    description = models.TextField()
    priorite = models.CharField(max_length=50)
    avancement = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    date_debut = models.DateField()
    date_fin_prevue = models.DateField()
    date_fin_reelle = models.DateField(null=True, blank=True)
    
    STATUT_CHOICES = [
        ('a_faire', 'À faire'),
        ('en_cours', 'En cours'),
        ('en_attente_validation', 'En attente de validation'),  # ← NOUVEAU
        ('termine', 'Terminé'),
    ]
    statut = models.CharField(max_length=50, choices=STATUT_CHOICES, default='a_faire')
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='taches')
    consultant = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='taches')
    
    class Meta:
        db_table = 'taches'
    
    def __str__(self):
        return self.titre

    # ✅ MÉTHODE POUR SOUMETTRE LA TÂCHE À VALIDATION
    def soumettre_validation(self):
        """
        Soumettre la tâche pour validation par le chef de projet
        """
        if self.avancement == 100 and self.statut != 'termine':
            self.statut = 'en_attente_validation'
            self.save()
            return True
        return False
     # ✅ MÉTHODE POUR APPROUVER LA TÂCHE
    def approuver_validation(self):
        """
        Approuver la tâche validée par le consultant
        """
        if self.statut == 'en_attente_validation':
            self.statut = 'termine'
            self.date_fin_reelle = timezone.now().date()
            self.save()
            return True
        return False
    
     # ✅ MÉTHODE POUR REJETER LA TÂCHE
    def rejeter_validation(self):
        """
        Rejeter la tâche validée par le consultant
        """
        if self.statut == 'en_attente_validation':
            self.statut = 'en_cours'
            self.avancement = 90  # Remettre à 90% pour corrections
            self.save()
            return True
        return False
    # ✅ MÉTHODE POUR VÉRIFIER SI LA TÂCHE EST TERMINÉE
    def est_terminee(self):
        """Vérifier si la tâche est terminée"""
        return self.statut == 'termine'
    
    # ✅ MÉTHODE POUR VÉRIFIER SI LA TÂCHE EST EN ATTENTE DE VALIDATION
    def est_en_attente_validation(self):
        """Vérifier si la tâche est en attente de validation"""
        return self.statut == 'en_attente_validation'
    
class SousTache(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titre = models.CharField(max_length=100)
    statut = models.CharField(max_length=50)
    avancement = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    date_echeance = models.DateField()
    tache = models.ForeignKey(Tache, on_delete=models.CASCADE, related_name='sous_taches')
    
    
    class Meta:
        db_table = 'sous_taches'
    
    def __str__(self):
        return self.titre


class Commentaire(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contenu = models.TextField()
    date_publication = models.DateTimeField(auto_now_add=True)
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    tache = models.ForeignKey(Tache, on_delete=models.CASCADE, related_name='commentaires')
    
    
    class Meta:
        db_table = 'commentaires'
    
    def __str__(self):
        return f"Commentaire de {self.utilisateur.nom}"


import uuid
from django.db import models
from django.conf import settings


class Document(models.Model):
    TYPE_CHOICES = [
        ('livrable', 'Livrable'),
        ('document', 'Document'),
        ('rapport', 'Rapport'),
        ('contrat', 'Contrat'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='document')
    fichier = models.FileField(upload_to='documents/%Y/%m/',default='')
    taille = models.PositiveIntegerField(blank=True, null=True)
    version = models.PositiveIntegerField(default=1)

    projet = models.ForeignKey('Projet', on_delete=models.CASCADE, related_name='documents')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='documents_uploades',
    )
    date_upload = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_upload']

    def save(self, *args, **kwargs):
        if self.fichier and not self.taille:
            self.taille = self.fichier.size
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nom} ({self.projet.nom})"

class Ressource(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=50)
    nom = models.CharField(max_length=100)
    cout_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    disponible = models.BooleanField(default=True)
    projet = models.ManyToManyField(Projet, related_name='ressources')
    
    
    class Meta:
        db_table = 'ressources'
    
    def __str__(self):
        return self.nom


class Notification(models.Model):
    TYPE_CHOICES = [
        ('info', 'Information'),
        ('succes', 'Succès'),
        ('attention', 'Attention'),
        ('erreur', 'Erreur'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=100, choices=TYPE_CHOICES, default='info')
    titre = models.CharField(max_length=200)
    message = models.CharField(max_length=200)
    lue = models.BooleanField(default=False)
    date_envoi = models.DateTimeField(auto_now_add=True)
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='notifications')
    # ✅ NOUVEAUX CHAMPS
    lien_action = models.CharField(max_length=500, blank=True, null=True)  # Lien vers la ressource concernée
    entite_id = models.UUIDField(null=True, blank=True)  # ID de l'entité (tâche, projet, etc.)
    entite_type = models.CharField(max_length=50, blank=True, null=True)  # Type d'entité ('tache', 'projet')
    # models.py - Ajouter dans Notification
    projet = models.ForeignKey('Projet', on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    
    class Meta:
        db_table = 'notifications'
        indexes = [
            models.Index(fields=['utilisateur', 'lue']),
            models.Index(fields=['utilisateur', '-date_envoi']),
        ]
        ordering = ['-date_envoi']
    
    def __str__(self):
        return self.titre

    @classmethod
    def creer_notification(cls, utilisateur, titre, message, type_notif='info', lien_action=None, entite_id=None, entite_type=None):
        """Méthode utilitaire pour créer une notification"""
        
        return cls.objects.create(
            utilisateur=utilisateur,
            titre=titre,
            message=message,
            type=type_notif,
            lien_action=lien_action,
            entite_id=entite_id,
            entite_type=entite_type
        )

class Kpi(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=50)
    valeur_cible = models.FloatField()
    valeur_actuelle = models.FloatField()
    unite = models.CharField(max_length=255)
    seuil_alerte = models.FloatField()
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='kpis')
    
    
    class Meta:
        db_table = 'kpis'
    
    def __str__(self):
        return self.nom


class Budget(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    montant_total = models.FloatField()
    montant_depense = models.FloatField()
    montant_restant = models.FloatField()
    devise = models.CharField(max_length=10, default='EUR')
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='budgets')
    
    
    class Meta:
        db_table = 'budgets'
    
    def __str__(self):
        return f"Budget {self.projet.nom} - {self.montant_total} {self.devise}"


class PasswordResetToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'password_reset_tokens'
    
    def is_valid(self):
        return not self.used and self.expires_at > timezone.now()
    
    def __str__(self):
        return f"Reset token for {self.user.email}"
