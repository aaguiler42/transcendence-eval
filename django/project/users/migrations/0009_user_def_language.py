from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_alter_relationship_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='def_language',
            field=models.CharField(blank=True, max_length=2, null=True),
        ),
    ]
