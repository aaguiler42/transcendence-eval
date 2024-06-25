from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0001_initial'),
    ]

    operations = [
        migrations.DeleteModel(
            name='GamesRegister',
        ),
    ]
