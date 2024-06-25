from django.db import migrations, models
class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_relationship_user_friends'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='last_action',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
