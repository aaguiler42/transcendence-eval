from .views import RankingViewSet
from rest_framework import routers

router = routers.DefaultRouter()
router.register('', RankingViewSet, basename='ranking')

urlpatterns = router.urls