from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ramaqs_management_plateforme', '0019_single_tenant_and_remove_messaging'),
    ]

    operations = [
        migrations.RenameIndex(
            model_name='notification',
            new_name='notificatio_utilisa_5b7b58_idx',
            old_name='notification_user_lue_idx',
        ),
        migrations.RenameIndex(
            model_name='notification',
            new_name='notificatio_utilisa_c960d5_idx',
            old_name='notification_user_date_idx',
        ),
    ]
