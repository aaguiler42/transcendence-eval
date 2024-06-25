from django.db import models

class User_Game(models.Model):
  user = models.ForeignKey('users.User', on_delete=models.CASCADE)
  game = models.ForeignKey('games.Game', on_delete=models.CASCADE)
  is_winner = models.BooleanField(default=False)
  points = models.JSONField(default=list)

class Game(models.Model):
  C = "created"
  S = "started"
  F = "finished"
  A = "aborted"

  CHOICES = (
		(C, C),
		(S, S),
		(F, F),
		(A, A),
	)

  status = models.CharField(max_length=8, choices=CHOICES, default="created")
  type = models.CharField(max_length=15, null=True)
  total_players = models.IntegerField(null=True)
  tournament_id = models.IntegerField(null=True)
  creation_date = models.DateTimeField(auto_now_add=True, null= True)
  date = models.DateTimeField(auto_now_add=True)
  is_finished = models.BooleanField(default=False)
  players = models.ManyToManyField('users.User', through=User_Game)