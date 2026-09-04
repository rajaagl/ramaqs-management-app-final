// src/components/ui/ProtectedRoute.tsx

import { Navigate, Link } from "@tanstack/react-router"; // ✅ FIX : import remonté en haut
import { useAppSelector } from "../../store/store";
import { Shield, AlertTriangle, Home, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

// Types des rôles possibles dans l'application
type UserRole = 'super_admin' | 'direction' | 'chef_projet' | 'consultant' | 'client' | 'partenaire';

// Props que le composant reçoit
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  requirePermission?: string;
  showNotification?: boolean;
}

// Mapping des rôles vers des labels lisibles
const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Administrateur',
  direction: 'Direction',
  chef_projet: 'Chef de projet',
  consultant: 'Consultant',
  client: 'Client',
  partenaire: 'Partenaire'
};

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = "/login",
  requirePermission,
  showNotification = true
}: ProtectedRouteProps) {
  
  const { user, isAuthenticated, accessToken } = useAppSelector((state) => state.auth);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState("");

  useEffect(() => {
    if (showAccessDenied) {
      const timer = setTimeout(() => setShowAccessDenied(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAccessDenied]);

  // ✅ FIX PRINCIPAL : comparaison EXACTE des rôles au lieu de la hiérarchie.
  //
  // Ancien comportement (BUG) :
  //   consultant (40) >= partenaire (30) → consultant pouvait accéder à une
  //   route qui n'autorise que ['direction','chef_projet','partenaire'].
  //
  // Nouveau comportement (CORRECT) :
  //   On vérifie que le rôle de l'utilisateur est EXACTEMENT dans allowedRoles.
  //   Exception : super_admin a toujours accès à tout.
  const hasRequiredRole = (): boolean => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (!user?.role) return false;

    const userRole = user.role as UserRole;

    // super_admin bypasse toutes les restrictions
    if (userRole === 'super_admin') return true;

    // Vérification exacte : le rôle doit être explicitement dans la liste
    return allowedRoles.includes(userRole);
  };

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const isOnUnauthorizedPage = currentPath === "/unauthorized";

  // ── 1. Utilisateur non authentifié → /login ──────────────────────────────
  if (!isAuthenticated || !accessToken || !user) {
    console.log("🔒 Accès refusé : utilisateur non authentifié");
    return <Navigate to={redirectTo} />;
  }

  // ── 2. Permission spécifique manquante → /unauthorized ───────────────────
  if (requirePermission) {
    const userPermissions = (user as any).permissions || [];
    if (!userPermissions.includes(requirePermission)) {
      if (showNotification && !isOnUnauthorizedPage) {
        setAccessDeniedMessage(`Permission "${requirePermission}" requise`);
        setShowAccessDenied(true);
      }
      return <Navigate to="/unauthorized" />;
    }
  }

  // ── 3. Rôle non autorisé → /unauthorized ─────────────────────────────────
  if (!hasRequiredRole()) {
    if (showNotification && !isOnUnauthorizedPage) {
      const requiredRolesLabels = allowedRoles?.map(r => roleLabels[r]).join(", ") || "un rôle spécifique";
      setAccessDeniedMessage(
        `Accès réservé à : ${requiredRolesLabels}. Votre rôle : ${roleLabels[user.role as UserRole] || user.role}`
      );
      setShowAccessDenied(true);
    }
    return <Navigate to="/unauthorized" />;
  }

  // ── Accès autorisé ────────────────────────────────────────────────────────
  return (
    <>
      {showAccessDenied && (
        <div className="fixed top-24 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="rounded-xl bg-red-50 border-l-4 border-red-500 shadow-2xl p-4 max-w-md">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-800">Accès refusé</p>
                <p className="text-sm text-red-600 mt-0.5">{accessDeniedMessage}</p>
              </div>
              <button 
                onClick={() => setShowAccessDenied(false)}
                className="text-red-400 hover:text-red-600 transition"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page "Accès non autorisé" (403)
// ─────────────────────────────────────────────────────────────────────────────
export function UnauthorizedAccessPage() {
  const { user } = useAppSelector((state) => state.auth);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50 p-4">
      <div className="text-center max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-red-100 p-8 animate-in fade-in zoom-in duration-300">
        <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Accès non autorisé</h1>
        
        <div className="h-1 w-20 bg-red-500 mx-auto my-4 rounded-full" />
        
        <p className="text-gray-600 mb-4">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        
        {user?.role && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6 inline-block">
            <p className="text-sm text-gray-500">
              Votre rôle actuel :
              <span className="font-semibold text-gray-700 ml-1">
                {roleLabels[user.role as UserRole] || user.role}
              </span>
            </p>
          </div>
        )}
        
        <div className="flex gap-3 justify-center">
          <Link 
            to="/app" 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-md"
          >
            <Home className="h-4 w-4" />
            Tableau de bord
          </Link>
          
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <code className="text-xs text-gray-400">Erreur 403 — Forbidden</code>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook : vérifier si l'utilisateur courant a la permission
// ─────────────────────────────────────────────────────────────────────────────
export function useHasPermission(allowedRoles?: UserRole[]): boolean {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  if (!isAuthenticated || !user?.role) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;

  const userRole = user.role as UserRole;
  if (userRole === 'super_admin') return true;

  return allowedRoles.includes(userRole);
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant : masquer/afficher des éléments UI selon le rôle
// ─────────────────────────────────────────────────────────────────────────────
export function RoleBased({ 
  children, 
  allowedRoles,
  fallback = null
}: { 
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}) {
  const hasPermission = useHasPermission(allowedRoles);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant : badge de rôle stylisé
// ─────────────────────────────────────────────────────────────────────────────
export function RoleBadge({ role }: { role: UserRole }) {
  const colors: Record<UserRole, string> = {
    super_admin: "bg-purple-100 text-purple-700 border-purple-200",
    direction:   "bg-blue-100 text-blue-700 border-blue-200",
    chef_projet: "bg-green-100 text-green-700 border-green-200",
    consultant:  "bg-yellow-100 text-yellow-700 border-yellow-200",
    client:      "bg-gray-100 text-gray-700 border-gray-200",
    partenaire:  "bg-indigo-100 text-indigo-700 border-indigo-200"
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors[role]}`}>
      <Shield className="h-3 w-3" />
      {roleLabels[role]}
    </span>
  );
}