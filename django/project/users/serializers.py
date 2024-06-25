from rest_framework import serializers
from .models import User, Relationship
from games.models import User_Game

from django.utils import timezone
from datetime import timedelta

class UserGamesSerializer(serializers.ModelSerializer):
  user_B = serializers.SerializerMethodField()
  user_B_points = serializers.SerializerMethodField()
  user_B_username = serializers.SerializerMethodField()

  class Meta:
    model = User_Game
    fields = [
      'user',
      'game',
      'is_winner',
      'points',
      'user_B',
      'user_B_points',
      'user_B_username',
    ]

  def get_user_B(self, obj):
    user_B_object = User_Game.objects.filter(game=obj.game).exclude(user=obj.user).first()
    if user_B_object:
        return user_B_object.user.id
    return None

  def get_user_B_points(self, obj):
    user_B_points_object = User_Game.objects.filter(game=obj.game).exclude(user=obj.user).first()
    if user_B_points_object:
      return user_B_points_object.points
    return None
  
  def get_user_B_username(self, obj):
    user_B_object = User_Game.objects.filter(game=obj.game).exclude(user=obj.user).first()
    if user_B_object:
      user_B_id = user_B_object.user.id
    else:
      return None
    user_B_username_object = User.objects.filter(id= user_B_id).first()
    if user_B_username_object:
      return user_B_username_object.username
    return None

class FriendShipSerializer(serializers.ModelSerializer):
  id = serializers.IntegerField(source='user_B.id', read_only=True)
  user_B_username = serializers.CharField(source='user_B.username', read_only=True)
  user_B_avatar = serializers.ImageField(source='user_B.avatar', read_only=True)
  last_action = serializers.SerializerMethodField(read_only=True)
  class Meta:
    model = Relationship
    fields = [
      'id',
      'status',
      'user_B_username',
      'user_B_avatar',
      'last_action',
    ]
  
  def get_last_action(self, obj):
    user_B = obj.user_B
    if user_B:
      last_action = user_B.last_action
      if last_action:
        if timezone.now() - last_action > timedelta(minutes=3):
          return "OffLine"
        else:
          return "OnLine" 

class UserSerializer(serializers.ModelSerializer):
  password = serializers.CharField(write_only=True, required=True)
  has_two_factor_auth = serializers.SerializerMethodField(read_only=True)
  last_action = serializers.SerializerMethodField(read_only=True)
  friends = serializers.SerializerMethodField()
  win_games = serializers.SerializerMethodField()
  lose_games = serializers.SerializerMethodField()
  played_games = serializers.SerializerMethodField()
  last_games = serializers.SerializerMethodField()

  class Meta:
    model = User
    fields = [
      'id',
      'username',
      'password',
      'first_name',
      'last_name',
      'email',
      'birthdate',
      'avatar',
      'username_42',
      'level',
      'has_two_factor_auth',
      'last_action',
      'friends',
      'def_language',
      'win_games',
      'lose_games',
      'played_games',
      'last_games',
    ]
  
  def get_has_two_factor_auth(self, obj):
    return obj.two_factor_auth is not None
  
  def get_last_action(self, obj):
    last_action = obj.last_action
    if last_action:
      if timezone.now() - last_action > timedelta(minutes=3):
        return "OffLine"
      else:
        return "OnLine" 

  def get_friends(self, obj):
    friends_objects = Relationship.objects.filter(user_A=obj).prefetch_related('user_B')
    friends_data = FriendShipSerializer(friends_objects, many=True).data
    return friends_data

  def get_win_games(self, obj):
    win_games = User_Game.objects.filter(user_id=obj, is_winner=True).prefetch_related('id').count()
    return win_games

  def get_lose_games(self, obj):
    lose_games = User_Game.objects.filter(user_id=obj, is_winner=False).prefetch_related('id').count()
    return lose_games

  def get_played_games(self, obj):
    played_games = User_Game.objects.filter(user_id=obj).prefetch_related('id').count()
    return played_games

  def get_last_games(self, obj):
    games_objects = User_Game.objects.filter(user_id=obj).order_by('-game')
    if not games_objects.exists():
      return []
    games_data = UserGamesSerializer(games_objects, many = True).data
    return games_data
class UserUpdateSerializer(serializers.ModelSerializer):

  class Meta:
    model = User
    fields = [
      'id',
      'username',
      'first_name',
      'last_name',
      'email',
      'avatar',
      'def_language',
    ]
    extra_kwargs = {
      'username': {'required': False, 'allow_blank': True},
      'first_name': {'required': False, 'allow_blank': True},
      'last_name': {'required': False, 'allow_blank': True},
      'email': {'required': False, 'allow_blank': True},
      'avatar': {'required': False},
      'def_language': {'required': False},
      }


class UserSerializerTwoFactor(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = [
      'id',
      'two_factor_auth',
    ]

