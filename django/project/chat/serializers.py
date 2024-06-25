from rest_framework import serializers
from .models import ChatsUsers
class UserChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatsUsers
        fields = ['sender', 'receiver', 'message', 'time', 'readed']
