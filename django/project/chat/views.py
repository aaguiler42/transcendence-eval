from .serializers import UserChatSerializer
from .models import ChatsUsers
from users.models import User
from rest_framework import mixins, viewsets, status
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet
from rest_framework.response import Response
from django.db.models import Max, Q

@permission_classes((IsAuthenticated, ))
class ChatViewSet(
  GenericViewSet,
  mixins.RetrieveModelMixin,
):
  serializer_class = UserChatSerializer
  queryset = ChatsUsers.objects.all()

  def retrieve(self, request, *args, **kwargs):
    friend_id = self.kwargs.get('friend_id')
    user_id = request.query_params.get('user_id')

    chat_user_instance = ChatsUsers.objects.filter(Q(sender=user_id, receiver=friend_id) | Q(sender=friend_id, receiver=user_id)).first()
    if chat_user_instance is not None:
      chat_id = chat_user_instance.msgId
      chat_queryset = ChatsUsers.objects.filter(msgId=chat_id).order_by('id')
      serializer = self.get_serializer(chat_queryset, many=True)
      queryset = ChatsUsers.objects.filter(msgId=chat_id, receiver=user_id)
      queryset.update(readed=True)
      return Response(serializer.data, status=status.HTTP_200_OK)
    return Response({'message': 'No messages yet'}, status=status.HTTP_200_OK)
