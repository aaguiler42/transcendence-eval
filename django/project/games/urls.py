from .views import GameViewSet
from rest_framework import routers
from django.urls import path, include


router = routers.DefaultRouter()
router.register('games', GameViewSet, basename='games')

urlpatterns = router.urls
