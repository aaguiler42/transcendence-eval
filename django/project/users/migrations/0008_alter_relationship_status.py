from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_user_last_action'),
    ]

    operations = [
        migrations.AlterField(
            model_name='relationship',
            name='status',
            field=models.CharField(choices=[('sended', 'sended'), ('received', 'received'), ('accepted', 'accepted'), ('rejected', 'rejected')], max_length=8),
        ),
    ]
