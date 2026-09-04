# ramaqs_management_plateforme/services/email_service.py

import logging
from django.core.mail import send_mail
from django.utils.html import strip_tags
from django.conf import settings

# Configuration du logger
logger = logging.getLogger(__name__)

class EmailService:
    
    @staticmethod
    def send_approval_email(user, temp_password, role_label):
        """Envoyer email d'approbation avec identifiants"""
        print("=" * 60)
        print("📧 [send_approval_email] Début de l'envoi")
        print(f"   Destinataire: {user.email}")
        print(f"   Nom: {user.nom}")
        print(f"   Rôle: {role_label}")
        print(f"   Mot de passe temporaire: {temp_password}")
        print("=" * 60)
        
        try:
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    .header {{ text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 20px; }}
                    .logo {{ background: #ef4444; color: white; width: 50px; height: 50px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; }}
                    h1 {{ color: #333; font-size: 24px; }}
                    .info {{ background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }}
                    .button {{ display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }}
                    .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">R</div>
                        <h1>Bienvenue chez RAMAQS Consulting</h1>
                    </div>
                    <p>Bonjour <strong>{user.nom}</strong>,</p>
                    <p>Nous avons le plaisir de vous informer que votre demande d'inscription en tant que <strong>{role_label}</strong> a été <strong style="color: #10b981;">APPROUVÉE</strong>.</p>
                    <div class="info">
                        <p><strong> Vos identifiants de connexion :</strong></p>
                        <p> Email : <strong>{user.email}</strong></p>
                        <p> Mot de passe temporaire : <strong>{temp_password}</strong></p>
                        <p style="margin-top: 10px; font-size: 12px; color: #666;">⚠️ Merci de changer votre mot de passe lors de votre première connexion.</p>
                    </div>
                    <div style="text-align: center; margin: 24px 0;">
                          <a href="{settings.FRONTEND_URL}/login"
                             style="background: #dc2626; color: white; padding: 12px 32px;
                                    border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                            Se connecter
                          </a>
                    </div>
                    <div class="footer">
                        <p>RAMAQS Consulting - Plateforme de gestion de projets</p>
                        <p>© 2026 Tous droits réservés</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            print("📧 Envoi de l'email via SMTP...")
            print(f"   From: siteweb@ramaqs.ma")
            print(f"   To: {user.email}")
            print(f"   Subject: ✅ Votre compte RAMAQS Consulting a été approuvé")
            
            result = send_mail(
                subject=f'✅ Votre compte RAMAQS Consulting a été approuvé',
                message=strip_tags(html_message),
                from_email='siteweb@ramaqs.ma',
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            print(f"✅ Email envoyé avec succès! Résultat: {result}")
            print("=" * 60)
            logger.info(f"Email d'approbation envoyé à {user.email}")
            return True
            
        except Exception as e:
            print(f"❌ ERREUR lors de l'envoi de l'email: {str(e)}")
            print("=" * 60)
            logger.error(f"Erreur envoi email approbation à {user.email}: {str(e)}")
            return False
    
    @staticmethod
    def send_rejection_email(user, justification, role_label):
        """Envoyer email de rejet"""
        print("=" * 60)
        print("📧 [send_rejection_email] Début de l'envoi")
        print(f"   Destinataire: {user.email}")
        print(f"   Nom: {user.nom}")
        print(f"   Rôle: {role_label}")
        print(f"   Justification: {justification}")
        print("=" * 60)
        
        try:
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    .header {{ text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 20px; }}
                    .logo {{ background: #ef4444; color: white; width: 50px; height: 50px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; }}
                    h1 {{ color: #333; font-size: 24px; }}
                    .reason {{ background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">R</div>
                        <h1>Demande d'inscription</h1>
                    </div>
                    <p>Bonjour <strong>{user.nom}</strong>,</p>
                    <p>Nous vous remercions pour votre intérêt pour la plateforme RAMAQS Consulting en tant que <strong>{role_label}</strong>.</p>
                    <p>Après examen de votre demande, nous ne pouvons pas donner suite à votre inscription pour la raison suivante :</p>
                    <div class="reason">
                        <p><strong>📝 Motif :</strong></p>
                        <p>{justification}</p>
                    </div>
                    <p>Si vous souhaitez plus d'informations, n'hésitez pas à nous contacter à <strong>siteweb@ramaqs.ma</strong>.</p>
                    <div class="footer">
                        <p>RAMAQS Consulting - Plateforme de gestion de projets</p>
                        <p>© 2025 Tous droits réservés</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            print("📧 Envoi de l'email de rejet via SMTP...")
            
            result = send_mail(
                subject='Votre demande d\'inscription RAMAQS Consulting',
                message=strip_tags(html_message),
                from_email='siteweb@ramaqs.ma',
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            print(f"✅ Email de rejet envoyé avec succès! Résultat: {result}")
            print("=" * 60)
            logger.info(f"Email de rejet envoyé à {user.email}")
            return True
            
        except Exception as e:
            print(f"❌ ERREUR lors de l'envoi de l'email de rejet: {str(e)}")
            print("=" * 60)
            logger.error(f"Erreur envoi email rejet à {user.email}: {str(e)}")
            return False