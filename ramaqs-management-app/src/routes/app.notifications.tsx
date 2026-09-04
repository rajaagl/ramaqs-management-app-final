import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { 
  Bell, CheckCheck, Trash2, Sparkles, Filter, X, 
  Search, Calendar, Eye, EyeOff, Info, AlertCircle,
  CheckCircle, AlertTriangle, Loader2, ChevronDown,
  Clock, Tag, User, Briefcase
} from "lucide-react";
import { useState, useEffect } from "react";
import { 
  useGetNotificationsQuery, 
  useMarkNotificationAsReadMutation, 
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation
} from "../store/api/api";
import { useAppSelector } from "../store/store";
import type { Notification } from '../store/interfaces';
import { ProtectedRoute } from "#/components/ui/ProtectedRoute";

export const Route = createFileRoute("/app/notifications")({
  component: () => (
    <ProtectedRoute allowedRoles={['direction', 'super_admin', 'chef_projet', 'partenaire', 'consultant', 'client']}>
      <NotificationsPage />
    </ProtectedRoute>
  ),
});

function NotificationsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<string | null>(null);
  
  const { data, isLoading, error, refetch } = useGetNotificationsQuery({ page, pageSize: 15 });
  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  
  const notifications = Array.isArray(data) ? data : (data?.results || []);
  const totalCount = Array.isArray(data) ? data.length : (data?.count || 0);
  
  // Filtrer les notifications
  const filteredNotifications = notifications.filter((notif: Notification) => {
    // Filtre par recherche
    const matchSearch = searchTerm === "" || 
      notif.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre par type
    const matchType = typeFilter === "all" || notif.type === typeFilter;
    
    // Filtre par statut de lecture
    const matchRead = readFilter === "all" || 
      (readFilter === "read" && notif.lu) ||
      (readFilter === "unread" && !notif.lu);
    
    // Filtre par date
    let matchDate = true;
    if (dateFilter !== "all") {
      const notifDate = new Date(String(notif.dateEnvoi));
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - notifDate.getTime()) / (1000 * 3600 * 24));
      
      if (dateFilter === "today") matchDate = diffDays === 0;
      else if (dateFilter === "week") matchDate = diffDays <= 7;
      else if (dateFilter === "month") matchDate = diffDays <= 30;
    }
    
    return matchSearch && matchType && matchRead && matchDate;
  });
  
  const unreadCount = notifications.filter((n: Notification) => !n.lu).length;
  const filteredCount = filteredNotifications.length;
  
  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id).unwrap();
    refetch();
  };
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead().unwrap();
    refetch();
  };
  
  const handleDelete = async (id: string) => {
    await deleteNotification(id).unwrap();
    setSelectedNotif(null);
    refetch();
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "succes":
        return <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle className="h-5 w-5" /></div>;
      case "attention":
        return <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><AlertTriangle className="h-5 w-5" /></div>;
      case "erreur":
        return <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><AlertCircle className="h-5 w-5" /></div>;
      default:
        return <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Info className="h-5 w-5" /></div>;
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "succes": return "Succès";
      case "attention": return "Attention";
      case "erreur": return "Erreur";
      default: return "Information";
    }
  };
  
  const getDateLabel = (date: string) => {
    const notifDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - notifDate.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return notifDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };
  
  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setDateFilter("all");
    setReadFilter("all");
  };
  
  const hasActiveFilters = searchTerm !== "" || typeFilter !== "all" || dateFilter !== "all" || readFilter !== "all";
  
  if (isLoading && page === 1) {
    return (
      <AppShell title="Notifications" subtitle="Centre de notifications">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      </AppShell>
    );
  }
  
  return (
    <AppShell
      title="Notifications"
      subtitle={`${unreadCount} non lue${unreadCount > 1 ? 's' : ''} · ${totalCount} au total`}
      actions={
        <div className="flex items-center gap-2">
          {/* Recherche */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm w-48 outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
          
          {/* Bouton filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-red-600 text-white border-red-600' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <span className="h-5 w-5 rounded-full bg-white/20 text-white text-[10px] flex items-center justify-center">
                {[typeFilter !== "all", dateFilter !== "all", readFilter !== "all", searchTerm !== ""].filter(Boolean).length}
              </span>
            )}
          </button>
          
          {/* Marquer tout comme lu */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition"
            >
              <CheckCheck className="h-4 w-4" />
              Tout marquer
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Panneau des filtres avancés */}
        {showFilters && (
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="h-4 w-4 text-red-600" />
                Filtres avancés
              </h3>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="text-xs text-red-600 hover:underline">
                  Réinitialiser tous les filtres
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtre par type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  <option value="all">Tous les types</option>
                  <option value="info"> Information</option>
                  <option value="succes"> Succès</option>
                  <option value="attention"> Attention</option>
                  <option value="erreur"> Erreur</option>
                </select>
              </div>
              
              {/* Filtre par date */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Période
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  <option value="all">Toutes les dates</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                </select>
              </div>
              
              {/* Filtre par statut de lecture */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Statut
                </label>
                <select
                  value={readFilter}
                  onChange={(e) => setReadFilter(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  <option value="all">Tous</option>
                  <option value="unread">Non lues</option>
                  <option value="read">Lues</option>
                </select>
              </div>
              
              {/* Indicateur de résultats */}
              <div className="flex items-center justify-end">
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">{filteredCount}</p>
                  <p className="text-xs text-gray-500">notification{filteredCount > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Liste des notifications */}
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-100">
            <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-10 w-10 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune notification</h3>
            <p className="text-gray-500 text-sm">
              {hasActiveFilters 
                ? "Aucune notification ne correspond à vos filtres" 
                : "Vous n'avez pas encore de notifications"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif: Notification) => (
              <div
                key={notif.id}
                className={`group rounded-xl border transition-all hover:shadow-md cursor-pointer ${
                  !notif.lu 
                    ? "bg-gradient-to-r from-red-50/50 to-white border-red-200" 
                    : "bg-white border-gray-100"
                }`}
                onClick={() => !notif.lu && handleMarkAsRead(notif.id)}
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Icône */}
                  {getNotificationIcon(notif.type)}
                  
                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-semibold ${!notif.lu ? "text-gray-900" : "text-gray-600"}`}>
                            {notif.titre}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            notif.type === 'succes' ? 'bg-green-100 text-green-700' :
                            notif.type === 'attention' ? 'bg-amber-100 text-amber-700' :
                            notif.type === 'erreur' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {getTypeLabel(notif.type)}
                          </span>
                          {!notif.lu && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">
                              ● Nouveau
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                        
                        {/* Métadonnées */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{getDateLabel(String(notif.dateEnvoi))}</span>
                          </div>
                          {notif.entite_type && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              <span className="capitalize">{notif.entite_type}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{user?.nom || "Utilisateur"}</span>
                          </div>
                        </div>
                        
                        {/* Lien d'action */}
                        {notif.lienAction && (
                          <a
                            href={notif.lienAction}
                            className="text-xs text-red-600 hover:text-red-700 mt-2 inline-flex items-center gap-1 font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Voir le détail <ChevronDown className="h-3 w-3 -rotate-90" />
                          </a>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        {!notif.lu && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notif.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100"
                            title="Marquer comme lu"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notif.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ← Précédent
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Page {page} sur {Math.ceil(totalCount / 15)}
              </span>
              <div className="h-1 w-12 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${(page / Math.ceil(totalCount / 15)) * 100}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 15 >= totalCount}
              className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}