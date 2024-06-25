from rest_framework.permissions import IsAuthenticated
from .models import User
from django.utils import timezone

class CheckLastAction:
	def __init__(self, get_response):
		self.get_response = get_response
	def __call__(self, request):
		response =self.get_response(request)
		if request.user.is_authenticated:
			User.objects.filter(username=request.user.username).update(last_action = timezone.now())
		return response