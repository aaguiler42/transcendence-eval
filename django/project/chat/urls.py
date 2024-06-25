from django.urls import include, path
from .views import ChatViewSet

urlpatterns = [
    path('chat/<int:friend_id>/', ChatViewSet.as_view({'get': 'retrieve'}), name='chat-detail'),
]