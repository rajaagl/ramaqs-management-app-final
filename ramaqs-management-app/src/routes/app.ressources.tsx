import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { 
  Users, Sparkles, Plus, Briefcase, TrendingUp, Search, Filter,
  Calendar, Clock, Award, Mail, Phone, MapPin, Star, 
  ChevronRight, Download, X, Loader2, UserPlus, Edit, Trash2,
  Eye, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import { useState } from "react";
import { useGetRessourcesQuery, useDeleteRessourceMutation } from "../store/api/api";
import { useAppSelector } from "../store/store";
import type { Ressource } from "../store/interfaces";
import { ProtectedRoute } from "#/components/ui/ProtectedRoute";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";

export const Route = createFileRoute("/app/ressources")({
  component: () => (
    <ProtectedRoute allowedRoles={['direction']}>
      <RessourcesPage />
    </ProtectedRoute>
  ),
});

// Couleurs pour les graphiques
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6'];

function RessourcesPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRessource, setSelectedRessource] = useState<Ressource | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { data, isLoading, error, refetch } = useGetRessourcesQuery({ page: 1, pageSize: 100 });
  const [deleteRessource] = useDeleteRessourceMutation();
  
  // Extraction des données
  const allRessources = Array.isArray(data) ? data : (data?.results || []);
  
  // Filtrage
  const ressources = allRessources.filter((r: Ressource) => {
    const matchSearch = searchTerm === "" || 
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchRole = roleFilter === "all" || r.role === roleFilter || r.type === roleFilter;
    
    return matchSearch && matchRole;
  });
  
  // Statistiques
  const totalConsultants = ressources.filter(r => r.type === 'consultant' || r.role === 'consultant').length;
  const totalPartenaires = ressources.filter(r => r.type === 'partenaire' || r.role === 'partenaire').length;
  const avgWorkload = ressources.length > 0 
    ? Math.round(ressources.reduce((s: number, r: Ressource) => s + (r.chargeTravail || 0), 0) / ressources.length)
    : 0;
  const overloaded = ressources.filter((r: Ressource) => (r.chargeTravail || 0) > 85).length;
  const disponible = ressources.filter((r: Ressource) => (r.chargeTravail || 0) < 50).length;
  
  // Distribution par compétence
  const allSkills = ressources.flatMap(r => r.skills || []);
  const skillCount = allSkills.reduce((acc: Record<string, number>, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {});
  const topSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));
  
  // Distribution par charge
  const workloadDistribution = [
    { name: 'Critique (>85%)', value: overloaded, color: '#ef4444' },
    { name: 'Élevé (70-85%)', value: ressources.filter((r: Ressource) => (r.chargeTravail || 0) >= 70 && (r.chargeTravail || 0) <= 85).length, color: '#f97316' },
    { name: 'Normal (50-70%)', value: ressources.filter((r: Ressource) => (r.chargeTravail || 0) >= 50 && (r.chargeTravail || 0) < 70).length, color: '#eab308' },
    { name: 'Disponible (<50%)', value: disponible, color: '#22c55e' },
  ];
  
  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette ressource ?")) {
      await deleteRessource(id).unwrap();
      refetch();
      setDeletingId(null);
    }
  };
  
  if (isLoading) {
    return (
      <AppShell title="Ressources" subtitle="Gestion des talents">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      </AppShell>
    );
  }
  
  if (error) {
    return (
      <AppShell title="Ressources" subtitle="Erreur">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-gray-600">Erreur lors du chargement des ressources</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-red-600 text-white rounded-lg">
            Réessayer
          </button>
        </div>
      </AppShell>
    );
  }
  
  return (
    <AppShell
      title="Ressources"
      subtitle="👑 Direction - Gestion des talents et compétences"
      actions={
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-all ${
              showFilters || roleFilter !== "all"
                ? 'bg-red-600 text-white border-red-600' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtres
            {roleFilter !== "all" && (
              <span className="h-5 w-5 rounded-full bg-white/20 text-white text-[10px] flex items-center justify-center">1</span>
            )}
          </button>
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Exporter
          </button>
          <Link
            to="/app/ressources/add"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium hover:shadow-lg transition-all"
          >
            <UserPlus className="h-4 w-4" /> Nouvelle ressource
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Panneau des filtres */}
        {showFilters && (
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Filtres avancés</h3>
              {roleFilter !== "all" && (
                <button onClick={() => setRoleFilter("all")} className="text-xs text-red-600 hover:underline">
                  Réinitialiser
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value="all">Tous les types</option>
                <option value="consultant">Consultants</option>
                <option value="chef_projet">Chefs de projet</option>
                <option value="partenaire">Partenaires</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Cartes KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-red-50">
                <Users className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{ressources.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total ressources</p>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-green-600">👥 {totalConsultants} consultants</span>
              <span className="text-blue-600">🤝 {totalPartenaires} partenaires</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-50">
                <Briefcase className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{avgWorkload}%</p>
            <p className="text-xs text-gray-500 mt-1">Charge moyenne</p>
            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${avgWorkload}%` }} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-red-50">
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{overloaded}</p>
            <p className="text-xs text-gray-500 mt-1">En surcharge</p>
            <p className="text-xs text-red-500 mt-0.5">&gt;85% de charge</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-50">
                <Sparkles className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{disponible}</p>
            <p className="text-xs text-gray-500 mt-1">Disponibles</p>
            <p className="text-xs text-green-500 mt-0.5">Prêts pour nouveaux projets</p>
          </div>
        </div>
        
        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Distribution par charge */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Distribution des charges</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={workloadDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {workloadDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Top compétences */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Top compétences</h3>
            <div className="h-64">
              {topSkills.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSkills} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Aucune compétence renseignée</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Liste des ressources */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-900">Annuaire des talents</h3>
              <p className="text-xs text-gray-500 mt-0.5">{ressources.length} ressources trouvées</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Ressource</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Rôle</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Compétences</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Charge</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ressources.map((r: Ressource) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedRessource(r)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm">
                          {r.initials || r.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{r.name}</div>
                          <div className="text-xs text-gray-400">{r.email || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.role === 'chef_projet' ? 'bg-blue-100 text-blue-700' :
                        r.role === 'consultant' ? 'bg-green-100 text-green-700' :
                        r.type === 'partenaire' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {r.role || r.type || "Consultant"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(r.skills || []).slice(0, 3).map((skill: string) => (
                          <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                            {skill}
                          </span>
                        ))}
                        {(r.skills?.length || 0) > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            +{(r.skills?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full w-24">
                          <div className={`h-full rounded-full ${
                            (r.chargeTravail || 0) > 85 ? 'bg-red-500' :
                            (r.chargeTravail || 0) > 70 ? 'bg-amber-500' : 'bg-green-500'
                          }`} style={{ width: `${r.chargeTravail || 0}%` }} />
                        </div>
                        <span className={`text-xs font-medium ${
                          (r.chargeTravail || 0) > 85 ? 'text-red-600' :
                          (r.chargeTravail || 0) > 70 ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {r.chargeTravail || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedRessource(r); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </button>
                        <Link
                          to={`/app/ressources/edit/${r.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-gray-100"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {ressources.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Aucune ressource trouvée</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Modal détails ressource */}
      {selectedRessource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-lg">
                  {selectedRessource.initials || selectedRessource.name?.charAt(0) || "?"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedRessource.name}</h2>
                  <p className="text-sm text-gray-500">{selectedRessource.role || selectedRessource.type || "Consultant"}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRessource(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm font-medium">{selectedRessource.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Téléphone</p>
                  <p className="text-sm font-medium">{selectedRessource.telephone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Taux horaire</p>
                  <p className="text-sm font-medium">{selectedRessource.hourlyRate || selectedRessource.cout_horaire || 0}€/h</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Disponibilité</p>
                  <p className="text-sm font-medium">{selectedRessource.disponible ? "Disponible" : "Non disponible"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-400 mb-2">Compétences</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedRessource.skills || []).map((skill: string) => (
                    <span key={skill} className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-400 mb-2">Charge de travail</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full">
                    <div className={`h-full rounded-full ${
                      (selectedRessource.chargeTravail || 0) > 85 ? 'bg-red-500' :
                      (selectedRessource.chargeTravail || 0) > 70 ? 'bg-amber-500' : 'bg-green-500'
                    }`} style={{ width: `${selectedRessource.chargeTravail || 0}%` }} />
                  </div>
                  <span className="text-sm font-bold">{selectedRessource.chargeTravail || 0}%</span>
                </div>
              </div>
              
              {selectedRessource.projetsAssignes && selectedRessource.projetsAssignes.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Projets assignés</p>
                  <div className="space-y-1">
                    {selectedRessource.projetsAssignes.map((projetId: string) => (
                      <div key={projetId} className="text-sm text-gray-600">• Projet #{projetId.slice(0, 8)}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// Import manquant
import { AlertCircle } from "lucide-react";