from channels.generic.websocket import AsyncWebsocketConsumer
from channels.exceptions import DenyConnection
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.db.models import F
from games.models import Game, User_Game
from users.models import User
import asyncio
import json
from datetime import datetime, timedelta
import urllib.parse as urlparse
import random
from asgiref.sync import sync_to_async


height = 40
width = 160
paddle_y = height // 2
paddle_length = 9
paddle_speed = 3

def get_random_speed():
    total_speed = 3
    x_speed = random.random() * total_speed
    y_speed = total_speed - x_speed

    while x_speed < 1 or x_speed > total_speed - 0.1 or y_speed < 0.1 or y_speed > total_speed - 0.1:
        x_speed = random.random() * total_speed
        y_speed = total_speed - x_speed

    if random.choice([True, False]):
        x_speed = -x_speed
    if random.choice([True, False]):
        y_speed = -y_speed
    return x_speed, y_speed

def reset_ball(room_connection):
    room_connection['ball_x'] = width // 2
    room_connection['ball_y'] = height // 2
    room_connection['ball_x_speed'], room_connection['ball_y_speed'] = get_random_speed()

def recalculate_ball(room_connection):
    room_connection['ball_x'] += room_connection['ball_x_speed']
    room_connection['ball_y'] += room_connection['ball_y_speed']

    ball_x = room_connection['ball_x']
    ball_y = room_connection['ball_y']
    left_paddle_y = room_connection['left_paddle_y']
    right_paddle_y = room_connection['right_paddle_y']

    if ball_y <= 0 or ball_y >= height:
        room_connection['ball_y_speed'] = -room_connection['ball_y_speed']

    if ball_x <= 1 and left_paddle_y - paddle_length / 2 <= ball_y <= left_paddle_y + paddle_length / 2:
        room_connection['ball_x_speed'] = -room_connection['ball_x_speed']
        return
    elif ball_x >= width - 1 and right_paddle_y - paddle_length / 2 <= ball_y <= right_paddle_y + paddle_length / 2:
        room_connection['ball_x_speed'] = -room_connection['ball_x_speed']
        return

    if ball_x <= 0 or ball_x >= width:
        if ball_x <= 0:
            room_connection['right_score'] += 1
        else:
            room_connection['left_score'] += 1
        reset_ball(room_connection)

localUserId = "1"

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

class PongConsumer(AsyncWebsocketConsumer):
    room_connections = {}
    user_viewer = []

    def get_game(self, game_id):
        try:
            game = Game.objects.get(id = game_id)
            return game
        except:
            return None

    def get_game_data(self, game_id):
        return Game.objects.filter(id = game_id)

    def update_game_status(self, game_id):
        game_queryset = self.get_game_data(game_id)
        game_queryset.update(status="finished", is_finished=True)

    def update_game_status_aborted(self, game_id):
        game_queryset = self.get_game_data(game_id)
        game_queryset.update(status="aborted", is_finished=True)
        game_instance = game_queryset.first()
        if game_instance and game_instance.type == "tournament":
            games_tournament_queryset = Game.objects.filter(tournament_id = game_id)
            if games_tournament_queryset:
                games_tournament_queryset.update(status="aborted", is_finished=True)

    def update_usergame_data(self, game_id, is_winner, points_list, player1Id):
        User_Game.objects.create(is_winner = is_winner, points = points_list, game_id = game_id, user_id = player1Id)

    def get_total_players(self, room):
        total_players = Game.objects.filter(id = room).values_list('total_players', flat=True).first()
        return total_players

    def create_games(self, type, tournament_id):
        new_tournament_game = Game.objects.create(status="created", type=type, tournament_id = tournament_id)
        return new_tournament_game.id

    def update_user_level(self, player1Id, player2Id, is_winner1Id, is_winner2Id, player1_score, player2_score):
        if is_winner1Id:
            User.objects.filter(id = player1Id).update(level=F('level') + 0.5 + int(player1_score) * 0.1)                
        elif is_winner2Id:
            User.objects.filter(id = player2Id).update(level=F('level') + 0.5 + int(player2_score) * 0.1)
    
    def update_championship_user_level(self, playerId, extra_points):
        User.objects.filter(id = playerId).update(level=F('level') + float(extra_points))

    def get_player_username(self, playerId):
        player_data = User.objects.get(id = playerId).username
        return player_data

    async def create_tournament_games(self):
        total_players = self.room_connections[self.room_name]['total_players']
        total_games = total_players - 1
        room = int(self.room_name)
        for i in range(total_games):
            tournament_game = await sync_to_async(self.create_games)("remote", room)
            self.room_connections[self.room_name]['games'].append(tournament_game)
        self.send(text_data=json.dumps({
            'players': total_players,
            'tournamentId': room,
        }))

    async def create_players_names_list(self):
        players_list = self.room_connections[self.room_name]['players']
        players_name_list=[]
        room = int(self.room_name)
        for player_id in players_list:
            players_name_list.append(await sync_to_async(self.get_player_username)(player_id))
        return players_name_list

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'game_{self.room_name}'

        game_object = await sync_to_async(self.get_game)(self.room_name)
        if (not game_object or game_object.status != 'created'):
            await self.accept()
            await self.send(text_data=json.dumps({'error': 'Invalid game Id'}))
            await self.close()
            return
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        query_string = urlparse.parse_qs(self.scope['query_string'].decode())
        type = query_string.get('type', [None])[0]
        user_id = query_string.get('userId', [None])[0]
        tournament_ready = False
        if type == 'local':
            try:
                verify_user_id(query_string, user_id)
            except DenyConnection as e:
                await self.close()
                return
            if self.room_connections.get(self.room_name) is None:
                self.room_connections[self.room_name] = {
                    'player1Id': user_id,
                    'player2Id': localUserId,
                }
            elif self.room_connections[self.room_name]['player1Id'] is not None and self.room_connections[self.room_name]['player2Id'] is not None:
                self.user_viewer.append(user_id)
                self.user_id = user_id
            await self.accept()
        elif type == 'localTournament':
            try:
                verify_user_id(query_string, user_id)
            except DenyConnection as e:
                await self.close()
                return
            if self.room_connections.get(self.room_name) is None:
                self.room_connections[self.room_name] = {
                    'players': [],
                }
            else:
                self.user_viewer.append(user_id)
                self.user_id = user_id
            await self.accept()
        elif type == 'remote':
            verify_user_id(query_string, user_id)
            if self.room_connections.get(self.room_name) is None:
                self.room_connections[self.room_name] = {
                    'player1Id': user_id,
                    'player2Id': None,
                }
            elif self.room_connections[self.room_name]['player1Id'] is not None and self.room_connections[self.room_name]['player2Id'] is None and self.room_connections[self.room_name]['player1Id'] != user_id:
                self.room_connections[self.room_name]['player2Id'] = user_id
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'players_in_game',
                        'message': "all players connected",
                        'players': [],
                    }
                )
            elif self.room_connections[self.room_name]['player1Id'] is not None and self.room_connections[self.room_name]['player2Id'] is not None:
                self.user_viewer.append(user_id)
            await self.accept()
        elif type == 'tournament':
            verify_user_id(query_string, user_id)         
            if self.room_connections.get(self.room_name) is None:
                self.room_connections[self.room_name] = {
                    'players': [user_id],
                    'total_players':  await sync_to_async(self.get_total_players)(self.room_name),
                    'games':[],
                }
            elif self.room_connections[self.room_name]['players'] is not None and len(self.room_connections[self.room_name]['players']) <= int(self.room_connections[self.room_name]['total_players']):
                self.room_connections[self.room_name]['players'].append(user_id)
                if len(self.room_connections[self.room_name]['players']) == int(self.room_connections[self.room_name]['total_players']):
                    random.shuffle(self.room_connections[self.room_name]['players'])
                    tournament_ready = True
                    playerNameslist = await self.create_players_names_list()
                    print("PLAYERSNAMES", playerNameslist)
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'players_in_game',
                            'message': "all players connected",
                            'players': playerNameslist
                        }
                    )
            else:
                self.user_viewer.append(user_id)
            await self.accept()
        else:
            await self.close()
        
        if tournament_ready:
            await self.create_tournament_games()

    async def disconnect(self, close_code):
        user_id = urlparse.parse_qs(self.scope['query_string'].decode()).get('userId', [None])[0]
        if (user_id not in self.user_viewer):
            if self.room_connections.get(self.room_name) is not None:
                self.room_connections.pop(self.room_name, None)

            if (close_code != 1000):
                await sync_to_async(self.update_game_status_aborted)(self.room_name)
                await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game_aborted',
                            'message': "aborted",
                        }
                    )

            if self.room_connections.get(self.room_name) is not None:
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
        else:
            self.user_viewer.remove(user_id)
            
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data['message_type']
        try:
            if self.room_name not in self.room_connections:
                return

            if message_type == 'localTournament':
                self.room_connections[self.room_name]['players'] = data['players']
            if message_type == 'start_game':
                if self.room_connections[self.room_name]['player1Id'] is not None and self.room_connections[self.room_name]['player2Id'] is not None:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'players_usernames',
                            'player1': await sync_to_async(self.get_player_username)(self.room_connections[self.room_name]['player1Id']),
                            'player2': await sync_to_async(self.get_player_username)(self.room_connections[self.room_name]['player2Id']),
                        }
                    )
                    asyncio.create_task(self.start_game(15, None))
                else:
                    await self.send(text_data=json.dumps({
                        'error': 'Not enough players',
                    }))
            elif message_type == 'start_tournament':
                round = int(data['round'])
                final_round = 0
                if len(self.room_connections[self.room_name]['games']) == 1:
                    final_round = int(self.room_connections[self.room_name]['total_players']) // 2
                actual_room_data = self.room_connections[self.room_name]
                self.room_connections[self.room_name] = {
                    'player1Id': self.room_connections[self.room_name]['players'][round],
                    'player2Id': self.room_connections[self.room_name]['players'][round + 1],
                    'game': self.room_connections[self.room_name]['games'].pop(0),
                    'total_players': self.room_connections[self.room_name]['total_players'],
                    'final_round': final_round,
                }
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'players_usernames',
                        'player1': await sync_to_async(self.get_player_username)(self.room_connections[self.room_name]['player1Id']),
                        'player2': await sync_to_async(self.get_player_username)(self.room_connections[self.room_name]['player2Id']),
                    }
                )
                asyncio.create_task(self.start_game(15, actual_room_data))
            elif message_type == 'start_local_tournament':
                round = int(data['round'])
                final_round = 0
                if len(self.room_connections[self.room_name]['players']) == 2:
                    final_round = int(len(self.room_connections[self.room_name]['players'])) // 2
                actual_room_data = self.room_connections[self.room_name]
                self.room_connections[self.room_name] = {
                    'player1Id': self.room_connections[self.room_name]['players'][round],
                    'player2Id': self.room_connections[self.room_name]['players'][round + 1],
                    'total_players': data['total_players'],
                    'final_round': final_round,
                }
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'players_usernames',
                        'player1': self.room_connections[self.room_name]['player1Id'],
                        'player2': self.room_connections[self.room_name]['player2Id'],
                    }
                )
                asyncio.create_task(self.start_game(15, actual_room_data))
            elif message_type == 'move_paddle':
                paddle = None
                query_string = urlparse.parse_qs(self.scope['query_string'].decode())
                type = query_string.get('type', [None])[0]
                if type == 'local' or type == 'localTournament':
                    paddle = data['paddle']
                elif type == 'remote' or 'tournament':
                    user_id = query_string.get('userId', [None])[0]
                    if self.room_connections[self.room_name]['player1Id'] == user_id:
                        paddle = 'left'
                    elif self.room_connections[self.room_name]['player2Id'] == user_id:
                        paddle = 'right'
                direction = data['direction']

                if paddle == 'left':
                    if direction == 'up':
                        self.room_connections[self.room_name]['left_paddle_y'] = max(0, self.room_connections[self.room_name]['left_paddle_y'] - paddle_speed)
                    elif direction == 'down':
                        self.room_connections[self.room_name]['left_paddle_y'] = min(height, self.room_connections[self.room_name]['left_paddle_y'] + paddle_speed)
                elif paddle == 'right':
                    if direction == 'up':
                        self.room_connections[self.room_name]['right_paddle_y'] = max(0, self.room_connections[self.room_name]['right_paddle_y'] - paddle_speed)
                    elif direction == 'down':
                        self.room_connections[self.room_name]['right_paddle_y'] = min(height, self.room_connections[self.room_name]['right_paddle_y'] + paddle_speed)
        except Exception as e:
            print(e)

    async def close_room(self):
        if self.room_connections.get(self.room_name) is not None:
            self.room_connections.pop(self.room_name, None)
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        await self.close()

    async def start_game(self, duration, actual_room_data):
        if self.scope['user'].id not in self.user_viewer:
            countdown_start_time = datetime.now()
            countdown_end_time = countdown_start_time + timedelta(seconds=10)
            while datetime.now() < countdown_end_time:
                countdown = (countdown_end_time - datetime.now()).total_seconds()
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'countdown',
                        'countdown': countdown,
                    }
                )
                await asyncio.sleep(0.5)
            start_time = datetime.now()
            end_time = start_time + timedelta(seconds=duration)

            self.room_connections[self.room_name]['left_paddle_y'] = paddle_y
            self.room_connections[self.room_name]['right_paddle_y'] = paddle_y
            self.room_connections[self.room_name]['left_score'] = 0
            self.room_connections[self.room_name]['right_score'] = 0
            self.room_connections[self.room_name]['ball_x'] = width // 2
            self.room_connections[self.room_name]['ball_y'] = height // 2
            self.room_connections[self.room_name]['ball_x_speed'], self.room_connections[self.room_name]['ball_y_speed'] = get_random_speed()
    
            self.room_connections[self.room_name]['points_list_left'] = []
            self.room_connections[self.room_name]['points_list_right'] = []
            prev_value_left = 0
            prev_value_right = 0

            while datetime.now() < end_time:
                time_left = (end_time - datetime.now()).total_seconds()

                recalculate_ball(self.room_connections[self.room_name])
                if prev_value_left != self.room_connections[self.room_name]['left_score']:
                    self.room_connections[self.room_name]['points_list_left'].append(60-time_left)
                    prev_value_left = self.room_connections[self.room_name]['left_score']
                if prev_value_right != self.room_connections[self.room_name]['right_score']:
                    self.room_connections[self.room_name]['points_list_right'].append(60-time_left)
                    prev_value_right = self.room_connections[self.room_name]['right_score']
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game',
                        'time_left': time_left,
                        'ball_x': self.room_connections[self.room_name]['ball_x'],
                        'ball_y': self.room_connections[self.room_name]['ball_y'],
                        'left_paddle_y': self.room_connections[self.room_name]['left_paddle_y'],
                        'right_paddle_y': self.room_connections[self.room_name]['right_paddle_y'],
                        'left_score': self.room_connections[self.room_name]['left_score'],
                        'right_score': self.room_connections[self.room_name]['right_score'],
                    }
                )
                await asyncio.sleep(0.05)
            query_string = urlparse.parse_qs(self.scope['query_string'].decode())
            type = query_string.get('type', [None])[0]
            if  self.room_connections[self.room_name]['left_score'] == self.room_connections[self.room_name]['right_score'] and (type == "tournament" or type == "localTournament"):
                while self.room_connections[self.room_name]['left_score'] == self.room_connections[self.room_name]['right_score']:
                    time_left = "GOLDEN POINT"
                    recalculate_ball(self.room_connections[self.room_name])
                    if prev_value_left != self.room_connections[self.room_name]['left_score']:
                        self.room_connections[self.room_name]['points_list_left'].append(60)
                        prev_value_left = self.room_connections[self.room_name]['left_score']
                    if prev_value_right != self.room_connections[self.room_name]['right_score']:
                        self.room_connections[self.room_name]['points_list_right'].append(60)
                        prev_value_right = self.room_connections[self.room_name]['right_score']
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game',
                            'time_left': time_left,
                            'ball_x': self.room_connections[self.room_name]['ball_x'],
                            'ball_y': self.room_connections[self.room_name]['ball_y'],
                            'left_paddle_y': self.room_connections[self.room_name]['left_paddle_y'],
                            'right_paddle_y': self.room_connections[self.room_name]['right_paddle_y'],
                            'left_score': self.room_connections[self.room_name]['left_score'],
                            'right_score': self.room_connections[self.room_name]['right_score'],
                        }
                    )
                    await asyncio.sleep(0.05)

            if type == "tournament":
                await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'result_tournament',
                            'left_score': self.room_connections[self.room_name]['left_score'],
                            'right_score': self.room_connections[self.room_name]['right_score'],
                            'point_list_left': self.room_connections[self.room_name]['points_list_left'],
                            'point_list_right': self.room_connections[self.room_name]['points_list_right'],
                            'room_code': self.room_connections[self.room_name]['game'],
                            'total_players': self.room_connections[self.room_name]['total_players'],
                        }
                )
            elif type == "localTournament":
                await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'result_local_tournament',
                            'left_score': self.room_connections[self.room_name]['left_score'],
                            'right_score': self.room_connections[self.room_name]['right_score'],
                            'point_list_left': self.room_connections[self.room_name]['points_list_left'],
                            'point_list_right': self.room_connections[self.room_name]['points_list_right'],
                            'total_players': self.room_connections[self.room_name]['total_players'],
                        }
                )
            else:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'result',
                        'left_score': self.room_connections[self.room_name]['left_score'],
                        'right_score': self.room_connections[self.room_name]['right_score'],
                        'point_list_left': self.room_connections[self.room_name]['points_list_left'],
                        'point_list_right': self.room_connections[self.room_name]['points_list_right'],
                    }
                )
           
            player1Id = self.room_connections[self.room_name]['player1Id']
            player2Id = self.room_connections[self.room_name]['player2Id']
            player1_score = self.room_connections[self.room_name]['left_score']
            player2_score = self.room_connections[self.room_name]['right_score']
            player1_points_list = self.room_connections[self.room_name]['points_list_left']
            player2_points_list = self.room_connections[self.room_name]['points_list_right']
            game = ""

            if type == 'tournament':
                game = self.room_connections[self.room_name]['game']
                await sync_to_async(self.update_game_status)(game)
                if int(self.room_connections[self.room_name]['final_round']) != 0:
                    await sync_to_async(self.update_game_status)(self.room_name)
            else:
                await sync_to_async(self.update_game_status)(self.room_name)

            if player1_score > player2_score:
                is_winner1Id = True
                is_winner2Id = False
                looser = player2Id
            elif player1_score < player2_score: 
                is_winner2Id = True
                is_winner1Id = False
                looser = player1Id
            else:
                is_winner2Id = False
                is_winner1Id = False
            if type == 'tournament':
                if int(self.room_connections[self.room_name]['final_round']) != 0 and is_winner1Id:
                    await sync_to_async(self.update_championship_user_level)(player1Id, self.room_connections[self.room_name]['final_round'])
                elif self.room_connections[self.room_name]['final_round'] != 0 and is_winner2Id:
                    await sync_to_async(self.update_championship_user_level)(player2Id, self.room_connections[self.room_name]['final_round'])
                self.room_connections[self.room_name] = actual_room_data
                self.room_connections[self.room_name]['players'].remove(looser)
                self.user_viewer.append(looser)
                await sync_to_async(self.update_usergame_data)(game, is_winner1Id, player1_points_list, player1Id)
                await sync_to_async(self.update_usergame_data)(game, is_winner2Id, player2_points_list, player2Id)
            elif type == 'localTournament':
                self.room_connections[self.room_name] = actual_room_data
                self.room_connections[self.room_name]['players'].remove(looser)
            else:
                await sync_to_async(self.update_usergame_data)(self.room_name, is_winner1Id, player1_points_list, player1Id)
                await sync_to_async(self.update_usergame_data)(self.room_name, is_winner2Id, player2_points_list, player2Id)
            if type != 'localTournament':
                await sync_to_async(self.update_user_level)(player1Id, player2Id, is_winner1Id, is_winner2Id, player1_score, player2_score)

            if ((type == 'tournament' or type == 'localTournament') and len(actual_room_data['players']) == 1) or actual_room_data is None:
                await self.close_room()

    async def game(self, event):
        time_left = event['time_left']
        ball_x = event['ball_x']
        ball_y = event['ball_y']
        left_paddle_y = event['left_paddle_y']
        right_paddle_y = event['right_paddle_y']
        left_score = event['left_score']
        right_score = event['right_score']

        await self.send(text_data=json.dumps({
            'time_left': time_left,
            'ball_x': ball_x,
            'ball_y': ball_y,
            'left_paddle_y': left_paddle_y,
            'right_paddle_y': right_paddle_y,
            'left_score': left_score,
            'right_score': right_score,
        }))

    async def result(self, event):
        left_score = event['left_score']
        right_score = event['right_score']
        point_list_left = event[ 'point_list_left']
        point_list_right = event[ 'point_list_right']
        await self.send(text_data=json.dumps({
            'left_score': left_score,
            'right_score': right_score,
            'point_list_left': point_list_left,
            'point_list_right': point_list_right,
        }))

    async def result_tournament(self, event):
        left_score = event['left_score']
        right_score = event['right_score']
        point_list_left = event[ 'point_list_left']
        point_list_right = event[ 'point_list_right']
        room_code = event['room_code']
        total_players = event['total_players']
        await self.send(text_data=json.dumps({
            'left_score': left_score,
            'right_score': right_score,
            'point_list_left': point_list_left,
            'point_list_right': point_list_right,
            'room_code': room_code,
            'total_players': total_players,
        }))

    async def result_local_tournament(self, event):
        left_score = event['left_score']
        right_score = event['right_score']
        point_list_left = event[ 'point_list_left']
        point_list_right = event[ 'point_list_right']
        total_players = event['total_players']
        await self.send(text_data=json.dumps({
            'left_score': left_score,
            'right_score': right_score,
            'point_list_left': point_list_left,
            'point_list_right': point_list_right,
            'total_players': total_players,
        }))

    async def countdown(self, event):
        countdown = event['countdown']

        await self.send(text_data=json.dumps({
            'countdown': countdown,
        }))

    async def players_usernames(self, event):
        player1 = event['player1']
        player2 = event['player2']
        await self.send(text_data=json.dumps({
            'player1': player1,
            'player2': player2,

        }))

    async def game_aborted(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
        'message': message,
    }))

    async def players_in_game(self, event):
        message = event['message']
        players = event['players']
        await self.send(text_data=json.dumps({
        'message': message,
        'players': players,
    }))