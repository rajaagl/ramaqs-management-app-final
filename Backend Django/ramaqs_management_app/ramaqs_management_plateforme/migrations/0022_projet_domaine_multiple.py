from django.db import migrations, models


def migrate_domains_to_list(apps, schema_editor):
    Projet = apps.get_model('ramaqs_management_plateforme', 'Projet')
    for project in Projet.objects.exclude(domaine__isnull=True).exclude(domaine=''):
        project.domaines = [project.domaine]
        project.save(update_fields=['domaines'])


class Migration(migrations.Migration):
    dependencies = [('ramaqs_management_plateforme', '0021_remove_projet_priorite')]

    operations = [
        migrations.AddField(model_name='projet', name='domaines', field=models.JSONField(blank=True, default=list)),
        migrations.RunPython(migrate_domains_to_list, migrations.RunPython.noop),
        migrations.RemoveField(model_name='projet', name='domaine'),
        migrations.RenameField(model_name='projet', old_name='domaines', new_name='domaine'),
    ]
