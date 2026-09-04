// src/components/Users/RejectUserModal.tsx
import { XCircle, X, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

interface RejectUserModalProps {
  user: {
    id: string;
    nom: string;
    role: string;
    email: string;
  };
  onConfirm: (justification: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const roleLabels: Record<string, string> = {
  chef_projet: "Chef de projet",
  consultant: "Consultant",
  partenaire: "Partenaire",
  client: "Client",
};

export function RejectUserModal({ user, onConfirm, onCancel, isLoading }: RejectUserModalProps) {
  const [justification, setJustification] = useState("");
  const [error, setError] = useState("");

  const roleLabel = roleLabels[user.role] || user.role;

  const handleConfirm = () => {
    if (!justification.trim()) {
      setError("La justification est obligatoire");
      return;
    }
    setError("");
    onConfirm(justification);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        
        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Rejeter la demande</h2>
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5">
          <p className="text-gray-600 mb-2">
            Êtes-vous sûr de vouloir rejeter ?
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="font-medium text-gray-900">{user.nom}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
              {roleLabel}
            </span>
          </div>

          {/* Champ justification */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motif du rejet <span className="text-red-500">*</span>
          </label>
          <textarea
            value={justification}
            onChange={(e) => {
              setJustification(e.target.value);
              if (e.target.value.trim()) setError("");
            }}
            placeholder="Expliquez la raison du rejet..."
            rows={4}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 outline-none resize-none ${
              error ? "border-red-500" : "border-gray-200"
            }`}
          />
          {error && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}

          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-4">
             Un message whatsapp de rejet sera envoyé à l'utilisateur avec la justification.
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
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            {isLoading ? "Traitement..." : "Rejeter"}
          </button>
        </div>
      </div>
    </div>
  );
}