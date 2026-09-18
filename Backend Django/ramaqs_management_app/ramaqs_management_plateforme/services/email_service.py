import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils.html import escape, strip_tags


logger = logging.getLogger(__name__)


class EmailService:
    """E-mails transactionnels au style visuel RAMAQS."""

    @staticmethod
    def _build_template(*, title, preview, greeting, paragraphs, notice, action_label=None, action_url=None):
        body_html = ''.join(
            f'<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">{escape(paragraph)}</p>'
            for paragraph in paragraphs
        )
        action_html = ''
        if action_label and action_url:
            action_html = f'''
              <tr><td align="center" style="padding:4px 32px 28px;">
                <a href="{escape(action_url)}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:9px;">{escape(action_label)}</a>
              </td></tr>'''

        return f'''<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#fef2f2;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{escape(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fef2f2;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(127,29,29,.12);">
          <tr><td style="height:6px;background:#dc2626;"></td></tr>
          <tr><td align="center" style="padding:32px 32px 20px;">
            <div style="width:52px;height:52px;line-height:52px;text-align:center;background:#dc2626;border-radius:14px;color:#ffffff;font-size:25px;font-weight:700;">R</div>
            <h1 style="margin:22px 0 8px;font-size:25px;line-height:32px;color:#111827;">{escape(title)}</h1>
            <p style="margin:0;font-size:16px;line-height:24px;color:#6b7280;">{escape(preview)}</p>
          </td></tr>
          <tr><td style="padding:0 32px 12px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#1f2937;">{escape(greeting)}</p>
            {body_html}
          </td></tr>
          {action_html}
          <tr><td style="padding:0 32px 24px;">
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;font-size:14px;line-height:21px;color:#9a3412;">{escape(notice)}</div>
          </td></tr>
          <tr><td style="padding:20px 32px;background:#fffafa;border-top:1px solid #fee2e2;text-align:center;font-size:12px;line-height:18px;color:#9ca3af;">RAMAQS Consulting · Plateforme de gestion de projets</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>'''

    @staticmethod
    def _send(subject, user, html_message, label):
        try:
            result = send_mail(
                subject=subject,
                message=strip_tags(html_message),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            if result != 1:
                logger.error("L'email de %s n'a pas été accepté pour %s.", label, user.email)
                return False
            logger.info("Email de %s envoyé à %s.", label, user.email)
            return True
        except Exception:
            logger.exception("Erreur d'envoi de l'email de %s à %s.", label, user.email)
            return False

    @classmethod
    def send_approval_email(cls, user, role_label):
        html_message = cls._build_template(
            title='Votre compte est approuvé',
            preview='Votre compte RAMAQS est prêt à être utilisé.',
            greeting=f'Bonjour {user.nom or user.email},',
            paragraphs=(
                f'Votre demande d’inscription en tant que {role_label} a été approuvée.',
                'Votre compte est maintenant actif. Connectez-vous avec le mot de passe choisi lors de votre inscription.',
            ),
            action_label='Se connecter',
            action_url=f'{settings.FRONTEND_URL}/login',
            notice='Si vous avez oublié votre mot de passe, utilisez la procédure « Mot de passe oublié » depuis la page de connexion.',
        )
        return cls._send('Votre compte RAMAQS Consulting a été approuvé', user, html_message, 'approbation')

    @classmethod
    def send_rejection_email(cls, user, justification, role_label):
        html_message = cls._build_template(
            title='Mise à jour de votre demande',
            preview='Votre demande d’inscription RAMAQS a été examinée.',
            greeting=f'Bonjour {user.nom or user.email},',
            paragraphs=(
                f'Après examen de votre demande d’inscription en tant que {role_label}, nous ne pouvons pas y donner suite.',
                f'Motif : {justification or "Aucun motif complémentaire n’a été fourni."}',
            ),
            notice='Pour toute question complémentaire, contactez l’équipe RAMAQS Consulting.',
        )
        return cls._send('Votre demande d’inscription RAMAQS Consulting', user, html_message, 'rejet')
