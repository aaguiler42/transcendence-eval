from django.urls import include, path
from .views import LoginView, UserViewSet, UserMeView
from rest_framework import routers

router = routers.DefaultRouter()
router.register('me', UserMeView, basename='me')
router.register('', UserViewSet, basename='users')

urlpatterns = [
  path('login/', LoginView.as_view()),
  path('', include(router.urls)),
]