// src/routes/app.tsx

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAppSelector } from "../store/store";

export const Route = createFileRoute("/app")({
  component: AppLayout,
  // ✅ Protection avant le chargement de la route
  beforeLoad: ({ location }) => {
    // Vérifier le token dans localStorage
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    
    // Si pas de token ou pas d'utilisateur, rediriger vers login
    if (!token || !userStr) {
      throw redirect({
        to: "/login",
        search: { redirect: location.pathname },
      });
    }
  },
});

function AppLayout() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  // ✅ Vérification supplémentaire dans le composant
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
}