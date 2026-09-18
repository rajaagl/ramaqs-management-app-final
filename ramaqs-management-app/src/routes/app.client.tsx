import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { formatCurrency } from "@/lib/mock-data";
import { 
  Building2, Users, Mail, Phone, MapPin, 
  Plus, Search, Filter, MoreVertical, 
  TrendingUp, Calendar, Star, Edit, Trash2,
  Building, Briefcase, FileText, Download,
  ChevronLeft, ChevronRight, Award, CreditCard,
  Globe, Linkedin, Twitter, CheckCircle, XCircle,
  Clock, DollarSign, PieChart, ArrowUpRight,
  ArrowDownRight, Eye, CalendarDays,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useGetClientsQuery, useDeleteClientMutation } from "../store/api/api";
import type { Client } from "../store/interfaces";

export const Route = createFileRoute("/app/client")({
  beforeLoad: () => {
    throw redirect({ to: "/app/users" });
  },
  component: ClientsPage,
});

function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  
  const { data, isLoading, error, refetch } = useGetClientsQuery({ 
    page: 1, 
    pageSize: 100,
    search: searchTerm || undefined
  });
  
  const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();

  // Données enrichies pour l'affichage (simulées pour la démo)
  const enrichedClients = (data?.results || []).map((client: Client, index: number) => ({
    ...client,
    // Données simulées pour l'affichage professionnel
    activeProjects: (client as any).activeProjects || Math.floor(Math.random() * 5) + 1,
    totalRevenue: (client as any).totalRevenue || Math.floor(Math.random() * 500000) + 50000,
    satisfaction: (client as any).satisfaction || 3.5 + Math.random() * 1.5,
    growth: Math.floor(Math.random() * 30) - 5,
    lastProject: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    nextMeeting: Math.random() > 0.6 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    churnRisk: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
  }));

  if (isLoading) {
    return (
      <AppShell title="Clients" subtitle="Chargement...">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Clients" subtitle="Erreur">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Building2 className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
            <p className="text-muted-foreground">Impossible de charger la liste des clients</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const clients = enrichedClients;
  const totalClients = data?.count || 0;

  // Statistiques avancées
  const totalActiveProjects = clients.reduce((sum: number, c: any) => sum + (c.activeProjects || 0), 0);
  const totalRevenue = clients.reduce((sum: number, c: any) => sum + (c.totalRevenue || 0), 0);
  const avgSatisfaction = clients.length > 0 
    ? (clients.reduce((sum: number, c: any) => sum + (c.satisfaction || 0), 0) / clients.length).toFixed(1)
    : "0";
  const highRiskClients = clients.filter((c: any) => c.churnRisk === "high").length;
  
  const industries = [...new Set(clients.map((c: Client) => c.secteurActivite))];
  const filteredClients = selectedIndustry === "all" 
    ? clients 
    : clients.filter((c: Client) => c.secteurActivite === selectedIndustry);

  const handleDelete = async (id: string) => {
    try {
      await deleteClient(id).unwrap();
      setShowDeleteConfirm(false);
      setSelectedClient(null);
      refetch();
    } catch {
    }
  };

  return (
    <AppShell
      title="Gestion des clients"
      subtitle="Portefeuille clients, KPIs et relations stratégiques"
      actions={
        <div className="flex gap-2">
          <div className="relative hidden lg:block">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 pr-3 rounded-lg bg-card border border-border text-sm w-64 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card text-sm hover:bg-muted transition-colors">
            <Download className="h-4 w-4" /> Exporter
          </button>
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card text-sm hover:bg-muted transition-colors">
            <Filter className="h-4 w-4" /> Filtres
          </button>
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-md transition-all">
            <Plus className="h-4 w-4" /> Nouveau client
          </button>
        </div>
      }
    >
      {/* Section Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="rounded-xl bg-gradient-primary p-5 text-primary-foreground">
          <div className="flex items-center justify-between">
            <Building2 className="h-8 w-8 opacity-80" />
            <span className="text-xs font-medium px-2 py-1 bg-white/20 rounded-full">TOTAL</span>
          </div>
          <p className="text-2xl font-bold mt-3">{totalClients}</p>
          <p className="text-sm opacity-80">Clients actifs</p>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <ArrowUpRight className="h-3 w-3" />
            <span>+12% vs mois dernier</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Briefcase className="h-4 w-4" />
            <span className="text-xs font-medium">PROJETS ACTIFS</span>
          </div>
          <p className="text-2xl font-bold">{totalActiveProjects}</p>
          <p className="text-xs text-muted-foreground mt-1">Moyenne {Math.round(totalActiveProjects / totalClients)}/client</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium">CHIFFRE D'AFFAIRES</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-green-500 mt-1">+8.2% vs N-1</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Star className="h-4 w-4" />
            <span className="text-xs font-medium">SATISFACTION</span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold">{avgSatisfaction}</p>
            <span className="text-sm text-muted-foreground">/5</span>
          </div>
          <div className="flex mt-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < Math.floor(parseFloat(avgSatisfaction)) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">RISQUE DE CHURN</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{highRiskClients}</p>
          <p className="text-xs text-muted-foreground mt-1">Clients à risque</p>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-xl bg-muted/30 border border-border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtrer par :</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedIndustry("all")}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              selectedIndustry === "all" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-card border border-border hover:bg-muted"
            }`}
          >
            Tous
          </button>
          {industries.map((industry) => (
            <button
              key={industry}
              onClick={() => setSelectedIndustry(industry)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                selectedIndustry === industry 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-card border border-border hover:bg-muted"
              }`}
            >
              {industry}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode("grid")} 
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Building2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setViewMode("list")} 
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Vue Grid */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client: any) => (
            <div key={client.id} className="group rounded-xl border border-border bg-card hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* En-tête avec gradient */}
              <div className="h-24 bg-gradient-to-r from-primary/10 to-primary/5 relative">
                <div className="absolute -bottom-8 left-5">
                  <div className="h-16 w-16 rounded-xl bg-gradient-primary shadow-lg flex items-center justify-center text-primary-foreground font-bold text-2xl">
                    {client.nom?.charAt(0) || "C"}
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  {client.churnRisk === "high" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">Risque élevé</span>
                  )}
                  {client.churnRisk === "medium" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning">À surveiller</span>
                  )}
                  {client.churnRisk === "low" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">Stable</span>
                  )}
                </div>
              </div>

              {/* Contenu */}
              <div className="pt-10 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{client.nom}</h3>
                    <p className="text-sm text-muted-foreground">{client.secteurActivite}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold">{client.satisfaction.toFixed(1)}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{client.email}</span>
                  </div>
                  {client.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{client.telephone}</span>
                    </div>
                  )}
                  {client.adresse && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{client.adresse}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Projets</p>
                    <p className="font-bold text-lg">{client.activeProjects}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">CA</p>
                    <p className="font-bold text-sm">{formatCurrency(client.totalRevenue)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Croissance</p>
                    <p className={`font-bold text-sm ${client.growth >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {client.growth >= 0 ? "+" : ""}{client.growth}%
                    </p>
                  </div>
                </div>

                {/* Prochain rendez-vous */}
                {client.nextMeeting && (
                  <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 text-xs">
                      <CalendarDays className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">Prochain RDV:</span>
                      <span className="font-medium">{new Date(client.nextMeeting).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
                    <Eye className="h-4 w-4" /> Détails
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedClient(client);
                      setShowDeleteConfirm(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 h-9 w-9 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vue Liste professionnelle */}
      {viewMode === "list" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Secteur</th>
                  <th className="text-right px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projets</th>
                  <th className="text-right px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">CA</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden xl:table-cell">Satisfaction</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClients.map((client: any) => (
                  <tr key={client.id} className="hover:bg-muted/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                          {client.nom?.charAt(0) || "C"}
                        </div>
                        <div>
                          <div className="font-semibold">{client.nom}</div>
                          <div className="text-xs text-muted-foreground">{client.numeroSiret}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">{client.email}</div>
                      <div className="text-xs text-muted-foreground">{client.telephone || "Tél. non renseigné"}</div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        <Briefcase className="h-3 w-3" />
                        {client.secteurActivite}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold">{client.activeProjects}</td>
                    <td className="px-4 py-4 text-right hidden lg:table-cell font-medium">{formatCurrency(client.totalRevenue)}</td>
                    <td className="px-4 py-4 text-center hidden xl:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold">{client.satisfaction.toFixed(1)}</span>
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg hover:bg-muted">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-muted">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedClient(client);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredClients.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucun client trouvé</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Aucun client ne correspond à votre recherche" : "Commencez par ajouter votre premier client"}
          </p>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteConfirm && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Confirmer la suppression</h2>
                <p className="text-sm text-muted-foreground">Cette action est irréversible</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Êtes-vous sûr de vouloir supprimer le client <span className="font-semibold text-foreground">{selectedClient.nom}</span> ?
              Toutes les données associées seront perdues.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(selectedClient.id)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition disabled:opacity-50"
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
