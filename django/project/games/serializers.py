from rest_framework import serializers
from .models import Game, User_Game

class UserGameSerializer(serializers.ModelSerializer):
  id = serializers.IntegerField(source='user.id')
  username = serializers.CharField(source='user.username')
  avatar = serializers.CharField(source='user.avatar')

  class Meta:
    model = User_Game
    fields = ['id', 'username', 'avatar', 'is_winner', 'points']

class GameWithPlayersSerializer(serializers.ModelSerializer):
  players = serializers.SerializerMethodField()

  class Meta:
    model = Game
    fields = ['id', 'date', 'is_finished', 'players']

  def get_players(self, obj):
    user_game_objects = User_Game.objects.filter(game=obj).prefetch_related('user')
    return UserGameSerializer(user_game_objects, many=True).data
