"""
ASGI config for chat_app project.
"""

import os
import django

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application

# ✅ SET SETTINGS FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chat_app.settings')

# ✅ Initialize Django BEFORE importing routing
django.setup()

# ✅ Now safe to import routing
import chat.routing

# ✅ HTTP + WebSocket configuration
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            chat.routing.websocket_urlpatterns
        )
    ),
})
