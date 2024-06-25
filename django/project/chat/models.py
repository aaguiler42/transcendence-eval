from django.conf import settings
from django.db import models

class ChatsUsers(models.Model):
    msgId = models.IntegerField(null=True)
    sender = models.IntegerField(null=True)
    receiver = models.IntegerField(null=True)
    readed = models.BooleanField(default=False)
    time = models.DateTimeField(auto_now_add=True, null=True)
    message = models.CharField(null=True)
