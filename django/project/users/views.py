from .serializers import UserSerializer, UserSerializerTwoFactor, UserUpdateSerializer
from .models import User, Relationship
from django.db.models import Q
from rest_framework import mixins, viewsets
from rest_framework.decorators import permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password
from django.utils import timezone
import pyotp
import environ
import requests
from cryptography.fernet import Fernet
from collections import OrderedDict

env = environ.Env()
environ.Env.read_env(".env")

def get42Token(code):
  client_id = env('42_CLIENT_ID')
  client_secret = env('42_CLIENT_SECRET')

  data = {
    'grant_type': 'authorization_code',
    'client_id': client_id,
    'client_secret': client_secret,
    'code': code,
    'redirect_uri': 'https://localhost:3000'
  }
  response =  requests.post(
    'https://api.intra.42.fr/oauth/token',
    data=data
  )
  ft_response = response.json()
  return ft_response

def handleTokenResponse(user):
  serializer = UserSerializer(user)
  refresh = RefreshToken.for_user(user)
  response_data = {
    'user': serializer.data,
    'refresh': str(refresh),
    'access': str(refresh.access_token),
  }
  if user.two_factor_auth:
    key = env('FERNET_KEY')
    cipher_suite = Fernet(key)
    user_data_bytes = str(serializer.data).encode('utf-8')
    refresh_token_bytes = str(refresh).encode('utf-8')
    access_token_bytes = str(refresh.access_token).encode('utf-8')

    response_data = {
        'user': user_data_bytes,
        'refresh': refresh_token_bytes,
        'access': access_token_bytes,
    }

    cipher_text = cipher_suite.encrypt(str(response_data).encode('utf-8'))
    response_data_encrypted = {
      "message": "Two factor authentication required",
      "data": cipher_text,
    }
    return Response(response_data_encrypted, status=status.HTTP_200_OK)
  return Response(response_data, status=status.HTTP_200_OK)

class LoginView(APIView):
  def post(self, request):
    if 'two_factor_code' in request.data:
      two_factor_code = request.data.get('two_factor_code')
      data_cod = request.data.get('data')

      if two_factor_code != "":
        key = env('FERNET_KEY')
        cipher_suite = Fernet(key)
        cipher_text = request.data.get('data')
        plain_text = cipher_suite.decrypt(cipher_text)
        plain_text = plain_text.decode('utf-8')
        response_data = eval(plain_text)
        context = {"OrderedDict": OrderedDict}
        user = eval(response_data['user'], {"__builtins__": None}, context)
        user = User.objects.get(username=user['username'])
        is_2fa_valid = user.verify_two_factor_code(code=two_factor_code)
        if not is_2fa_valid:
          return Response({'message': 'Invalid two factor authentication code'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(response_data, status=status.HTTP_200_OK)
    if 'code' in request.data:
      code = request.data.get('code')
      ft_response = get42Token(code)

      if 'error' in ft_response:
        return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
      token = ft_response['access_token']
      user_42 = requests.get(
        "https://api.intra.42.fr/v2/me",
        headers={'Authorization': f'Bearer {token}'}
      ).json()

      user = User.objects.filter(username_42=user_42['login']).first()
      if user is None:
        try:
          user = User.objects.create(
            username=user_42['login'],
            email=user_42['email'],
            first_name=user_42['first_name'],
            last_name=user_42['last_name'],
            password=None,
            two_factor_auth=None,
            username_42=user_42['login']
          )
        except:
          return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
      return handleTokenResponse(user)
    else:
      username = request.data.get('username')
      password = request.data.get('password')

      user = User.objects.filter(username=username).first()

      if user is None or user.username_42 is not None or not user.check_password(password):
        return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
      return handleTokenResponse(user)

class UserViewSet(
  GenericViewSet,
  mixins.ListModelMixin,
  mixins.RetrieveModelMixin,
  mixins.CreateModelMixin,
  mixins.UpdateModelMixin,
):
  serializer_class = UserSerializer
  queryset = User.objects.all()
  lookup_field = 'pk'

  @permission_classes((IsAuthenticated,))
  def update(self, request, *args, **kwargs):
    user_caller = request.user
    user_caller_obj = User.objects.get(username=user_caller)

    user = self.get_object()
    user_obj = User.objects.get(username=user)

    friendship_request = self.request.data.get('status')
    if user_obj.username == "transcendenc3":
      return
    if friendship_request == 'sended':
      relation =  Relationship.objects.filter(user_A=user_caller_obj, user_B=user_obj)
      if relation.exists():
        Relationship.objects.filter(user_A=user_caller_obj, user_B=user_obj).update(status="sended")
        Relationship.objects.filter(user_A=user_obj, user_B=user_caller_obj).update(status="received")
      else:
        Relationship.objects.create(user_A=user_caller_obj, user_B=user_obj, status="sended")
    elif friendship_request == 'accepted':
      Relationship.objects.filter(user_A=user_caller_obj, user_B=user_obj).update(status="accepted")
      Relationship.objects.filter(user_A=user_obj, user_B=user_caller_obj).update(status="accepted")
    elif friendship_request == 'rejected':
      Relationship.objects.filter(user_A=user_caller_obj, user_B=user_obj).update(status="rejected")
      Relationship.objects.filter(user_A=user_obj, user_B=user_caller_obj).update(status="rejected")
    return Response({'message': 'Friendship sended successfully'}, status=status.HTTP_200_OK)


  @permission_classes((IsAuthenticated,))
  def retrieve(self, request, *args, **kwargs):
    user_caller = request.user
    user_caller_obj = User.objects.get(username=user_caller)
    user_caller_id = user_caller_obj.id

    user = self.get_object()
    user_obj = User.objects.get(username=user)
    user_id = user_obj.id

    try:
      status_object = Relationship.objects.get(user_A=user_caller_id, user_B=user_id)
      status_friend = status_object.status
    except Relationship.DoesNotExist:
      status_friend = 'Unsolicited'

    serializer = self.get_serializer(user)
    data = serializer.data
    data['status'] = status_friend
    return Response(data, status=status.HTTP_200_OK)

  def create (self, request):
    data_copy = request.data.copy()
    data_copy['password'] = make_password(data_copy['password'])

    if data_copy['avatar'] == 'undefined':
      data_copy['avatar'] = None

    user = User.objects.filter(email=data_copy['email']).first()
    if user:
      return Response({'message': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.filter(username=data_copy['username']).first()
    if user:
      return Response({'message': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    serializer = UserSerializer(data=data_copy)
    if serializer.is_valid():
      user = serializer.save()
      refresh = RefreshToken.for_user(user)
      response_data = {
        'user': serializer.data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
      }
      return Response(response_data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@permission_classes((IsAuthenticated,))
class UserMeView(
  GenericViewSet,
  mixins.ListModelMixin,
):
  serializer_class = UserSerializer

  def get_queryset(self):
    return User.objects.filter(id=self.request.user.id)

  def patch(self, request, *args, **kwargs):
    user = request.user
    user_data = request.data
    serializer_class = UserUpdateSerializer

    verify_user_instance = User.objects.filter(Q(email=user_data['email']) & ~Q(id=self.request.user.id)).first()
    if verify_user_instance:
      return Response({'message': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    verify_user_instance = User.objects.filter(Q(username=user_data['username']) & ~Q(id=self.request.user.id)).first()
    if verify_user_instance:
      return Response({'message': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = UserUpdateSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
      serializer.save()
      return Response({'message': 'User updated successfully'}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

  @action(detail=False, methods=['get', 'post', 'delete'])
  def two_fa(self, request):
    serializer_class = UserSerializerTwoFactor
    if request.method == 'DELETE':
      user = request.user
      user.two_factor_auth = None
      user.save()
      return Response({'message': 'Two factor authentication disabled'}, status=status.HTTP_200_OK)
    elif request.method == 'POST':
      secret = pyotp.random_base32()
      user = request.user
      user.two_factor_auth = secret
      user.save()
      app_url = pyotp.TOTP(secret).provisioning_uri(
        name=user.email,
        issuer_name='Pong 42'
      )
      return Response({
        'app_url': app_url,
      }, status=status.HTTP_200_OK)
    else:
      user = request.user
      if not user.two_factor_auth:
        return Response({'message': 'Two factor authentication disabled'}, status=status.HTTP_400_BAD_REQUEST)
      app_url = pyotp.TOTP(user.two_factor_auth).provisioning_uri(
        name=user.email,
        issuer_name='Pong 42'
      )
      return Response({'two_factor_auth': app_url}, status=status.HTTP_200_OK)