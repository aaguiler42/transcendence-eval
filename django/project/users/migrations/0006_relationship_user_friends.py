import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_alter_user_avatar'),
    ]

    operations = [
        migrations.CreateModel(
            name='Relationship',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('sended', 'sended'), ('received', 'received'), ('accepted', 'accepted'), ('nothing', 'nothing')], max_length=8)),
                ('user_A', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_A', to=settings.AUTH_USER_MODEL)),
                ('user_B', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_B', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='user',
            name='friends',
            field=models.ManyToManyField(through='users.Relationship', to=settings.AUTH_USER_MODEL),
        ),
    ]
