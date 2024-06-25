from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0010_alter_user_email'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='is_42_user',
        ),
        migrations.AddField(
            model_name='user',
            name='username_42',
            field=models.CharField(max_length=12, null=True, unique=True),
        ),
    ]
