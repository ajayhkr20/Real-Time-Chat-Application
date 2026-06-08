from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()


@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        params = parse_qs(scope.get('query_string', b'').decode())
        token = params.get('token', [None])[0]
        scope['user'] = AnonymousUser()
        if token:
            try:
                data = UntypedToken(token)
                scope['user'] = await get_user(data['user_id'])
            except (InvalidToken, TokenError):
                pass
        return await super().__call__(scope, receive, send)
