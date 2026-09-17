// src/routes/app.index.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ExportModal } from '@/components/Dashboard/ExportModal';
import { 
  FolderKanban, Wallet, AlertTriangle, Sparkles, TrendingUp, Download, 
  Plus, Users, CheckCircle, Clock, BarChart3, Activity, Calendar,
  ArrowUp, ArrowDown, Eye, MoreHorizontal, ChevronRight, Bell
} from "lucide-react";
import { useGetProjetsQuery, useGetTachesQuery, useGetNotificationsQuery } from "../store/api/api";
import { useAppSelector } from "../store/store";
import type { Projet, Tache } from "../store/interfaces";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart, Line
} from "recharts";
import { useState, useMemo  } from "react";
import type {ReactNode} from "react";
import { ProtectedRoute } from "#/components/ui/ProtectedRoute";

export const Route = createFileRoute("/app/")({
  component: () => (
            <ProtectedRoute allowedRoles={['direction','chef_projet','partenaire',]}>
              <Dashboard />
            </ProtectedRoute>
          ),
});


function toNumber(value: any): number {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  return isNaN(n) ? 0 : n;
}


const formatDH = (value: number | string | null | undefined): string => {
  if (!value) return '0 DH';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0 DH';
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};


const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899'];

function Dashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const isPartenaire = user?.role === 'partenaire';
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Récupération des données
  
  const { data: projetsData, isLoading: projetsLoading } = useGetProjetsQuery({ page: 1, pageSize: 100 });
  const { data: tachesData, isLoading: tachesLoading } = useGetTachesQuery({ page: 1, pageSize: 100 });
  const { data: notificationsData } = useGetNotificationsQuery({ page: 1, pageSize: 10 });
  
  // Extraction des données
  const projets = useMemo(() => Array.isArray(projetsData) ? projetsData : (projetsData?.results || []), [projetsData]);
  const taches = useMemo(() => Array.isArray(tachesData) ? tachesData : (tachesData?.results || []), [tachesData]);
  const notifications = useMemo(() => Array.isArray(notificationsData) ? notificationsData : (notificationsData?.results || []), [notificationsData]);

  // Statistiques calculées
  const projetsActifs = projets.filter((p: Projet) => p.statut === 'en_cours').length;
  const projetsTermines = projets.filter((p: Projet) => p.statut === 'termine').length;
  const projetsPlanifies = projets.filter((p: Projet) => p.statut === 'planifie').length;
  
  const tachesTerminees = taches.filter((t: Tache) => t.status === 'termine').length;
  const tachesEnCours = taches.filter((t: Tache) => t.status === 'en_cours' ).length;
  const tachesAFaire = taches.filter((t: Tache) => t.status === 'a_faire' ).length;
  
  // FIX : toNumber() pour éviter la concaténation de texte (Decimal Django → string)
  const budgetTotal = projets.reduce((sum: number, p: any) => sum + toNumber(p.Budget ?? p.budget), 0);
  const budgetConsomme = projets.reduce((sum: number, p: any) => sum + toNumber(p.spent ?? p.budget_consomme), 0);
  const tauxBudget = budgetTotal > 0 ? Math.round((budgetConsomme / budgetTotal) * 100) : 0;
  
  const avancementMoyen = taches.length > 0 
    ? Math.round(taches.reduce((sum: number, t: any) => sum + toNumber(t.avancement), 0) / taches.length)
    : 0;
  
  const nonLues = notifications.filter((n: any) => !n.lu).length;

  // Préparer les stats pour l'export
  const exportStats = {
    budgetTotal,
    budgetConsomme,
    tauxBudget,
    avancementMoyen,
  };

  //  Données RÉELLES - Évolution mensuelle
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      
      const projetsDuMois = projets.filter((p: Projet) => {
        if (!p.dateDebut) return false;
        const date = new Date(p.dateDebut);
        return date.getMonth() === monthIndex && date.getFullYear() === currentYear;
      });
      
      const tachesDuMois = taches.filter((t: Tache) => {
        if (!t.dateCreation) return false;
        const date = new Date(t.dateCreation);
        return date.getMonth() === monthIndex && date.getFullYear() === currentYear;
      });
      
      // FIX : toNumber() (même bug Decimal → string que budgetTotal)
      const budgetDuMois = projetsDuMois.reduce((sum: number, p: any) => sum + toNumber(p.Budget ?? p.budget), 0);
      
      last6Months.push({
        month: monthName,
        projets: projetsDuMois.length,
        taches: tachesDuMois.length,
        budget: Math.round(budgetDuMois / 1000),
      });
    }
    
    if (last6Months.every(m => m.projets === 0)) {
      return [
        { month: 'Jan', projets: 0, taches: 0, budget: 0 },
        { month: 'Fév', projets: 0, taches: 0, budget: 0 },
        { month: 'Mar', projets: 0, taches: 0, budget: 0 },
        { month: 'Avr', projets: 0, taches: 0, budget: 0 },
        { month: 'Mai', projets: 0, taches: 0, budget: 0 },
        { month: 'Juin', projets: projets.length, taches: taches.length, budget: Math.round(budgetTotal / 1000) },
      ];
    }
    
    return last6Months;
  }, [projets, taches, budgetTotal]);

  //  Projets par domaine 
  const projectsByDomain = useMemo(() => {
    const domainMap: { [key: string]: number } = {};
    projets.forEach((p: any) => {
      //  FIX : le champ s'appelle "domaine" (français), pas "domain".
      // L'ancienne ligne testait deux fois le même champ inexistant.
      const domaine = p.domaine || 'Autre';
      domainMap[domaine] = (domainMap[domaine] || 0) + 1;
    });
    return Object.entries(domainMap)
      .map(([name, value]) => ({ 
        name, 
        value, 
        color: COLORS[Object.keys(domainMap).indexOf(name) % COLORS.length] 
      }))
      .filter(d => d.value > 0);
  }, [projets]);

  // Projets par statut
  const projectsByStatus = [
    { name: 'En cours', value: projetsActifs, color: '#f97316' },
    { name: 'Planifiés', value: projetsPlanifies, color: '#3b82f6' },
    { name: 'Terminés', value: projetsTermines, color: '#22c55e' }
  ].filter(d => d.value > 0);

  //  Tâches par priorité (réelle)
  const tachesParPriorite = useMemo(() => {
    const priorites = [
      { name: 'Critique', key: 'critique', color: '#ef4444' },
      { name: 'Haute', key: 'haute', color: '#f97316' },
      { name: 'Normale', key: 'normale', color: '#3b82f6' },
      { name: 'Faible', key: 'faible', color: '#9ca3af' },
    ];
    return priorites
      .map(p => ({
        name: p.name,
        //  FIX : condition dupliquée supprimée (t.priority === p.key écrit deux fois)
        value: taches.filter((t: Tache) => t.priority === p.key).length,
        color: p.color,
      }))
      .filter(d => d.value > 0);
  }, [taches]);

  //  Projets récents (avec date_creation)
  const projetsRecents = useMemo(() => [...projets]
    .sort((a: Projet, b: Projet) => {
      const dateA = new Date(a.dateDebut || 0).getTime();
      const dateB = new Date(b.dateDebut || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 4), [projets]);

  if (projetsLoading || tachesLoading) {
    return (
      <AppShell title="Tableau de bord" subtitle="Chargement...">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Tableau de bord"
      subtitle={`Bienvenue ${user?.nom || 'Utilisateur'} · Vue d'ensemble de l'activité`}
      actions={
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button onClick={() => setSelectedPeriod('week')} className={`px-3 py-1.5 text-xs rounded-md transition ${selectedPeriod === 'week' ? 'bg-red-50 text-red-600' : 'text-gray-500'}`}>
              Semaine
            </button>
            <button onClick={() => setSelectedPeriod('month')} className={`px-3 py-1.5 text-xs rounded-md transition ${selectedPeriod === 'month' ? 'bg-red-50 text-red-600' : 'text-gray-500'}`}>
              Mois
            </button>
            <button onClick={() => setSelectedPeriod('year')} className={`px-3 py-1.5 text-xs rounded-md transition ${selectedPeriod === 'year' ? 'bg-red-50 text-red-600' : 'text-gray-500'}`}>
              Année
            </button>
          </div>
          
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50 transition"
          >
            <Download className="h-4 w-4" /> Exporter
          </button>
          
          <Link to="/app/projets" className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium hover:shadow-lg transition-all">
            <Plus className="h-4 w-4" /> Nouveau projet
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Cartes KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Carte Projets */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-red-50">
                <FolderKanban className="h-5 w-5 text-red-600" />
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${projetsActifs > 0 ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>
                +{projetsActifs} actifs
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{projets.length}</p>
            <p className="text-xs text-gray-500 mt-1">Projets totaux</p>
            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${projets.length > 0 ? (projetsActifs / projets.length) * 100 : 0}%` }} />
            </div>
          </div>
          
          {/* Carte Budget */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-50">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tauxBudget < 80 ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                Budget total
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatDH(budgetTotal)}</p>
            
    
          </div>
          
          {/* Carte Tâches — cachée pour les partenaires */}
{!isPartenaire && (
  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 rounded-lg bg-amber-50">
        <Activity className="h-5 w-5 text-amber-600" />
      </div>
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
        {avancementMoyen}% moy.
      </span>
    </div>
    <p className="text-2xl font-bold text-gray-900">{taches.length}</p>
    <p className="text-xs text-gray-500 mt-1">Tâches totales</p>
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full" style={{ width: `${taches.length > 0 ? (tachesTerminees / taches.length) * 100 : 0}%` }} />
      </div>
      <span className="text-xs text-gray-500">{tachesTerminees} terminées</span>
    </div>
  </div>
)}
          
          {/* Carte Notifications */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => window.location.href = '/app/notifications'}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-red-50">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
              {nonLues > 0 && (
                <span className="h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {nonLues}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
            <p className="text-xs text-gray-500 mt-1">Notifications</p>
            <p className="text-xs text-red-500 mt-0.5">{nonLues} non lues</p>
          </div>
        </div>
        
        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Évolution des projets */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Évolution du portefeuille</h3>
                <p className="text-xs text-gray-500 mt-0.5">Projets et budget sur l'année</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-red-500" /> Projets</span>
                <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-blue-500" /> Budget (kDH)</span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="projets" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', strokeWidth: 2 }} />
                  <Line yAxisId="right" type="monotone" dataKey="budget" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Distribution des projets par statut */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Distribution des projets</h3>
            <div className="h-64">
              {projectsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={projectsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {projectsByStatus.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Aucune donnée</div>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {projectsByStatus.map((item) => (
                <span key={item.name} className="flex items-center gap-1 text-xs">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}: {item.value}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Deuxième ligne de graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Distribution par domaine */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Projets par domaine</h3>
            <div className="h-64">
              {projectsByDomain.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectsByDomain} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Aucune donnée</div>
              )}
            </div>
          </div>
          
          {/* Tâches par priorité — cachée pour les partenaires */}
          {!isPartenaire && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Tâches par priorité</h3>
              <div className="h-64">
               {tachesParPriorite.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                  <Pie data={tachesParPriorite} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {tachesParPriorite.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                 </PieChart>
                </ResponsiveContainer>
               ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Aucune tâche</div>
               )}
              </div>
            </div>
          )}
          
          {/* Progression globale — cachée pour les partenaires */}
          {!isPartenaire && (
            <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Progression globale</h3>
                <div className="p-1.5 rounded-lg bg-white shadow-sm">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-red-600">{avancementMoyen}%</p>
                <p className="text-xs text-gray-500 mt-1">Avancement moyen des tâches</p>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">À faire</span>
                    <span className="text-gray-500">{tachesAFaire}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-gray-400 rounded-full" style={{ width: `${taches.length > 0 ? (tachesAFaire / taches.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-600">En cours</span>
                    <span className="text-gray-500">{tachesEnCours}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-amber-500 rounded-full" style={{ width: `${taches.length > 0 ? (tachesEnCours / taches.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-green-600">Terminé</span>
                    <span className="text-gray-500">{tachesTerminees}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: `${taches.length > 0 ? (tachesTerminees / taches.length) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Projets récents */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-900">Projets récents</h3>
              <p className="text-xs text-gray-500 mt-0.5">Les derniers projets créés</p>
            </div>
            <Link to="/app/projets" className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1">
              Voir tous <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Projet</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Statut</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Avancement</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Budget</th>
                </tr>
              </thead>
              <tbody>
                {projetsRecents.map((projet: any) => (
                  <tr key={projet.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/app/projets/${projet.id}`}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{projet.nom || projet.name}</div>
                      {/* ✅ FIX : projet.client vérifié deux fois → on ajoute clientNom en priorité */}
                      <div className="text-xs text-gray-400 mt-0.5">{projet.clientNom || projet.client || "—"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        projet.statut === 'en_cours' ? 'bg-amber-100 text-amber-700' :
                        projet.statut === 'termine' ? 'bg-green-100 text-green-700' :
                        projet.statut === 'planifie' ? 'bg-blue-100 text-blue-700' :
                        projet.statut === 'en_pause' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {projet.statut === 'en_cours' ? 'En cours' :
                         projet.statut === 'termine' ? 'Terminé' :
                         projet.statut === 'planifie' ? 'Planifié' :
                         projet.statut === 'en_pause' ? 'En pause' : 'Non défini'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full w-24">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${projet.avancementGlobal || projet.progress || 0}%` }} />
                        </div>
                        <span className="text-xs font-medium">{projet.avancementGlobal || projet.progress || 0}%</span>
                      </div>
                    </td>
                    {/* formatDH() gère déjà les strings en interne (parseFloat) — pas de bug ici */}
                    <td className="px-5 py-3 text-right font-medium">{formatDH(projet.Budget ?? projet.budget ?? 0)}</td>
                  </tr>
                ))}
                {projetsRecents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400">Aucun projet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        projets={projets}
        taches={taches}
        stats={exportStats}
      />
    </AppShell>
  );
}
