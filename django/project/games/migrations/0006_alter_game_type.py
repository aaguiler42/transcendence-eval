from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0005_rename_nbr_players_game_total_players'),
    ]

    operations = [
        migrations.AlterField(
            model_name='game',
            name='type',
            field=models.CharField(max_length=15, null=True),
        ),
    ]
