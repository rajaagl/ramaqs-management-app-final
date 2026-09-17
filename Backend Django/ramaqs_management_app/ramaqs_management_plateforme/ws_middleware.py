from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model

# pour websockets pour l'authentification avec JWT

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        access_token = AccessToken(token_key)
        return User.objects.get(
            id=access_token['user_id'],
            is_active=True,
            statut_approbation='approved',
            doit_changer_mot_de_passe=False,
        )
    except Exception:
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Ne jamais placer le JWT dans l'URL : les URLs sont fréquemment journalisées.
        # Le client l'envoie comme second sous-protocole WebSocket après
        # l'identifiant fixe ``access-token``.
        protocols = scope.get('subprotocols', [])
        token = protocols[1] if len(protocols) == 2 and protocols[0] == 'access-token' else None
        scope['user'] = await get_user_from_token(token) if token else AnonymousUser()
        scope['notification_subprotocol'] = 'access-token' if token else None
        return await super().__call__(scope, receive, send)
