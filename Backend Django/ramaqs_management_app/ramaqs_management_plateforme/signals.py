from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg


def recalculer_avancement_projet(projet_id):
    from .models import Tache, Projet
    resultat = Tache.objects.filter(
        projet_id=projet_id
    ).aggregate(moyenne=Avg('avancement'))
    nouvelle_valeur = round(resultat['moyenne'] or 0)
    Projet.objects.filter(id=projet_id).update(
        avancement_globale=nouvelle_valeur
    )


@receiver(post_save, sender='ramaqs_management_plateforme.Tache')
def maj_avancement_sur_save(sender, instance, **kwargs):
    if instance.projet_id:
        recalculer_avancement_projet(instance.projet_id)


@receiver(post_delete, sender='ramaqs_management_plateforme.Tache')
def maj_avancement_sur_delete(sender, instance, **kwargs):
    if instance.projet_id:
        recalculer_avancement_projet(instance.projet_id)