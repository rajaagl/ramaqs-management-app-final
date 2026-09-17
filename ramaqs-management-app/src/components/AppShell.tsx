// src/components/AppShell.tsx

import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, FolderKanban, ListChecks, Users,
  FileText, Bell, User, LogOut, Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store/store";
import { useGetNotificationsQuery, useLogoutMutation } from "../store/api/api";
import { logout } from "../store/slices/authSlice";
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

// ─── Types ────────────────────────────────────────────────────────────────────
type UserRole = 'direction' | 'chef_projet' | 'consultant' | 'client' | 'partenaire';

// ─── Permissions par rôle ────────────────────────────────────────────────────
const permissions: Record<UserRole, Record<string, boolean>> = {
  direction: {
    canViewClients: true, canViewRessources: true, canViewProjets: true,
    canViewTaches: true, canViewDashboard: true, canViewCalendrier: true,
  },
  chef_projet: {
    canViewRisques: true, canViewRessources: true, canViewProjets: true,
    canViewTaches: true, canViewDashboard: true, canViewCalendrier: true,
  },
  consultant: {
    canViewTaches: true, canViewCalendrier: true,
  },
  client: {
    canViewClientSpace: true, canViewCalendrier: true,
  },
  partenaire: {
    canViewDashboard: true, canViewProjets: true, canViewCalendrier: true,
  },
};

// ─── Menus ───────────────────────────────────────────────────────────────────
const allMenus = [
  { to: "/app",               label: "Tableau de bord", short: "Accueil",  icon: LayoutDashboard, permission: "canViewDashboard" },
  { to: "/app/projets",       label: "Projets",         short: "Projets",  icon: FolderKanban,    permission: "canViewProjets" },
  { to: "/app/taches",        label: "Tâches",          short: "Tâches",   icon: ListChecks,      permission: "canViewTaches" },
  { to: "/app/documents",     label: "Documents",       short: "Docs",     icon: FileText,        permission: null },
  { to: "/app/users",         label: "Utilisateurs",    short: "Users",    icon: Users,           permission: "canViewClients" },
  { to: "/app/notifications", label: "Notifications",   short: "Notifs",   icon: Bell,            permission: null },
  { to: "/app/profil",        label: "Profil",          short: "Profil",   icon: User,            permission: null },
];

const roleBadges: Record<UserRole, { color: string; label: string }> = {
  direction:   { color: "bg-red-100 text-red-700",    label: "Direction" },
  chef_projet: { color: "bg-blue-100 text-blue-700",  label: "Chef de projet" },
  consultant:  { color: "bg-green-100 text-green-700",label: "Consultant" },
  client:      { color: "bg-gray-100 text-gray-700",  label: "Client" },
  partenaire:  { color: "bg-indigo-100 text-indigo-700", label: "Partenaire" },
};

const getMenusByRole = (role: UserRole | undefined) => {
  if (!role || !permissions[role]) {
    return allMenus.filter(m =>
      m.to === "/app" || m.to === "/app/profil" || m.to === "/app/notifications"
    );
  }
  const rolePerms = permissions[role];
  return allMenus.filter(m => !m.permission || rolePerms[m.permission] === true);
};

// ─── AppShell ─────────────────────────────────────────────────────────────────
export function AppShell({
  children, title, subtitle, actions, hideSearch = true,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  hideSearch?: boolean;
}) {
  useRealtimeNotifications();

  const location  = useLocation();
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const path      = location.pathname;

  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [logoutUser] = useLogoutMutation();
  const userRole = user?.role as UserRole;

  useEffect(() => {
    if (!isAuthenticated || !user) navigate({ to: "/login" });
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user) return null;

  const nav        = getMenusByRole(userRole);
  const roleBadge  = userRole ? roleBadges[userRole] : { color: "bg-gray-100 text-gray-700", label: "Invité" };

  const { data: notificationsData } = useGetNotificationsQuery(
    { page: 1 },
    { pollingInterval: 30_000 },
  );
  const unreadCount = notificationsData?.results?.filter((n: any) => !n.lu).length || 0;

  const userInitials = user?.nom
    ? user.nom.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = async () => {
    try {
      await logoutUser(localStorage.getItem('refresh_token')).unwrap();
    } finally {
      dispatch(logout());
      navigate({ to: "/login" });
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* ── Sidebar desktop ───────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 flex-col bg-gradient-to-b from-red-700 to-red-900 shadow-xl flex-shrink-0">

        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow">
            <span className="text-red-700 font-black text-sm tracking-tight">R</span>
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-none">RAMAQS</div>
            <div className="text-[10px] text-red-300 tracking-widest uppercase mt-0.5">Consulting OS</div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5" aria-label="Navigation principale">
          {nav.map((item) => {
            const active = item.to === "/app" ? path === "/app" : path.startsWith(item.to);
            const Icon   = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-800
                  ${active
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-red-200 hover:bg-white/8 hover:text-white"
                  }
                `}
              >
                {/* Indicateur actif */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
                )}

                <div className={`
                  w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                  ${active ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"}
                `}>
                  <Icon className="h-4 w-4" />
                </div>

                <span className="flex-1 leading-none">{item.label}</span>

                {item.to === "/app/notifications" && unreadCount > 0 && (
                  <span className="
                    text-[10px] font-bold bg-white text-red-700
                    rounded-full min-w-[18px] h-[18px]
                    flex items-center justify-center px-1 flex-shrink-0
                  ">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/8 transition-colors">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-none">{user?.nom || 'Utilisateur'}</p>
              <p className="text-[11px] text-red-300 mt-0.5 truncate">{roleBadge.label}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-red-300 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Se déconnecter"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contenu principal ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-14 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
          <div className="h-full flex items-center gap-4 px-4 lg:px-6">

            {/* Logo mobile */}
            <div className="lg:hidden h-8 w-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow">
              <span className="text-white font-black text-xs">R</span>
            </div>

            {/* Recherche */}
            {!hideSearch && (
              <div className="flex-1 max-w-sm hidden md:block">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    aria-label="Rechercher dans l'application"
                    placeholder="Rechercher…"
                    className="w-full h-8 rounded-lg bg-gray-50 border border-gray-200 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
                  />
                </div>
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              {/* Cloche notifications */}
              <Link
                to="/app/notifications"
                className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center relative transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Avatar mobile */}
              <Link
                to="/app/profil"
                className="lg:hidden h-8 w-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-xs shadow"
              >
                {userInitials}
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 lg:px-6 py-5 lg:py-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
          </div>
          {children}
        </main>

        {/* ── Navigation mobile ─────────────────────────────────────────── */}
        <nav className="lg:hidden sticky bottom-0 z-20 bg-gradient-to-r from-red-700 to-red-900 border-t border-white/10 shadow-lg">
          <div className="flex">
            {nav.slice(0, 5).map((item) => {
              const active = item.to === "/app" ? path === "/app" : path.startsWith(item.to);
              const Icon   = item.icon;
              const hasNotif = item.to === "/app/notifications" && unreadCount > 0;

              return (
                <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-1
                  py-2.5 px-1 relative transition-all duration-150 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset
                    ${active ? "text-white" : "text-red-300 hover:text-white"}
                  `}
                >
                  {/* Barre active en haut */}
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-white rounded-b-full" />
                  )}

                  {/* Icône avec badge */}
                  <div className={`
                    relative w-8 h-7 flex items-center justify-center rounded-lg transition-colors
                    ${active ? "bg-white/20" : ""}
                  `}>
                    <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                    {hasNotif && (
                      <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-white text-red-700 text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Label complet */}
                  <span className={`
                    text-[10px] font-medium leading-none text-center w-full px-0.5 truncate
                    ${active ? "text-white" : "text-red-300"}
                  `}>
                    {item.short}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

      </div>
    </div>
  );
}
