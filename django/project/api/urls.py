from django.urls import path, include
from rest_framework_simplejwt.views import (
  TokenObtainPairView,
  TokenRefreshView,
  TokenVerifyView,
)

urlpatterns = [
  path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
  path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
  path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),

  path('users/', include('users.urls')),
  path('games/', include('games.urls')),
  path('ranking/', include('ranking.urls')),
  path('chat/', include('chat.urls')),
]