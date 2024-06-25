from .serializers import RankingSerializer
from users.models import User

from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import ListModelMixin
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
@permission_classes((IsAuthenticated,))
class CustomPagination(PageNumberPagination):
    page_size = 5
    max_page_size = 100
    page_query_param = 'p'
    page_size_query_param = 'page_size'

    def get_paginated_response(self, data):
        return Response({
            'links': {
               'next': self.get_next_link(),
               'previous': self.get_previous_link()
            },
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })

@permission_classes((IsAuthenticated,))
class RankingViewSet(GenericViewSet, ListModelMixin):
    queryset = User.objects.exclude(id=1).order_by('-level', 'username')
    serializer_class = RankingSerializer
    pagination_class = CustomPagination

    def list(self, request, *args, **kwargs):
        users = self.queryset
        username = self.request.query_params.get('username')
        if username:
            users = users.filter(username__icontains=username)

        users = users.order_by('-level', 'username')
        page = self.paginate_queryset(users)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)