
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { 
  Plus, Filter, LayoutGrid, List as ListIcon, Search, 
  Edit, Trash2, Eye, Calendar, Users, DollarSign, 
  CheckCircle, Clock, AlertCircle, X, Loader2, FileSpreadsheet, 
  Briefcase,
  User
, 
  FileText, RefreshCw,  PauseCircle, AlertTriangle 

} from "lucide-react";
import { useState, useMemo } from "react";
import { useGetProjetsQuery, useDeleteProjetMutation, useGetChefsProjetQuery } from '../store/api/api';
import { useAppSelector } from '../store/store';
import type { Projet } from '../store/interfaces';
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { AddProjectForm } from "../components/Projects/AddProjectForm";
import { EditProjectModal } from "../components/Projects/EditProjectModal";
import { DeleteProjectModal } from "../components/projects/DeleteProjectModal";
import { ImportExcelModal } from "../components/Projects/ImportExcelModal";
import { EquipeProjetModal } from "../components/Projects/EquipeProjetModal";


type ViewMode = "grid" | "list";

export const Route = createFileRoute("/app/projets")({
  component: () => (
    <ProtectedRoute allowedRoles={['direction', 'chef_projet', 'partenaire']}>
      <ProjetsPage />
    </ProtectedRoute>
  ),
});

// ✅ Helpers — Django (DRF) sérialise les DecimalField en string ("150000.00").
// On force systématiquement la conversion en nombre avant tout calcul/affichage,
// sinon `reduce` fait de la concaténation de texte au lieu d'une addition.
function toNumber(value: any): number {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

function formatDH(value: any): string {
  return `${toNumber(value).toLocaleString("fr-FR")} DH`;
}

// ✅ Gère le cas où chef_projet est un tableau (plusieurs chefs possibles)
// OU un id unique (chefProjetId), selon ce que renvoie le backend.
function getChefIds(project: any): string[] {
  if (Array.isArray(project.chef_projet)) {
    return project.chef_projet.map((c: any) => (typeof c === "object" ? c.id : c));
  }
  if (Array.isArray(project.chefProjetIds)) {
    return project.chefProjetIds;
  }
  if (project.chefProjetId) {
    return [project.chefProjetId];
  }
  return [];
}

function ProjetsPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const userRole = user?.role;
  // ✅ Récupérer les chefs de projet
  const { data: chefsData, isLoading: chefsLoading, error: chefsError } = useGetChefsProjetQuery({ 
    page: 1, 
    pageSize: 100 
  });
   // ✅ Extraire les chefs
  const chefsProjet = useMemo(() => {
    if (!chefsData) return [];
    return Array.isArray(chefsData) ? chefsData : (chefsData.results || []);
  }, [chefsData]);

  const [view, setView] = useState<ViewMode>("grid");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Projet | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [deletingProjectName, setDeletingProjectName] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [chefFilter, setChefFilter] = useState("");
  const [domaineFilter, setDomaineFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const { data, isLoading, error, refetch } = useGetProjetsQuery({ page: 1, pageSize: 100 });
  const [deleteProjet] = useDeleteProjetMutation();
  const [equipeProjet, setEquipeProjet] = useState<{ id: string; nom: string } | null>(null);
  
 // ✅ Code corrigé - L'API retourne un tableau direct
  const allProjects = Array.isArray(data) ? data : (data?.results || []);
  
  const filteredProjects = allProjects.filter((project: any) => {
    const chefIds = getChefIds(project);

    // Filtre par rôle — défensif : compare sur le tableau de chefs, pas un seul id
    // if (userRole === 'chef_projet') {
     // if (!chefIds.includes(user?.id)) return false;
   // }

    // Filtre par recherche — on couvre les variantes possibles de noms de champs
    const haystack = [
      project.name, project.nom, project.client, project.clientNom, project.code,
    ].filter(Boolean).join(" ").toLowerCase();
    const matchSearch = searchTerm === "" || haystack.includes(searchTerm.toLowerCase());

    // Filtre par statut
    const matchStatus = !statusFilter || project.statut === statusFilter;

    // ✅ FIX : comparaison sur le tableau de chefs (gère id unique ET multi-chefs)
    const matchChef = !chefFilter || chefIds.includes(chefFilter);

    // ✅ FIX : le champ s'appelle "domaine" (pas "domain")
    const matchDomaine = !domaineFilter || project.domaine === domaineFilter;

    // ✅ FIX : le filtre date était déclaré mais jamais appliqué.
    // On affiche les projets dont la date de début est >= à la date choisie.
    const projectStartDate = project.dateDebut || project.date_debut;
    const matchDate = !dateFilter || (projectStartDate && projectStartDate >= dateFilter);

    return matchSearch && matchStatus && matchChef && matchDomaine && matchDate;
  });
  
  // ✅ Statistiques — toutes les valeurs monétaires passent par toNumber()
  const stats = {
    total: filteredProjects.length,
    en_cours: filteredProjects.filter(p => p.statut === 'en_cours').length,
    planifie: filteredProjects.filter(p => p.statut === 'planifie').length,
    termine: filteredProjects.filter(p => p.statut === 'termine').length,
    budget_total: filteredProjects.reduce((sum, p) => sum + toNumber(p.Budget ?? p.budget), 0),
    avancement_moyen: Math.round(filteredProjects.reduce((sum, p) => sum + toNumber(p.progress), 0) / (filteredProjects.length || 1)),
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteProjet(id).unwrap();
      setSuccessMessage("Projet supprimé avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
      refetch();
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingProjectId(null);
    }
  };
  
  const getStatusColor = (statut: string) => {
    const colors: Record<string, string> = {
      en_cours: 'bg-amber-100 text-amber-700 border-amber-200',
      planifie: 'bg-blue-100 text-blue-700 border-blue-200',
      termine: 'bg-green-100 text-green-700 border-green-200',
      en_pause: 'bg-gray-100 text-gray-700 border-gray-200',
      a_risque: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[statut] || 'bg-gray-100 text-gray-700';
  };
  
  const getStatusLabel = (statut: string) => {
    const labels: Record<string, string> = {
      en_cours: 'En cours',
      planifie: 'Planifié',
      termine: 'Terminé',
      en_pause: 'En pause',
      a_risque: 'À risque',
    };
    return labels[statut] || statut;
  };
  
  const getHealthColor = (health: string) => {
    const colors: Record<string, string> = {
      sain: 'text-green-600 bg-green-50',
      vigilant: 'text-amber-600 bg-amber-50',
      critique: 'text-red-600 bg-red-50',
    };
    return colors[health] || 'text-gray-600 bg-gray-50';
  };
  
  if (isLoading) {
    return (
      <AppShell title="Projets" subtitle="Chargement...">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      </AppShell>
    );
  }
  
  if (error) {
    return (
      <AppShell title="Projets" subtitle="Erreur">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-gray-600">Erreur lors du chargement des projets</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-red-600 text-white rounded-lg">
            Réessayer
          </button>
        </div>
      </AppShell>
    );
  }
  
  return (
    <>
      <AppShell
        title="Projets"
        subtitle={`${stats.total} projets · ${stats.avancement_moyen}% d'avancement moyen`}
        actions={
          <div className="flex items-center gap-2">
            {successMessage && (
              <div className="absolute top-20 right-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {successMessage}
                </div>
              </div>
            )}
            
            {/* Recherche */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm w-48 outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>
            
            {/* Vue grid/list */}
            <div className="hidden sm:flex rounded-lg border border-gray-200 bg-white p-0.5">
              <button onClick={() => setView("grid")} className={`h-8 w-8 grid place-items-center rounded ${view === "grid" ? "bg-red-50 text-red-600" : "text-gray-400"}`}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => setView("list")} className={`h-8 w-8 grid place-items-center rounded ${view === "list" ? "bg-red-50 text-red-600" : "text-gray-400"}`}>
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
            
            {/* Filtres */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-all ${
                showFilters ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtres
              {(statusFilter || chefFilter || domaineFilter || dateFilter) && (
                <span className="h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                  {[statusFilter, chefFilter, domaineFilter, dateFilter].filter(Boolean).length}
                </span>
              )}
            </button>
            
            {/* Nouveau projet */}
            {(userRole === 'direction') && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold hover:shadow-lg transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" /> Nouveau projet
              </button>
            )}
            {userRole === 'direction' && (
  <button
    onClick={() => setShowImportModal(true)}
    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold hover:shadow-lg transition-all active:scale-95"
  >
    <FileSpreadsheet className="h-4 w-4" /> Importer Excel
  </button>
)}
          </div>
        }
      >
        <div className="space-y-4">
          {/* Statistiques */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total projets</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <p className="text-2xl font-bold text-amber-600">{stats.en_cours}</p>
              <p className="text-xs text-gray-500">En cours</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <p className="text-2xl font-bold text-blue-600">{stats.planifie}</p>
              <p className="text-xs text-gray-500">Planifiés</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <p className="text-2xl font-bold text-green-600">{stats.termine}</p>
              <p className="text-xs text-gray-500">Terminés</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <p className="text-xl font-bold text-gray-900">{stats.avancement_moyen}%</p>
              <p className="text-xs text-gray-500">Avancement moyen</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              {/* ✅ FIX : Number() + libellé DH au lieu de € */}
              <p className="text-xl font-bold text-gray-900">{formatDH(stats.budget_total)}</p>
              <p className="text-xs text-gray-500">Budget total</p>
            </div>
          </div>
          
          {/* Panneau des filtres */}
{showFilters && (
  <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-gray-900">Filtres avancés</h3>
      {(statusFilter || chefFilter || domaineFilter || dateFilter) && (
        <button 
          onClick={() => {
            setStatusFilter("");
            setChefFilter("");
            setDomaineFilter("");
            setDateFilter("");
          }} 
          className="text-xs text-red-600 hover:underline"
        >
          Réinitialiser tous les filtres
        </button>
      )}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Filtre par statut */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500/50"
        >
           <option value="">Tous les statuts</option>
           <option value="planifie">Planifié</option>
           <option value="en_cours">En cours</option>
           <option value="termine">Terminé</option>
           <option value="en_pause">En pause</option>
           <option value="a_risque">À risque</option>
        </select>
      </div>
      
      {/* Filtre par chef de projet (visible uniquement pour la direction) */}
      {userRole === 'direction' && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Chef de projet</label>
          <select
            value={chefFilter}
            onChange={(e) => setChefFilter(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <option value="">Tous les chefs</option>
             {chefsLoading ? (
               <option disabled>Chargement...</option>
            ) : chefsProjet.map((chef: any) => (
            <option key={chef.id} value={chef.id}>
            {chef.nom} {chef.email && `(${chef.email})`}
           </option>
          ))}
            
          </select>
        </div>
      )}
      
      {/* Filtre par domaine */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Domaine</label>
        <select
          value={domaineFilter}
          onChange={(e) => setDomaineFilter(e.target.value)}
          className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500/50"
        >
          <option value="">Tous les domaines</option>
          <option value="Transformation Digitale">Transformation Digitale</option>
          <option value="Intelligence Artificielle">Intelligence Artificielle</option>
          <option value="Cloud">Cloud</option>
          <option value="Sécurité">Sécurité</option>
          <option value="Data">Data</option>
        </select>
      </div>
      
      {/* Filtre par date */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Date de début (à partir de)</label>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500/50"
        />
      </div>
    </div>
  </div>
)} 
              {view === "grid" && (
                 <>
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
    {filteredProjects.map((project: any) => (
      <div
        key={project.id}
        className="group bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
      >
        {/* Bandeau supérieur */}
        <div className="relative">
          <div className={`h-1.5 w-full ${project.progress >= 80 ? 'bg-green-500' : project.progress >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
          <div className="absolute top-2 right-3">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm ${getStatusColor(project.statut)}`}>
              {getStatusLabel(project.statut)}
            </span>
          </div>
        </div>
        
        <div className="p-4 pt-6">
          {/* Titre et icône */}
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 line-clamp-1">{project.name || project.nom}</h3>
              <p className="text-xs text-gray-400 truncate">{project.clientNom || project.client || project.clientId}</p>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-xs text-gray-400 line-clamp-2 mb-4">{project.description}</p>
          
          {/* Avancement */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Progression</span>
              <span className="font-mono text-red-600">{project.progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full">
              <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-gray-400" />
              {/* FIX : Number() + DH au lieu de € */}
              <span className="text-xs font-medium">{formatDH(project.Budget ?? project.budget)}</span>
            </div>
            <div className="flex items-center gap-1">
              {userRole === 'direction' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEquipeProjet({ id: project.id, nom: project.nom || project.name || "" });
                  }}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:bg-red-50 transition group/team"
                  title="Voir l'équipe"
                >
                  <Users className="h-3.5 w-3.5 text-gray-400 group-hover/team:text-red-500 transition" />
                  <span className="text-xs text-gray-500 group-hover/team:text-red-500 transition">
                    {project.nombre_membres+1 || 0}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-1 px-1.5 py-0.5">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">{project.nombre_membres || 0}</span>
                </div>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
             {(userRole === 'direction') && (
  <>
    <button 
      onClick={(e) => { e.stopPropagation(); setEditingProject(project); }} 
      className="p-1 hover:bg-gray-100 rounded"
    >
      <Edit className="h-3 w-3 text-gray-500" />
    </button>
    
    <button 
      onClick={(e) => { e.stopPropagation(); setDeletingProjectId(project.id); setDeletingProjectName(project.name || project.nom || ""); }} 
      className="p-1 hover:bg-red-100 rounded"
    >
      <Trash2 className="h-3 w-3 text-red-500" />
    </button>
  </>
)}
             
            </div>
          </div>
        </div>
      </div>
     
    ))}
  </div>
   </>
)}
           
          {/* Vue Liste */}
          {view === "list" && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Projet</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Statut</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Avancement</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Budget</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project: any) => (
                    <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => navigate({ to: `/app/projets/${project.id}` })}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{project.name || project.nom}</div>
                        <div className="text-xs text-gray-400">{project.code}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{project.clientNom || project.client || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(project.statut)}`}>
                          {getStatusLabel(project.statut)}
                        </span>
                      </td>
                      <td className="px-4 py-3 w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${project.progress}%` }} />
                          </div>
                          <span className="text-xs font-medium">{project.progress}%</span>
                        </div>
                      </td>
                      {/* FIX : Number() + DH au lieu de € */}
                      <td className="px-4 py-3 text-gray-600">{formatDH(project.Budget ?? project.budget)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {(userRole === 'direction') && (
                            <>
                              <button onClick={() => setEditingProject(project)} className="p-1 rounded hover:bg-gray-200">
                                <Edit className="h-4 w-4 text-gray-500" />
                              </button>
                              <button onClick={() => { setDeletingProjectId(project.id); setDeletingProjectName(project.name || project.nom || ""); }} className="p-1 rounded hover:bg-red-100">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </>
                          )}
                          
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {filteredProjects.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <ListIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet trouvé</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter || domaineFilter || dateFilter ? "Essayez de modifier vos filtres" : "Commencez par créer un nouveau projet"}
              </p>
              {(userRole === 'direction') && (
                <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg">
                  <Plus className="h-4 w-4 inline mr-2" /> Créer un projet
                </button>
              )}
            </div>
          )}
        </div>
      </AppShell>
      
      {/* Modale d'ajout */}
      {showAddForm && (
        <AddProjectForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            refetch();
            setSuccessMessage("Projet créé avec succès");
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}
      
      {/* Modale d'édition */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={() => {
            setEditingProject(null);
            refetch();
            setSuccessMessage("Projet modifié avec succès");
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}
      
      {/* Modale de suppression */}
      {deletingProjectId && (
        <DeleteProjectModal 
          projectName={deletingProjectName}
          onConfirm={() => handleDelete(deletingProjectId)}
          onCancel={() => setDeletingProjectId(null)}
        />
      )}
      {showImportModal && (
        <ImportExcelModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
           setShowImportModal(false);
           refetch();
           setSuccessMessage("Projets importés avec succès");
           setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}
    
    {/* Modal équipe projet — direction uniquement */}
      {equipeProjet && userRole === 'direction' && (
        <EquipeProjetModal
          projetId={equipeProjet.id}
          projetNom={equipeProjet.nom}
          onClose={() => setEquipeProjet(null)}
        />
      )}
    </>
  );
}