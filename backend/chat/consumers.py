import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
        self.conv_id = self.scope['url_route']['kwargs']['conv_id']
        self.room = f'chat_{self.conv_id}'
        if not await self.is_participant():
            await self.close()
            return
        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()
        await self.set_online(True)
        await self.channel_layer.group_send(self.room, {
            'type': 'user_status',
            'user_id': self.user.id,
            'is_online': True,
        })

    async def disconnect(self, code):
        if hasattr(self, 'room'):
            await self.set_online(False)
            await self.channel_layer.group_send(self.room, {
                'type': 'user_status',
                'user_id': self.user.id,
                'is_online': False,
            })
            await self.channel_layer.group_discard(self.room, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        t = data.get('type', 'message')

        if t == 'message':
            content = data.get('content', '').strip()
            if not content:
                return
            msg = await self.save_message(content)
            # FIX: use a separate 'payload' key so **event doesn't collide with 'type'
            await self.channel_layer.group_send(self.room, {
                'type': 'chat_message',
                'payload': {
                    'id':              msg['id'],
                    'content':         msg['content'],
                    'sender_id':       self.user.id,
                    'sender_username': self.user.username,
                    'sender_avatar':   self.user.avatar_url,
                    'timestamp':       msg['timestamp'],
                }
            })

        elif t == 'typing':
            await self.channel_layer.group_send(self.room, {
                'type': 'typing_indicator',
                'user_id':   self.user.id,
                'username':  self.user.username,
                'is_typing': data.get('is_typing', False),
            })

    async def chat_message(self, event):
        """Receives channel-layer event; sends clean JSON to WebSocket client."""
        # FIX: send only the payload dict with type='message' — no **event bleed
        await self.send(text_data=json.dumps({
            'type': 'message',
            **event['payload'],
        }))

    async def typing_indicator(self, event):
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type':       'typing',
                'user_id':    event['user_id'],
                'username':   event['username'],
                'is_typing':  event['is_typing'],
            }))

    async def user_status(self, event):
        await self.send(text_data=json.dumps({
            'type':      'status',
            'user_id':   event['user_id'],
            'is_online': event['is_online'],
        }))

    # ── DB helpers ──────────────────────────────────────────────

    @database_sync_to_async
    def is_participant(self):
        return Conversation.objects.filter(
            id=self.conv_id, participants=self.user
        ).exists()

    @database_sync_to_async
    def save_message(self, content):
        conv = Conversation.objects.get(id=self.conv_id)
        msg  = Message.objects.create(
            conversation=conv, sender=self.user, content=content
        )
        # FIX: touch updated_at explicitly after message creation
        Conversation.objects.filter(id=self.conv_id).update(updated_at=msg.timestamp)
        return {
            'id':        msg.id,
            'content':   msg.content,
            'timestamp': msg.timestamp.isoformat(),
        }

    @database_sync_to_async
    def set_online(self, status):
        User.objects.filter(id=self.user.id).update(is_online=status)