from rest_framework import serializers
from .models import Conversation, Message
from accounts.serializers import PublicUserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = PublicUserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'sender', 'content', 'timestamp', 'is_read')


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ('id', 'other_user', 'last_message', 'unread_count', 'updated_at')

    def get_other_user(self, obj):
        return PublicUserSerializer(obj.other_user(self.context['request'].user), context=self.context).data

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {'content': msg.content, 'timestamp': msg.timestamp, 'sender_id': msg.sender_id}
        return None

    def get_unread_count(self, obj):
        return obj.messages.filter(is_read=False).exclude(sender=self.context['request'].user).count()
