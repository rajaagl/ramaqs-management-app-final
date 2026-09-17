from rest_framework.permissions import BasePermission, SAFE_METHODS


def is_direction(user):
    return bool(
        user
        and user.is_authenticated
        and user.is_active
        and getattr(user, 'statut_approbation', 'approved') == 'approved'
        and not getattr(user, 'doit_changer_mot_de_passe', False)
        and (user.is_superuser or user.role in {'super_admin', 'direction'})
    )


def has_application_access(user):
    """A JWT alone is insufficient: the account must remain eligible."""
    return bool(
        user
        and user.is_authenticated
        and user.is_active
        and getattr(user, 'statut_approbation', 'approved') == 'approved'
        and not getattr(user, 'doit_changer_mot_de_passe', False)
    )


class IsEligibleUser(BasePermission):
    """Blocks normal API access until an account is approved and its password is changed."""

    def has_permission(self, request, view):
        return has_application_access(request.user)


class IsDirectionUser(BasePermission):
    """Accès réservé à la direction et aux super-administrateurs."""

    def has_permission(self, request, view):
        return is_direction(request.user)


class IsProjectMemberReadOnly(BasePermission):
    """Lecture pour les membres d'un projet ; écriture à la direction."""

    def has_permission(self, request, view):
        return has_application_access(request.user)

    def has_object_permission(self, request, view, obj):
        if is_direction(request.user):
            return True
        if request.method not in SAFE_METHODS:
            return False
        return (
            obj.client_id == request.user.id
            or obj.chef_projet.filter(id=request.user.id).exists()
            or obj.partenaires.filter(id=request.user.id).exists()
            or obj.taches.filter(consultant_id=request.user.id).exists()
        )


class IsTaskMember(BasePermission):
    """Direction/chef du projet gèrent la tâche ; consultant limité à la sienne."""

    def has_permission(self, request, view):
        return has_application_access(request.user)

    def has_object_permission(self, request, view, obj):
        if is_direction(request.user):
            return True
        if obj.projet.chef_projet.filter(id=request.user.id).exists():
            return True
        return request.method in SAFE_METHODS or obj.consultant_id == request.user.id
