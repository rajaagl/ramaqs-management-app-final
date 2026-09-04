// ============================================
// GESTION DU MULTI-TENANT
// ============================================

const TENANT_KEY = 'current_tenant';

// Récupérer le tenant actif
export const getCurrentTenant = (): string | null => {
  return localStorage.getItem(TENANT_KEY);
};

// Définir le tenant actif
export const setCurrentTenant = (tenantId: string): void => {
  localStorage.setItem(TENANT_KEY, tenantId);
};

// Supprimer le tenant (déconnexion)
export const removeCurrentTenant = (): void => {
  localStorage.removeItem(TENANT_KEY);
};

// Récupérer le tenant depuis l'URL (sous-domaine)
// Exemple: acme.monapp.com → "acme"
export const getTenantFromURL = (): string | null => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // Si c'est un sous-domaine (ex: tenant1.votreapp.com)
  if (parts.length > 2) {
    return parts[0];
  }
  
  return null;
};

// Récupérer le tenant depuis le chemin de l'URL
// Exemple: monapp.com/acme/ → "acme"
export const getTenantFromPath = (): string | null => {
  const pathname = window.location.pathname;
  const parts = pathname.split('/').filter(p => p);
  
  if (parts.length > 0) {
    return parts[0];
  }
  
  return null;
};

// Initialiser le tenant au chargement de l'application
export const initTenant = (): string | null => {
  // Priorité 1: Tenant depuis l'URL (sous-domaine)
  let tenant = getTenantFromURL();
  
  // Priorité 2: Tenant depuis le chemin
  if (!tenant) {
    tenant = getTenantFromPath();
  }
  
  // Priorité 3: Tenant déjà stocké
  if (!tenant) {
    tenant = getCurrentTenant();
  }
  
  // Sauvegarder le tenant trouvé
  if (tenant) {
    setCurrentTenant(tenant);
  }
  
  return tenant;
};

// Vérifier si un tenant est actif
export const hasTenant = (): boolean => {
  return !!getCurrentTenant();
};

// Changer de tenant (pour admin multi-entreprises)
export const switchTenant = (tenantId: string): void => {
  setCurrentTenant(tenantId);
  // Recharger la page pour appliquer le nouveau tenant
  window.location.reload();
};