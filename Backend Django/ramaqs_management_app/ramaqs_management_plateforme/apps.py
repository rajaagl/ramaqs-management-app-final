from django.apps import AppConfig


class RamaqsManagementPlateformeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ramaqs_management_plateforme'

def ready(self):
        import ramaqs_management_plateforme.signals  