from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

User = get_user_model()


class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return self.request.user.conversations.prefetch_related('participants', 'messages')


class StartConversationView(APIView):
    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=400)
        other = get_object_or_404(User, id=user_id)
        if other == request.user:
            return Response({'error': 'Cannot chat with yourself'}, status=400)
        conv, created = Conversation.get_or_create_private(request.user, other)
        return Response(
            ConversationSerializer(conv, context={'request': request}).data,
            status=201 if created else 200
        )


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer

    def get_queryset(self):
        conv = get_object_or_404(Conversation, id=self.kwargs['conv_id'], participants=self.request.user)
        conv.messages.exclude(sender=self.request.user).update(is_read=True)
        return conv.messages.select_related('sender')
