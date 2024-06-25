from .serializers import GameWithPlayersSerializer
from .models import Game
from rest_framework import mixins, viewsets, status
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet
from rest_framework.response import Response

@permission_classes((IsAuthenticated,))
class GameViewSet(
  GenericViewSet,
  mixins.RetrieveModelMixin,
  mixins.CreateModelMixin,
):
  serializer_class = GameWithPlayersSerializer
  queryset = Game.objects.all()

  def create(self, request, *args, **kwargs):
    data = request.data
    n_players = data['n_players']
    type = data['type']
    if type == "local" or type == "remote":
      game_register = Game.objects.create(status="created", type=type)
    elif type == "tournament" or type == "localTournament":
      game_register = Game.objects.create(status="created", type=type, total_players=n_players)
    
    return Response({'id': game_register.id}, status=status.HTTP_201_CREATED)
