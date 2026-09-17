from django.db import migrations, models


def copy_membership_roles(apps, schema_editor):
    """Conserve le rôle actuel avant suppression de tenant_memberships."""
    Utilisateur = apps.get_model('ramaqs_management_plateforme', 'Utilisateur')
    TenantMembership = apps.get_model('ramaqs_management_plateforme', 'TenantMembership')
    for user in Utilisateur.objects.all().iterator():
        membership = TenantMembership.objects.filter(user_id=user.id).order_by('date_joined').first()
        if membership and membership.role and user.role != membership.role:
            user.role = membership.role
            user.save(update_fields=['role'])


class Migration(migrations.Migration):

    dependencies = [
        ('ramaqs_management_plateforme', '0018_alter_projet_avancement_globale'),
    ]

    operations = [
        migrations.RunPython(copy_membership_roles, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='utilisateur',
            name='role',
            field=models.CharField(
                choices=[
                    ('super_admin', 'Super Administrateur RAMAQS'),
                    ('direction', 'Direction'),
                    ('chef_projet', 'Chef de projet'),
                    ('consultant', 'Consultant'),
                    ('client', 'Client'),
                    ('partenaire', 'Partenaire'),
                ],
                default='consultant',
                max_length=20,
            ),
        ),
        migrations.RemoveIndex(model_name='projet', name='projets_tenant__59e73a_idx'),
        migrations.RemoveIndex(model_name='projet', name='projets_tenant__ed0e25_idx'),
        migrations.RemoveIndex(model_name='tache', name='taches_tenant__cef135_idx'),
        migrations.RemoveIndex(model_name='tache', name='taches_tenant__58a632_idx'),
        migrations.RemoveIndex(model_name='notification', name='notificatio_tenant__e80ab0_idx'),
        migrations.RemoveIndex(model_name='notification', name='notificatio_tenant__38a125_idx'),
        migrations.RemoveIndex(model_name='message', name='messages_tenant__a3a29c_idx'),
        migrations.RemoveField(model_name='projet', name='tenant'),
        migrations.RemoveField(model_name='tache', name='tenant'),
        migrations.RemoveField(model_name='soustache', name='tenant'),
        migrations.RemoveField(model_name='commentaire', name='tenant'),
        migrations.RemoveField(model_name='ressource', name='tenant'),
        migrations.RemoveField(model_name='notification', name='tenant'),
        migrations.RemoveField(model_name='kpi', name='tenant'),
        migrations.RemoveField(model_name='budget', name='tenant'),
        migrations.DeleteModel(name='Message'),
        migrations.DeleteModel(name='Conversation'),
        migrations.DeleteModel(name='TenantMembership'),
        migrations.DeleteModel(name='Tenant'),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['utilisateur', 'lue'], name='notification_user_lue_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['utilisateur', '-date_envoi'], name='notification_user_date_idx'),
        ),
    ]
