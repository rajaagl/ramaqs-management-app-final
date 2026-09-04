# calendar_views.py
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Tache, Projet
from rest_framework.permissions import IsAuthenticated


def _parse_date_param(value):
    """Parse une date qui peut arriver en 'YYYY-MM-DD' ou en ISO datetime complet (FullCalendar envoie parfois les deux)"""
    if not value:
        return None
    d = parse_date(value)
    if d:
        return d
    dt = parse_datetime(value)
    return dt.date() if dt else None


def get_calendar_taches(user, date_debut, date_fin):
    """Tâches visibles dans le calendrier selon le rôle"""
    qs = Tache.objects.filter(date_fin_prevue__range=[date_debut, date_fin])
    role = user.role

    if role == 'direction':
        return qs
    if role == 'chef_projet':
        return qs.filter(projet__chef_projet=user)
    if role == 'consultant':
        return qs.filter(consultant=user)
    if role == 'partenaire':
        return qs.filter(projet__partenaires=user)
    # client : pas d'accès au détail des tâches (cohérent avec DocumentViewSet)
    return Tache.objects.none()


def get_calendar_projets(user, date_debut, date_fin):
    """Échéances de projets (jalon global) visibles selon le rôle"""
    qs = Projet.objects.filter(date_fin_prevue__range=[date_debut, date_fin])
    role = user.role

    if role == 'direction':
        return qs
    if role == 'chef_projet':
        return qs.filter(chef_projet=user)
    if role == 'consultant':
        return qs.filter(taches__consultant=user).distinct()
    if role == 'partenaire':
        return qs.filter(partenaires=user)
    if role == 'client':
        return qs.filter(client=user)
    return Projet.objects.none()


def peut_modifier_tache(user, tache):
    """Qui a le droit de déplacer une échéance (drag & drop) ?"""
    role = user.role
    if role == 'direction':
        return True
    if role == 'chef_projet':
        return tache.projet.chef_projet.filter(id=user.id).exists()
    if role == 'consultant':
        return tache.consultant_id == user.id
    return False  # partenaire et client : lecture seule


def _couleur(statut, date_fin_prevue):
    if statut == 'termine':
        return '#22c55e'      # vert
    if date_fin_prevue < timezone.now().date():
        return '#ef4444'      # rouge - en retard
    return '#3b82f6'          # bleu - en cours


class CalendarEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_debut = _parse_date_param(request.query_params.get('start'))
        date_fin = _parse_date_param(request.query_params.get('end'))

        if not date_debut or not date_fin:
            return Response(
                {'error': 'Paramètres start et end requis (format YYYY-MM-DD)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        events = []

        for tache in get_calendar_taches(user, date_debut, date_fin).select_related('projet', 'consultant'):
            events.append({
                'id': f'tache-{tache.id}',
                'type': 'tache',
                'titre': tache.titre,
                'debut': tache.date_debut,
                'fin': tache.date_fin_prevue,
                'statut': tache.statut,
                'projet': tache.projet.nom,
                'projetId': str(tache.projet_id),
                'assigneA': tache.consultant.nom if tache.consultant else None,
                'couleur': _couleur(tache.statut, tache.date_fin_prevue),
                'peutModifier': peut_modifier_tache(user, tache),
            })

        for projet in get_calendar_projets(user, date_debut, date_fin):
            events.append({
                'id': f'projet-{projet.id}',
                'type': 'projet',
                'titre': f" Fin prévue : {projet.nom}",
                'debut': projet.date_fin_prevue,
                'fin': projet.date_fin_prevue,
                'statut': projet.statut,
                'projet': projet.nom,
                'projetId': str(projet.id),
                'assigneA': None,
                'couleur': '#8b5cf6',  # violet - échéance projet
                'peutModifier': False,
            })

        return Response(events)

    def patch(self, request, event_id):
        if not event_id.startswith('tache-'):
            return Response(
                {'error': 'Seules les tâches sont modifiables depuis le calendrier.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tache_id = event_id[len('tache-'):]
        try:
            tache = Tache.objects.get(id=tache_id)
        except Tache.DoesNotExist:
            return Response({'error': 'Tâche non trouvée'}, status=status.HTTP_404_NOT_FOUND)

        if not peut_modifier_tache(request.user, tache):
            return Response(
                {'error': "Vous n'avez pas la permission de modifier cette échéance."},
                status=status.HTTP_403_FORBIDDEN
            )

        nouvelle_debut = _parse_date_param(request.data.get('debut'))
        nouvelle_fin = _parse_date_param(request.data.get('fin'))

        if nouvelle_debut:
            tache.date_debut = nouvelle_debut
        if nouvelle_fin:
            tache.date_fin_prevue = nouvelle_fin

        tache.save()

        return Response({
            'id': event_id,
            'debut': tache.date_debut,
            'fin': tache.date_fin_prevue,
        })