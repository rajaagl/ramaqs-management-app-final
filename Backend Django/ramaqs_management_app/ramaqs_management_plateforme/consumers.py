import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        print(f"[WS] 🔍 Tentative de connexion - user: {user}")
        if not user or not user.is_authenticated:
            print("[WS] ❌ Utilisateur non authentifié, fermeture")
            await self.close()
            return

        # Chaque utilisateur a son propre groupe — seules SES notifications arrivent ici
        self.group_name = f'notifs_{user.id}'
        print(f"[WS] ✅ Groupe créé: {self.group_name}")
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        print(f"[WS] ✅ Connexion acceptée pour {user.id}")

    async def disconnect(self, close_code):
        print(f"[WS] 🔌 Déconnexion - code: {close_code}")
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        print(f"[WS] 🔌 Déconnexion terminée - code: {close_code}")
    # Appelé par channel_layer.group_send() depuis notification_service.py
    async def notification_message(self, event):
        print(f"[WS] 📨 Envoi de notification: {event}")
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': event['data'],
        }))
        print(f"[WS] 📨 Notification envoyée: {event['data']}")