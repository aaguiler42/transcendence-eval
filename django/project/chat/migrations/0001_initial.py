from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ChatsUsers',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('msgId', models.IntegerField(null=True)),
                ('sender', models.IntegerField(null=True)),
                ('receiver', models.IntegerField(null=True)),
                ('readed', models.BooleanField(default=False)),
                ('time', models.DateTimeField(auto_now_add=True, null=True)),
                ('message', models.CharField(null=True)),
            ],
        ),
    ]
