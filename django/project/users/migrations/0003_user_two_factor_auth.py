from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_level_alter_user_avatar_alter_user_birthdate'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='two_factor_auth',
            field=models.CharField(max_length=100, null=True),
        ),
    ]
