// src/components/Users/ChangePasswordModal.tsx
import { useState } from "react";
import { X, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useChangerMotDePasseMutation } from "../../store/api/api";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const [changerMotDePasse, { isLoading }] = useChangerMotDePasseMutation();
  const [formData, setFormData] = useState({
    ancien_mot_de_passe: "",
    nouveau_mot_de_passe: "",
    confirmation: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (formData.nouveau_mot_de_passe !== formData.confirmation) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    
    if (formData.nouveau_mot_de_passe.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    if (formData.ancien_mot_de_passe === formData.nouveau_mot_de_passe) {
      setError("Le nouveau mot de passe doit être différent de l'ancien");
      return;
    }
    
    try {
      await changerMotDePasse({
        ancien_mot_de_passe: formData.ancien_mot_de_passe,
        nouveau_mot_de_passe: formData.nouveau_mot_de_passe,
        confirmation: formData.confirmation,
      }).unwrap();
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.data?.error || err.data?.message || "Erreur lors du changement");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        
        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Changer le mot de passe
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Corps */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            ⚠️ Vous devez changer votre mot de passe temporaire avant de continuer.
          </p>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Mot de passe changé avec succès ! Redirection...
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe actuel (temporaire)
            </label>
            <input
              type="password"
              value={formData.ancien_mot_de_passe}
              onChange={(e) => setFormData({...formData, ancien_mot_de_passe: e.target.value})}
              placeholder="Entrez votre mot de passe temporaire"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              required
              disabled={success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={formData.nouveau_mot_de_passe}
              onChange={(e) => setFormData({...formData, nouveau_mot_de_passe: e.target.value})}
              placeholder="Au moins 6 caractères"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              required
              disabled={success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={formData.confirmation}
              onChange={(e) => setFormData({...formData, confirmation: e.target.value})}
              placeholder="Retapez votre nouveau mot de passe"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              required
              disabled={success}
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading || success}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {isLoading ? "Changement..." : "Changer le mot de passe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}