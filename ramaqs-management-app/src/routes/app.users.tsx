// src/routes/app.users.tsx
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { useState } from "react";
import { 
  useGetPendingUsersQuery, 
  useApproveRejectUserMutation 
} from "../store/api/api";
import { ApproveUserModal } from "@/components/Users/ApproveUserModal";
import { RejectUserModal } from "@/components/Users/RejectUserModal";
import { UserDetailModal } from "@/components/Users/UserDetailModal";
import { 
  CheckCircle, XCircle, Clock, Users, Loader2, 
  Mail, Phone, Building2, Briefcase, Eye 
} from "lucide-react";
import type { Utilisateur } from "../store/interfaces";

// ✅ CORRECTION ICI
export const Route = createFileRoute("/app/users")({
  component: () => (
    <ProtectedRoute allowedRoles={["direction"]}>
      <UsersPage />
    </ProtectedRoute>
  ),
});

function UsersPage() {
  const { data, isLoading, refetch } = useGetPendingUsersQuery();
  const [approveReject, { isLoading: isProcessing }] = useApproveRejectUserMutation();
  
  // États pour les modales
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState("all");

  const users = data?.results || [];
  const stats = data?.stats || { total: 0, pending: 0, approved: 0, rejected: 0, par_role: {} };

  // Filtrage
  const filteredUsers = users.filter((user: Utilisateur) => {
    if (filter === "all") return true;
    if (filter === "chef_projet") return user.role === "chef_projet";
    if (filter === "consultant") return user.role === "consultant";
    if (filter === "partenaire") return user.role === "partenaire";
    if (filter === "client") return user.role === "client";
    return user.statut_approbation === filter;
  });

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      chef_projet: "bg-blue-100 text-blue-700",
      consultant: "bg-purple-100 text-purple-700",
      partenaire: "bg-orange-100 text-orange-700",
      client: "bg-green-100 text-green-700",
      direction: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      chef_projet: "Chef de projet",
      consultant: "Consultant",
      partenaire: "Partenaire",
      client: "Client",
      direction: "Direction",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role]}`}>
        {labels[role]}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approuvé</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejeté</span>;
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> En attente</span>;
    }
  };

  // Gestionnaires
  const handleApprove = async () => {
    if (!selectedUser) return;
    await approveReject({ id: selectedUser.id, action: 'approve' });
    setShowApproveModal(false);
    setSelectedUser(null);
    refetch();
  };

  const handleReject = async (justification: string) => {
    if (!selectedUser) return;
    await approveReject({ id: selectedUser.id, action: 'reject', justification });
    setShowRejectModal(false);
    setSelectedUser(null);
    refetch();
  };

  if (isLoading) {
    return (
      <AppShell title="Utilisateurs" subtitle="Gestion des comptes">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Utilisateurs" subtitle="Gérez les demandes d'inscription">
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Users className="h-5 w-5 text-gray-400 mb-2" />
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-xs text-gray-500">Total demandes</div>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <Clock className="h-5 w-5 text-yellow-500 mb-2" />
          <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-xs text-yellow-600">En attente</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <CheckCircle className="h-5 w-5 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
          <div className="text-xs text-green-600">Approuvés</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <XCircle className="h-5 w-5 text-red-500 mb-2" />
          <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
          <div className="text-xs text-red-600">Rejetés</div>
        </div>
      </div>

      {/* Filtres par rôle */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === "all" ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-red-200"}`}>
          Tous ({stats.total})
        </button>
        <button onClick={() => setFilter("chef_projet")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === "chef_projet" ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-red-200"}`}>
          Chefs projet ({(stats.par_role as any)?.chef_projet || 0})
        </button>
        <button onClick={() => setFilter("consultant")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === "consultant" ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-red-200"}`}>
          Consultants ({(stats.par_role as any)?.consultant || 0})
        </button>
        <button onClick={() => setFilter("partenaire")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === "partenaire" ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-red-200"}`}>
          Partenaires ({(stats.par_role as any)?.partenaire || 0})
        </button>
        <button onClick={() => setFilter("client")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === "client" ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-red-200"}`}>
          Clients ({(stats.par_role as any)?.client || 0})
        </button>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune demande en attente</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredUsers.map((user: Utilisateur) => (
              <div key={user.id} className="p-5 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  
                  {/* Informations utilisateur */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="font-semibold text-gray-900">{user.nom}</h3>
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.statut_approbation)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </div>
                      {user.telephone && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Phone className="h-3.5 w-3.5" />
                          {user.telephone}
                        </div>
                      )}
                      {user.entreprise && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Building2 className="h-3.5 w-3.5" />
                          {user.entreprise}
                        </div>
                      )}
                      {user.poste && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Briefcase className="h-3.5 w-3.5" />
                          {user.poste}
                        </div>
                      )}
                    </div>
                    
                    {user.justification_rejet && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                        Motif du rejet : {user.justification_rejet}
                      </div>
                    )}
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDetailModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {user.statut_approbation === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowApproveModal(true);
                          }}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approuver
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRejectModal(true);
                          }}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Rejeter
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALES */}
      {showApproveModal && selectedUser && (
        <ApproveUserModal
          user={selectedUser}
          onConfirm={handleApprove}
          onCancel={() => {
            setShowApproveModal(false);
            setSelectedUser(null);
          }}
          isLoading={isProcessing}
        />
      )}

      {showRejectModal && selectedUser && (
        <RejectUserModal
          user={selectedUser}
          onConfirm={handleReject}
          onCancel={() => {
            setShowRejectModal(false);
            setSelectedUser(null);
          }}
          isLoading={isProcessing}
        />
      )}

      {showDetailModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </AppShell>
  );
}