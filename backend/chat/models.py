from django.db import models
from django.conf import settings


class Conversation(models.Model):
    """Private 1-to-1 conversation between exactly two users."""
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    @classmethod
    def get_or_create_private(cls, user1, user2):
        """Find existing private conversation or create a new one."""
        for conv in cls.objects.filter(participants=user1).filter(participants=user2):
            if conv.participants.count() == 2:
                return conv, False
        conv = cls.objects.create()
        conv.participants.add(user1, user2)
        return conv, True

    def other_user(self, user):
        return self.participants.exclude(id=user.id).first()


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']
