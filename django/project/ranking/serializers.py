from rest_framework import serializers
from users.models import User

class RankingSerializer(serializers.ModelSerializer):
  position = serializers.SerializerMethodField()
  class Meta:
    model = User
    fields = ['position', 'username', 'level', 'last_action', 'id', 'avatar']
  
  def get_position(self, obj):
        queryset = User.objects.exclude(id=1).order_by('-level', 'username')
        position = list(queryset).index(obj) + 1
        return position