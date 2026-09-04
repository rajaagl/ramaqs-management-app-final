# services/notification_service.py
import logging
from datetime import timedelta
from django.utils.timezone import now as timezone_now
from ..models import Notification, Utilisateur
from ..utils.tenant import get_current_tenant
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync




logger = logging.getLogger(__name__)

# websoket
def envoyer_notification_ws(utilisateur_id, notification):
    """Pousse la notification en temps réel vers le WebSocket de l'utilisateur."""
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'notifs_{utilisateur_id}',
            {
                'type': 'notification_message',
                'data': {
                    'id': str(notification.id),
                    'titre': notification.titre,
                    'message': notification.message,
                },
            }
        )
    except Exception as e:
        # Ne jamais bloquer la logique métier si le WS est down
        print(f"[WS] Erreur push notification: {e}")

class NotificationService:

    # ─────────────────────────────────────────────────────────────────────────
    # MÉTHODE DE BASE
    # ─────────────────────────────────────────────────────────────────────────
    @staticmethod
    def creer_notification(utilisateur, titre, message, type_notif='info',
                       lien_action=None, entite_id=None, entite_type=None, projet=None):
   
        dix_secondes = timezone_now() - timedelta(seconds=10)
        deja_existant = Notification.objects.filter(
            utilisateur=utilisateur,
            titre=titre,
            message=message,
            date_envoi__gte=dix_secondes,
        ).exists()
        if deja_existant:
           print(f"[NOTIF] ⏭ Doublon ignoré → {utilisateur.email} | {titre}")
           return None

        tenant = get_current_tenant()
        print(f"[NOTIF] ▶ creer_notification → {utilisateur.email} | {titre}")
        notification = Notification.objects.create(
            tenant=tenant,
            utilisateur=utilisateur,
            titre=titre,
            message=message,
            type=type_notif,
            lien_action=lien_action,
            entite_id=entite_id,
            entite_type=entite_type,
            projet=projet,
        )
        print(f"[NOTIF]  notification créée id={notification.id}")
        try:
            envoyer_notification_ws(utilisateur.id, notification)
        except Exception as e:
           print(f"[WS]  Push échoué pour {utilisateur.id}: {e}")
        return notification
    # ─────────────────────────────────────────────────────────────────────────
    # HELPERS PRIVÉS
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _get_chefs(projet):
        """
        chef_projet peut être FK ou M2M selon la config du modèle.
        On normalise pour toujours retourner un itérable d'objets Utilisateur.
        """
        chef = projet.chef_projet
        if chef is None:
            return []
        # M2M → queryset
        if hasattr(chef, 'all'):
            return list(chef.all())
        # FK → objet unique
        return [chef]

    @staticmethod
    def _notifier_consultant(tache, titre, message, type_notif='info', utilisateur=None):
        """Notifier le consultant assigné à une tâche (sauf s'il est l'auteur)."""
        if tache.consultant and tache.consultant != utilisateur:
            NotificationService.creer_notification(
                utilisateur=tache.consultant,
                titre=titre,
                message=message,
                type_notif=type_notif,
                lien_action=f"/app/taches/{tache.id}",
                entite_id=tache.id,
                entite_type='tache',
                projet=tache.projet,
            )
            return True
        return False

    @staticmethod
    def _notifier_chefs_projet(tache, titre, message, type_notif='info',
                               utilisateur=None, exclude_users=None):
        
        if exclude_users is None:
            exclude_users = []
        chefs = NotificationService._get_chefs(tache.projet)
        for chef in chefs:
            if chef not in exclude_users and chef != utilisateur:
                NotificationService.creer_notification(
                    utilisateur=chef,
                    titre=titre,
                    message=message,
                    type_notif=type_notif,
                    lien_action=f"/app/taches/{tache.id}",
                    entite_id=tache.id,
                    entite_type='tache',
                    projet=tache.projet,
                )

    @staticmethod
    def _notifier_direction(titre, message, type_notif='info', projet=None,
                            tache=None, exclude_users=None):
        """Notifier tous les utilisateurs direction."""
        if exclude_users is None:
            exclude_users = []
        for admin in Utilisateur.objects.filter(role='direction'):
            if admin not in exclude_users:
                NotificationService.creer_notification(
                    utilisateur=admin,
                    titre=titre,
                    message=message,
                    type_notif=type_notif,
                    lien_action=f"/app/taches/{tache.id}" if tache else None,
                    entite_id=tache.id if tache else None,
                    entite_type='tache' if tache else None,
                    projet=projet,
                )

    @staticmethod
    def _notifier_partenaires_projet(projet, titre, message, type_notif='info',
                                     lien_action=None, entite_id=None, entite_type=None,
                                     tache=None, exclude_users=None):
        """Notifier tous les partenaires d'un projet."""
        if exclude_users is None:
            exclude_users = []
        partenaires = projet.partenaires.all() if hasattr(projet, 'partenaires') else []
        for partenaire in partenaires:
            if partenaire not in exclude_users:
                NotificationService.creer_notification(
                    utilisateur=partenaire,
                    titre=titre,
                    message=message,
                    type_notif=type_notif,
                    lien_action=lien_action,
                    entite_id=entite_id,
                    entite_type=entite_type,
                    projet=projet,
                )

    # ─────────────────────────────────────────────────────────────────────────
    # NOTIFICATIONS TÂCHES
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def notifier_creation_tache(tache, utilisateur):
        titre   = f"Nouvelle tâche — {tache.projet.nom}"
        message = f"La tâche '{tache.titre}' a été créée par {utilisateur.nom}."
        chefs   = NotificationService._get_chefs(tache.projet)
        exclude = [utilisateur, tache.consultant] + chefs

        # 1. Consultant assigné
        NotificationService._notifier_consultant(
            tache=tache,
            titre="Nouvelle tâche assignée",
            message=f"La tâche '{tache.titre}' vous a été assignée dans le projet '{tache.projet.nom}'.",
            type_notif='info',
            utilisateur=utilisateur,
        )
        # 2. Chefs de projet
        NotificationService._notifier_chefs_projet(
            tache=tache, titre=titre, message=message, utilisateur=utilisateur,
        )
        # 3. Partenaires
        NotificationService._notifier_partenaires_projet(
            projet=tache.projet, titre=titre, message=message,
            lien_action=f"/app/taches/{tache.id}",
            entite_id=tache.id, entite_type='tache', tache=tache,
            exclude_users=exclude,
        )
        # 4. Direction
        NotificationService._notifier_direction(
            titre=titre, message=message,
            projet=tache.projet, tache=tache,
            exclude_users=exclude,
        )

    @staticmethod
    def notifier_modification_tache(tache, utilisateur, champs_modifies):
        champs_str = ', '.join(champs_modifies) if champs_modifies else ''
        titre   = f"Tâche modifiée — {tache.projet.nom}"
        message = f"La tâche '{tache.titre}' a été modifiée par {utilisateur.nom}" + (f" ({champs_str})" if champs_str else '') + '.'
        chefs   = NotificationService._get_chefs(tache.projet)
        exclude = [utilisateur, tache.consultant] + chefs

        NotificationService._notifier_consultant(
            tache=tache, titre=titre, message=message, utilisateur=utilisateur,
        )
        NotificationService._notifier_chefs_projet(
            tache=tache, titre=titre, message=message, utilisateur=utilisateur,
        )
        NotificationService._notifier_partenaires_projet(
            projet=tache.projet, titre=titre, message=message,
            lien_action=f"/app/taches/{tache.id}",
            entite_id=tache.id, entite_type='tache', tache=tache,
            exclude_users=exclude,
        )

    @staticmethod
    def notifier_changement_statut_tache(tache, ancien_statut, nouveau_statut, utilisateur):
       
        logger.info("[NOTIFICATION] statut tâche '%s' : %s → %s (par %s)",
                    tache.titre, ancien_statut, nouveau_statut,
                    utilisateur.nom if utilisateur else 'None')

        status_labels = {
            'a_faire': 'À faire',
            'en cours': 'En cours',
            'en_cours': 'En cours',
            'en_attente_validation': 'En attente de validation',
            'termine': 'Terminé',
        }

        titre = f"Statut changé — {tache.projet.nom}"
        message = (
            f"La tâche '{tache.titre}' est passée de "
            f"'{status_labels.get(ancien_statut, ancien_statut)}' à "
            f"'{status_labels.get(nouveau_statut, nouveau_statut)}'."
        )

        if nouveau_statut == 'en_attente_validation':
            type_notif = 'attention'
            message = f"La tâche '{tache.titre}' est en attente de validation."
        elif nouveau_statut == 'termine':
            type_notif = 'succes'
            message = f"La tâche '{tache.titre}' a été terminée par {utilisateur.nom}."
        else:
            type_notif = 'info'

        
        chefs   = NotificationService._get_chefs(tache.projet)
        
        exclude = [utilisateur] + ([tache.consultant] if tache.consultant else []) + chefs

        NotificationService._notifier_chefs_projet(
            tache=tache, titre=titre, message=message,
            type_notif=type_notif, utilisateur=utilisateur,
        )
        NotificationService._notifier_consultant(
            tache=tache, titre=titre, message=message,
            type_notif=type_notif, utilisateur=utilisateur,
        )
        NotificationService._notifier_direction(
            titre=titre, message=message, type_notif=type_notif,
            projet=tache.projet, tache=tache, exclude_users=exclude,
        )

        if nouveau_statut == 'en_attente_validation':
            NotificationService._notifier_partenaires_projet(
                projet=tache.projet,
                titre=f"Tâche en attente de validation — {tache.projet.nom}",
                message=f"La tâche '{tache.titre}' est en attente de validation.",
                type_notif='attention',
                lien_action=f"/app/taches/{tache.id}",
                entite_id=tache.id, entite_type='tache', tache=tache,
                exclude_users=exclude,
            )

    @staticmethod
    def notifier_avancement_tache(tache, ancien_avancement, nouvel_avancement, utilisateur):
        titre   = f"Progression — {tache.projet.nom}"
        message = f"La tâche '{tache.titre}' est passée de {ancien_avancement}% à {nouvel_avancement}%."
        for chef in NotificationService._get_chefs(tache.projet):
            if chef != utilisateur:
                NotificationService.creer_notification(
                    utilisateur=chef, titre=titre, message=message, type_notif='info',
                    lien_action=f"/app/taches/{tache.id}",
                    entite_id=tache.id, entite_type='tache', projet=tache.projet,
                )

    @staticmethod
    def notifier_suppression_tache(tache, utilisateur):
        titre   = f"Tâche supprimée — {tache.projet.nom}"
        message = f"La tâche '{tache.titre}' a été supprimée par {utilisateur.nom}."
        for chef in NotificationService._get_chefs(tache.projet):
            if chef != utilisateur:
                NotificationService.creer_notification(
                    utilisateur=chef, titre=titre, message=message, type_notif='attention',
                    lien_action=f"/app/projets/{tache.projet.id}",
                    entite_id=tache.projet.id, entite_type='projet', projet=tache.projet,
                )

    # ─────────────────────────────────────────────────────────────────────────
    # NOTIFICATIONS PROJETS
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def notifier_creation_projet(projet, utilisateur):
        titre   = f"Nouveau projet — {projet.nom}"
        message = f"Le projet '{projet.nom}' a été créé par {utilisateur.nom}."
        chefs   = NotificationService._get_chefs(projet)

        NotificationService._notifier_direction(
            titre=titre, message=message, type_notif='succes',
            projet=projet, exclude_users=[utilisateur],
        )
        for chef in chefs:
            if chef != utilisateur:
                NotificationService.creer_notification(
                    utilisateur=chef, titre=titre, message=message, type_notif='info',
                    lien_action=f"/app/projets/{projet.id}",
                    entite_id=projet.id, entite_type='projet', projet=projet,
                )

    @staticmethod
    def notifier_modification_projet(projet, utilisateur, champs_modifies):
        champs_str = ', '.join(champs_modifies) if champs_modifies else ''
        titre   = f"Projet modifié — {projet.nom}"
        message = f"Le projet '{projet.nom}' a été modifié par {utilisateur.nom}" + (f" ({champs_str})" if champs_str else '') + '.'
        chefs   = NotificationService._get_chefs(projet)

        NotificationService._notifier_direction(
            titre=titre, message=message, type_notif='info',
            projet=projet, exclude_users=[utilisateur],
        )
        for chef in chefs:
            if chef != utilisateur:
                NotificationService.creer_notification(
                    utilisateur=chef, titre=titre, message=message, type_notif='info',
                    lien_action=f"/app/projets/{projet.id}",
                    entite_id=projet.id, entite_type='projet', projet=projet,
                )

    @staticmethod
    def notifier_suppression_projet(projet, utilisateur):
        titre   = f"Projet supprimé — {projet.nom}"
        message = f"Le projet '{projet.nom}' a été supprimé par {utilisateur.nom}."
        NotificationService._notifier_direction(
            titre=titre, message=message, type_notif='attention',
            projet=projet, exclude_users=[utilisateur],
        )

    @staticmethod
    def notifier_fin_projet(projet):
        titre   = f"Projet terminé — {projet.nom}"
        message = f"Le projet '{projet.nom}' est maintenant terminé avec 100% d'avancement."
        deja_notifies = set()

        for admin in Utilisateur.objects.filter(role='direction'):
          NotificationService.creer_notification(
              utilisateur=admin, titre=titre, message=message, type_notif='succes',
              lien_action=f"/app/projets/{projet.id}",
              entite_id=projet.id, entite_type='projet', projet=projet,
          )
          deja_notifies.add(admin.id)
        for chef in NotificationService._get_chefs(projet):
          if chef.id not in deja_notifies:
            NotificationService.creer_notification(
                utilisateur=chef, titre=titre, message=message, type_notif='succes',
                lien_action=f"/app/projets/{projet.id}",
                entite_id=projet.id, entite_type='projet', projet=projet,
            )

    # ─────────────────────────────────────────────────────────────────────────
    # NOTIFICATIONS DOCUMENTS
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def notifier_nouveau_document(document, utilisateur):
        titre      = f"Nouveau document — {document.projet.nom}"
        message    = f"{utilisateur.nom} a téléversé '{document.nom}'."
        type_notif = 'succes' if document.type == 'livrable' else 'info'
        chefs      = NotificationService._get_chefs(document.projet)
        destinataires = set(chefs) - {utilisateur}

        for user in Utilisateur.objects.filter(role='direction'):
            if user != utilisateur:
                destinataires.add(user)
        if document.type == 'livrable' and document.projet.client and document.projet.client != utilisateur:
            destinataires.add(document.projet.client)

        #  Partenaires du projet
        if hasattr(document.projet, 'partenaires'):
            for partenaire in document.projet.partenaires.all():
                if partenaire != utilisateur:
                    destinataires.add(partenaire)

        
        for dest in destinataires:
            NotificationService.creer_notification(
                utilisateur=dest, titre=titre, message=message, type_notif=type_notif,
                lien_action=f"/app/documents/{document.id}",
                entite_id=document.id, entite_type='document', projet=document.projet,
            )

    @staticmethod
    def notifier_nouveau_commentaire_document(document, utilisateur, commentaire, rating=None):
        titre   = f"Nouveau commentaire — {document.projet.nom}"
        extrait = commentaire[:50] + '...' if len(commentaire) > 50 else commentaire
        message = f"{utilisateur.nom} a commenté '{document.nom}' : {extrait}"
        if rating:
            message += f" (Note : {rating}/5)"

        chefs         = NotificationService._get_chefs(document.projet)
        destinataires = set(chefs) - {utilisateur}
        for user in Utilisateur.objects.filter(role='direction'):
            if user != utilisateur:
                destinataires.add(user)

        for dest in destinataires:
            NotificationService.creer_notification(
                utilisateur=dest, titre=titre, message=message, type_notif='info',
                lien_action=f"/app/documents/{document.id}",
                entite_id=document.id, entite_type='document', projet=document.projet,
            )

    @staticmethod
    def notifier_modification_document(document, utilisateur, ancien_nom):
        titre   = f"Document modifié — {document.projet.nom}"
        message = f"{utilisateur.nom} a modifié '{document.nom}' (anciennement '{ancien_nom}')."
        chefs   = NotificationService._get_chefs(document.projet)
        destinataires = set(chefs) - {utilisateur}
        for user in Utilisateur.objects.filter(role='direction'):
            if user != utilisateur:
                destinataires.add(user)
        for dest in destinataires:
            NotificationService.creer_notification(
                utilisateur=dest, titre=titre, message=message, type_notif='info',
                lien_action=f"/app/documents/{document.id}",
                entite_id=document.id, entite_type='document', projet=document.projet,
            )

    @staticmethod
    def notifier_suppression_document(document, utilisateur):
        titre   = f"Document supprimé — {document.projet.nom}"
        message = f"{utilisateur.nom} a supprimé le document '{document.nom}'."
        chefs   = NotificationService._get_chefs(document.projet)
        destinataires = set(chefs) - {utilisateur}
        for user in Utilisateur.objects.filter(role='direction'):
            if user != utilisateur:
                destinataires.add(user)
        for dest in destinataires:
            NotificationService.creer_notification(
                utilisateur=dest, titre=titre, message=message, type_notif='attention',
                lien_action=f"/app/projets/{document.projet.id}",
                entite_id=document.projet.id, entite_type='projet', projet=document.projet,
            )

    # ─────────────────────────────────────────────────────────────────────────
    # NOUVEAU — NOTIFICATIONS UTILISATEURS (inscription / approbation)
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def notifier_inscription_utilisateur(nouvel_utilisateur):
        """
        Notifie la DIRECTION qu'un nouvel utilisateur vient de s'inscrire
        et attend son approbation.
        """
        titre   = "Nouvel utilisateur en attente d'approbation"
        message = (
            f"{nouvel_utilisateur.nom} ({nouvel_utilisateur.email}) "
            f"vient de s'inscrire avec le rôle '{nouvel_utilisateur.role}' "
            f"et attend votre approbation."
        )
        NotificationService._notifier_direction(
            titre=titre,
            message=message,
            type_notif='attention',
        )

    @staticmethod
    def notifier_approbation_utilisateur(utilisateur, approuve_par):
        """
        FIX : notifie L'UTILISATEUR (pas la direction) que son compte
        a été approuvé par la direction.
        
        Appelée dans la vue d'approbation côté direction, PAS dans la vue
        d'inscription (c'est notifier_inscription_utilisateur qui gère ça).
        """
        NotificationService.creer_notification(
            utilisateur=utilisateur,
            titre="Compte approuvé — Bienvenue sur RAMAQS",
            message=(
                f"Bonjour {utilisateur.nom}, votre compte a été approuvé par {approuve_par.nom}. "
                f"Vous pouvez maintenant accéder à la plateforme."
            ),
            type_notif='succes',
            lien_action="/app",
        )

    @staticmethod
    def notifier_refus_utilisateur(utilisateur, refuse_par, raison=None):
        """Notifie l'utilisateur que son compte a été refusé."""
        message = f"Votre demande d'accès a été refusée par {refuse_par.nom}."
        if raison:
            message += f" Raison : {raison}"
        NotificationService.creer_notification(
            utilisateur=utilisateur,
            titre="Demande d'accès refusée",
            message=message,
            type_notif='erreur',
        )

    # ─────────────────────────────────────────────────────────────────────────
    # NOUVEAU — NOTIFICATIONS MESSAGERIE (chat interne)
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def notifier_nouveau_message(message_obj, expediteur):
        """
        Notifie les participants d'une conversation qu'un nouveau message
        a été envoyé. Appelée dans MessageViewSet.perform_create().
        """
        conversation = message_obj.conversation
        titre        = f"Nouveau message — {conversation.titre or 'Conversation'}"
        message_text = (
            f"{expediteur.nom} : "
            f"{message_obj.contenu[:60]}{'...' if len(message_obj.contenu) > 60 else ''}"
        )

        # Notifier tous les participants sauf l'expéditeur
        participants = conversation.participants.all() if hasattr(conversation, 'participants') else []
        for participant in participants:
            if participant != expediteur:
                NotificationService.creer_notification(
                    utilisateur=participant,
                    titre=titre,
                    message=message_text,
                    type_notif='info',
                    lien_action=f"/app/messagerie/{conversation.id}",
                    entite_id=conversation.id,
                    entite_type='conversation',
                )

    # ─────────────────────────────────────────────────────────────────────────
    # NOUVEAU — CONFIRMATION WHATSAPP ENVOYÉ (pour la direction)
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def notifier_whatsapp_envoye(destinataire_utilisateur, type_message='mot_de_passe'):
        """
        Notifie la DIRECTION qu'un message WhatsApp a été envoyé à un utilisateur.
        Appelée après un envoi réussi via WhatsAppService.
        
        Paramètre type_message : 'mot_de_passe' | 'confirmation' | 'autre'
        """
        labels = {
            'mot_de_passe': 'mot de passe temporaire',
            'confirmation': 'confirmation de changement de mot de passe',
            'autre':        'message',
        }
        label = labels.get(type_message, 'message')
        titre   = "WhatsApp envoyé"
        message = (
            f"Un {label} a été envoyé par WhatsApp à "
            f"{destinataire_utilisateur.nom} ({destinataire_utilisateur.telephone})."
        )
        NotificationService._notifier_direction(
            titre=titre,
            message=message,
            type_notif='info',
        )