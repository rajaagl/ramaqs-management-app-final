// src/components/Users/ApproveUserModal.tsx
import { CheckCircle, X, Loader2 } from "lucide-react";

interface ApproveUserModalProps {
  user: {
    id: string;
    nom: string;
    role: string;
    email: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const roleLabels: Record<string, string> = {
  chef_projet: "Chef de projet",
  consultant: "Consultant",
  partenaire: "Partenaire",
  client: "Client",
};

export function ApproveUserModal({ user, onConfirm, onCancel, isLoading }: ApproveUserModalProps) {
  const roleLabel = roleLabels[user.role] || user.role;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        
        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Approuver l'utilisateur</h2>
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5">
          <p className="text-gray-600 mb-2">
            Êtes-vous sûr de vouloir approuver ?
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="font-medium text-gray-900">{user.nom}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
              {roleLabel}
            </span>
          </div>
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
            Un e-mail de confirmation sera envoyé à l’utilisateur. Il pourra se connecter avec le mot de passe choisi lors de son inscription.
          </p>
        </div>

        {/* Boutons */}
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {isLoading ? "Traitement..." : "Approuver"}
          </button>
        </div>
      </div>
    </div>
  );
}
