# ramaqs_management_plateforme/middleware.py

from django.utils.deprecation import MiddlewareMixin
from .models import Tenant
import uuid


class TenantMiddleware:
    """
    Middleware tenant — mode mono-tenant RAMAQS.
    Priorité : header X-Tenant-ID → user.memberships → premier tenant actif en base.
    Ne bloque jamais une requête à cause du tenant.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.tenant = self._resolve_tenant(request)
        response = self.get_response(request)
        return response

    def _resolve_tenant(self, request):
        # 1. Header explicite
        tenant_id = request.headers.get('X-Tenant-ID')
        if tenant_id:
            try:
                tenant_uuid = uuid.UUID(tenant_id)
                tenant = Tenant.objects.filter(id=tenant_uuid, actif=True).first()
                if tenant:
                    return tenant
            except (ValueError, TypeError):
                tenant = Tenant.objects.filter(slug=tenant_id, actif=True).first()
                if tenant:
                    return tenant

        # 2. Membership de l'utilisateur connecté
        if hasattr(request, 'user') and request.user.is_authenticated:
            membership = request.user.memberships.first()
            if membership and membership.tenant:
                return membership.tenant

        # 3. Fallback mono-tenant — prend le seul tenant existant en base
        return Tenant.objects.filter(actif=True).first()