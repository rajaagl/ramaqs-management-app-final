from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ramaqs_management_plateforme', '0020_align_notification_index_names'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='projet',
            name='priorite',
        ),
    ]
