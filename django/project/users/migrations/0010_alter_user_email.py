from django.db import migrations, models
class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_user_def_language'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(max_length=254, unique=True),
        ),
    ]
