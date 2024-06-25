from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0002_game_players'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='creation_date',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='game',
            name='status',
            field=models.CharField(choices=[('created', 'created'), ('started', 'started'), ('finished', 'finished'), ('aborted', 'aborted')], default='created', max_length=8),
        ),
    ]
