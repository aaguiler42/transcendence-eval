from django.db import migrations, models

def initial_data(apps, schema_editor):
    new_user = apps.get_model('users', 'User')
    new_user.objects.create(username='guest_user', first_name='guest_user', last_name='guest_user', email='guest_user@mail.com')
class Migration(migrations.Migration):

    dependencies = [
        ('users', '0012_alter_user_password_alter_user_username_42'),
    ]

    operations = [
        migrations.RunPython(initial_data),
    ]
