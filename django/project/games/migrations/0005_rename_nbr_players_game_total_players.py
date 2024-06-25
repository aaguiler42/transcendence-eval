from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0004_game_nbr_players_game_tournament_id_game_type'),
    ]

    operations = [
        migrations.RenameField(
            model_name='game',
            old_name='nbr_players',
            new_name='total_players',
        ),
    ]
