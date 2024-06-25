from django.db import models, transaction
from django.contrib.auth.models import AbstractUser
from enum import Enum
import pyotp

class User(AbstractUser):
	email = models.EmailField(unique=True)
	password = models.CharField(max_length=128, null=True)
	birthdate = models.DateField(null=True)
	avatar = models.ImageField(upload_to='users_img/', null=True) 
	username_42 = models.CharField(max_length=12, null=True, unique=True, default=None)
	level = models.FloatField(default=0)
	two_factor_auth = models.CharField(max_length=100, null=True)
	friends = models.ManyToManyField('self', through='Relationship', symmetrical=False)
	last_action = models.DateTimeField(null=True, blank=True)
	def_language = models.CharField(null=True, blank=True, max_length=2)

	def __str__(self):
		return self.username

	def save(self, *args, **kwargs):
		self.username = self.username.lower()
		super(User, self).save(*args, **kwargs)

	@property
	def full_name(self):
		return self.first_name + ' ' + self.last_name
  
	def verify_two_factor_code(self, code):
		otp = pyotp.TOTP(self.two_factor_auth)
		return otp.verify(code)


class Relationship(models.Model):
	S = "sended"
	R = "received"
	A = "accepted"
	N = "rejected"

	CHOICES = (
		(S, S),
		(R, R),
		(A, A),
		(N, N),
	)
	user_A = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_A')
	user_B = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_B')
	status = models.CharField(max_length=8, choices=CHOICES)

	def save(self, *args, **kwargs):
		with transaction.atomic():
			super().save(*args, **kwargs)
			if self.status == "sended":
				b_status = "received"
				inverse_relationship_exists = Relationship.objects.filter(user_A=self.user_B, user_B=self.user_A).exists()
				if not inverse_relationship_exists:
					Relationship.objects.create(user_A=self.user_B, user_B = self.user_A, status=b_status)
