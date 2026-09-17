# ramaqs_management_plateforme/services/whatsapp_service.py

import requests
import logging
from datetime import datetime
from django.conf import settings

logger = logging.getLogger(__name__)

class WhatsAppService:
    
    def __init__(self):
        self.id_instance = settings.GREEN_API_ID_INSTANCE
        self.api_token = settings.GREEN_API_API_TOKEN
        self.base_url = f'https://api.green-api.com/waInstance{self.id_instance}'
    
    @staticmethod
    def format_phone_number(phone):
        """Formater le numéro pour WhatsApp Maroc"""
        if not phone:
            return None
        
        phone = ''.join(filter(str.isdigit, phone))
        
        if phone.startswith('0'):
            phone = '212' + phone[1:]
        elif phone.startswith('2120'):
            phone = '212' + phone[4:]
        
        if not phone.startswith('212') and len(phone) == 9:
            phone = '212' + phone
        
        return phone
    
    def send_message(self, phone_number, message):
        """Envoyer un message WhatsApp"""
        try:
            formatted_phone = self.format_phone_number(phone_number)
            if not formatted_phone:
                logger.warning(f"Numéro invalide: {phone_number}")
                return False
            
            url = f'{self.base_url}/sendMessage/{self.api_token}'
            
            payload = {
                'chatId': f'{formatted_phone}@c.us',
                'message': message
            }
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('idMessage'):
                    logger.info(f"WhatsApp envoyé à {phone_number}")
                    return True
                else:
                    logger.error(f"Erreur: {result}")
                    return False
            else:
                logger.error(f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Exception: {e}")
            return False
    
    def send_rejection_notification(self, user, justification, role_label):
        """
        Envoyer notification de rejet personnalisée
        """
        if not user.telephone:
            logger.warning(f"⚠️ {user.email} n'a pas de numéro de téléphone")
            return False
        
        # Date et heure actuelles
        current_date = datetime.now().strftime("%d/%m/%Y à %H:%M")
        
        # Messages selon le rôle
        role_messages = {
            'chef_projet': 'Chef de Projet',
            'consultant': 'Consultant',
            'partenaire': 'Partenaire',
            'client': 'Client'
        }
        role_title = role_messages.get(user.role, role_label)
        
        message = f"""╔══════════════════════════════════════════╗
║  📋 *RAMAQS CONSULTING*
╚══════════════════════════════════════════╝

❌ *DEMANDE NON RETENUE*

Bonjour *{user.nom.upper()}*,

Nous avons bien reçu votre demande d'inscription
en tant que *{role_title}*.

───────────────────────────────────────
 *MOTIF DU REFUS*
────────────────────────────────────────
                                         
 {justification}
                                         
───────────────────────────────────────

📌 *QUE FAIRE ?*
   • Vérifiez que tous les documents sont complets
   • Corrigez les informations demandées
   • Vous pouvez faire une nouvelle demande

📞 *BESOIN D'AIDE ?*
   N'hésitez pas à nous contacter pour plus
   d'informations sur votre dossier.

📅 *Date de traitement :* {current_date}

╔══════════════════════════════════════════╗
║  📞 *NOUS CONTACTER*
║  • Email : {settings.COMPANY_EMAIL}
║  • Tél : {settings.COMPANY_PHONE}
╚══════════════════════════════════════════╝

*RAMAQS Consulting* - À votre service 
"""
        return self.send_message(user.telephone, message)
    
    def send_welcome_message(self, user):
        """Message de bienvenue personnalisé"""
        if not user.telephone:
            return False
        
        message = f"""╔══════════════════════════════════════════╗
║  🌟 *BIENVENUE SUR RAMAQS* 🌟
╚══════════════════════════════════════════╝

Bonjour *{user.nom.upper()}*,

Nous sommes ravis de vous compter parmi nos
utilisateurs !

┌────────────────────────────────────────┐
│ ✨ *VOTRE ESPACE PERSONNEL*
├────────────────────────────────────────┤
│ 📊 Tableau de bord personnalisé
│ 📁 Gestion de vos projets
│ ✅ Suivi de vos tâches
└────────────────────────────────────────┘

🔗 *ACCÉDER À VOTRE ESPACE :*
{settings.FRONTEND_URL}/app

💡 *ASTUCE :*
   Explorez toutes les fonctionnalités
   de notre plateforme !

Belle expérience sur RAMAQS ! 🚀

*RAMAQS Consulting* - L'excellence au service de vos projets ✨
"""
        return self.send_message(user.telephone, message)
    
    def send_task_reminder(self, user, task_title, due_date):
        """Rappel de tâche personnalisé"""
        if not user.telephone:
            return False
        
        message = f"""╔══════════════════════════════════════════╗
║  ⏰ *RAPPEL DE TÂCHE* ⏰
╚══════════════════════════════════════════╝

Bonjour *{user.nom.upper()}*,

┌────────────────────────────────────────┐
│ 📋 *TÂCHE À RÉALISER*
├────────────────────────────────────────┤
│ • {task_title}
│ • Échéance : *{due_date}*
└────────────────────────────────────────┘

⚠️ La date limite approche !

🔗 *VOIR LA TÂCHE :*
{settings.FRONTEND_URL}/app/taches

---
*RAMAQS Consulting* - Ne manquez pas vos échéances ⏰
"""
        return self.send_message(user.telephone, message)
    def is_available(self):
        """Vérifier si le service WhatsApp est disponible"""
        try:
            url = f'{self.base_url}/getStateInstance/{self.api_token}'
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                state = response.json().get('stateInstance')
                return state == 'authorized'
            return False
        except Exception as e:
            logger.error(f"Erreur vérification WhatsApp: {e}")
            return False
        
