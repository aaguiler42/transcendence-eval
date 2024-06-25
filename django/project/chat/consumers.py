from channels.generic.websocket import AsyncWebsocketConsumer
import urllib.parse as urlparse
import json
from .models import ChatsUsers
from users.models import User, Relationship
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from django.db.models import Max, Q, Subquery, OuterRef, Min
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from channels.exceptions import DenyConnection

def verify_user_id(query_string, user_id_front):
    token = query_string.get('jwt', [None])[0]
    try:
        if token is None:
            raise DenyConnection("Invalid token")
        user_id = AccessToken(token).get('user_id')
        if (user_id != int(user_id_front)):
            raise DenyConnection("Invalid token")
        return user_id
    except (InvalidToken, TokenError):
        raise DenyConnection("Invalid token")

class ChatConsumer(AsyncWebsocketConsumer):
    users = []
    
    def get_friends(self, user_id):
        senderList = ChatsUsers.objects.filter(receiver=int(user_id)).distinct('sender')
        self.chats_queryset = senderList.filter(readed=False)

    async def connect(self):
        query_string = urlparse.parse_qs(self.scope['query_string'].decode())     
        user_id = self.scope['url_route']['kwargs']['user_id']

        try:
            verify_user_id(query_string, user_id)
        except DenyConnection as e:
            await self.close()
            return
        
        self.room_name = f'chat_{user_id}'

        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name
        )
        if user_id not in self.users:
            self.users.append(user_id)

        await self.accept()

        friend_data =[]
        self.get_friends(user_id)
        async for chat_instance in self.chats_queryset:
            if chat_instance.sender == int(user_id):
                friend_id = chat_instance.receiver
                sender = True
            else:
                friend_id = chat_instance.sender
                sender = False
            chatUsers_instance = await sync_to_async(ChatsUsers.objects.filter(Q(sender=int(user_id), receiver=friend_id) | Q(sender=friend_id, receiver=int(user_id))).first)()
            if chatUsers_instance is not None:
                chat_id = chatUsers_instance.msgId
            else:
                max_chat_id = await sync_to_async(ChatsUsers.objects.aggregate)(max_value=Max('msgId'))
                if max_chat_id['max_value'] is not None:
                    chat_id = max_chat_id['max_value'] + 1
                else:
                    chat_id = 1

            friend = await database_sync_to_async(User.objects.get)(id=friend_id)
            friend_data.append({
                "id":friend.id,
                "user_B_username": friend.username,
                "readed":chat_instance.readed,
                "sender" : sender,
                "chat_id" : chat_id
            }) 
        await self.send(text_data=json.dumps({
            "friends":friend_data
        }))

    async def disconnect(self, close_code):
        user_id = self.scope['url_route']['kwargs']['user_id']
        if user_id in self.users:
            self.users.remove(user_id)
        self.room_name = f'chat_{user_id}'
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )

    async def receive(self, text_data):
        user_id = self.scope['url_route']['kwargs']['user_id']
        data = json.loads(text_data)
        receiver = data['to']
        
        chatUsers_instance = await sync_to_async(ChatsUsers.objects.filter(Q(sender=user_id, receiver=receiver) | Q(sender=receiver, receiver=user_id)).first)()
        if chatUsers_instance is not None:
            chat_id = chatUsers_instance.msgId
        else:
            max_chat_id = await sync_to_async(ChatsUsers.objects.aggregate)(max_value=Max('msgId'))
            if max_chat_id['max_value'] is not None:
                chat_id = max_chat_id['max_value'] + 1
            else:
                chat_id = 1
        new_chat_instance = await sync_to_async(ChatsUsers.objects.create)(sender=user_id, receiver=receiver, msgId = chat_id, message =data['message'])
        sync_to_async(new_chat_instance.save)()

        friends_status = await sync_to_async(Relationship.objects.filter(Q(user_A=user_id, user_B=receiver) | Q(user_A=receiver, user_B=user_id)).first)()
        friends_status_value = friends_status.status
        if friends_status_value != 'accepted':
            return
        await self.channel_layer.group_send(
            f'chat_{user_id}',
            {
                'type': 'chat_message',
                'message': data['message'],
                'friend_id': receiver,
                'from': user_id,
                'chat_id': chat_id
            }
        )

        if receiver in self.users:
            await self.channel_layer.group_send(
                f'chat_{receiver}',
                {
                    'type': 'chat_message',
                    'message': data['message'],
                    'friend_id': user_id,
                    'from': user_id,
                    'chat_id': chat_id
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'friend_id': event['friend_id'],
            'from': event['from'],
            'chat_id': event['chat_id']
            
        }))