from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0003_game_creation_date_game_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='nbr_players',
            field=models.IntegerField(null=True),
        ),
        migrations.AddField(
            model_name='game',
            name='tournament_id',
            field=models.IntegerField(null=True),
        ),
        migrations.AddField(
            model_name='game',
            name='type',
            field=models.CharField(max_length=10, null=True),
        ),
    ]
