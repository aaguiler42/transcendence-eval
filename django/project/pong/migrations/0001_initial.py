from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='GamesRegister',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('number_of_players', models.IntegerField()),
                ('status', models.CharField(choices=[('created', 'created'), ('started', 'started'), ('finished', 'finished'), ('aborted', 'aborted')], max_length=8)),
                ('creation_date', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
