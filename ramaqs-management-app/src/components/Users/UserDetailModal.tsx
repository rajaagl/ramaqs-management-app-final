// src/components/Users/UserDetailModal.tsx
import { X, Mail, Phone, Building2, Briefcase, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Utilisateur } from "../../store/interfaces";

interface UserDetailModalProps {
  user: Utilisateur;
  onClose: () => void;
}

const roleLabels: Record<string, string> = {
  direction: "Direction",
  chef_projet: "Chef de projet",
  consultant: "Consultant",
  partenaire: "Partenaire",
  client: "Client",
};

const roleColors: Record<string, string> = {
  direction: "bg-red-100 text-red-700",
  chef_projet: "bg-blue-100 text-blue-700",
  consultant: "bg-purple-100 text-purple-700",
  partenaire: "bg-orange-100 text-orange-700",
  client: "bg-green-100 text-green-700",
};

export function UserDetailModal({ user, onClose }: UserDetailModalProps) {
  const getStatusIcon = () => {
    switch (user.statut_approbation) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusText = () => {
    switch (user.statut_approbation) {
      case 'approved':
        return "Approuvé";
      case 'rejected':
        return "Rejeté";
      default:
        return "En attente";
    }
  };

  const getStatusColor = () => {
    switch (user.statut_approbation) {
      case 'approved':
        return "text-green-600 bg-green-50";
      case 'rejected':
        return "text-red-600 bg-red-50";
      default:
        return "text-yellow-600 bg-yellow-50";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-200">
        
        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Détails de l'utilisateur</h2>
            <p className="text-sm text-gray-500">Informations complètes du compte</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 space-y-4">
          {/* Nom et rôle */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{user.nom}</h3>
                <span className={`inline-block mt-1 px-2 py-1 rounded-lg text-xs font-medium ${roleColors[user.role]}`}>
                  {roleLabels[user.role]}
                </span>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                {getStatusIcon()}
                <span>{getStatusText()}</span>
              </div>
            </div>
          </div>

          {/* Informations de contact */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{user.email}</span>
            </div>
            {user.telephone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{user.telephone}</span>
              </div>
            )}
          </div>

          {/* Entreprise et poste */}
          {(user.entreprise || user.poste) && (
            <div className="border-t border-gray-100 pt-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Entreprise</h4>
              <div className="space-y-2">
                {user.entreprise && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{user.entreprise}</span>
                  </div>
                )}
                {user.poste && (
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{user.poste}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="border-t border-gray-100 pt-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dates</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Inscription :</span>
                <span className="text-gray-700">{new Date(user.date_creation).toLocaleDateString('fr-FR')}</span>
              </div>
              {user.date_approbation && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Approbation :</span>
                  <span className="text-gray-700">{new Date(user.date_approbation).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Justification de rejet */}
          {user.justification_rejet && (
            <div className="border-t border-gray-100 pt-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Motif du rejet</h4>
              <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
                {user.justification_rejet}
              </div>
            </div>
          )}
        </div>

        {/* Bouton fermer */}
        <div className="p-5 pt-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}