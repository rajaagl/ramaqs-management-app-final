// src/routes/forgot-password.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, CheckCircle, AlertCircle, Loader2, Send } from "lucide-react";
import { API_BASE_URL } from "../config/endpoints";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [formData, setFormData] = useState({ email: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // ── Validation frontend ───────────────────────────────────────────────────
    if (!formData.email) {
      setError("Email requis");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Email invalide");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      // ── Erreur serveur (400, 500) ─────────────────────────────────────────
      if (!response.ok) {
        setError(data.error || data.message || "Une erreur est survenue");
        return;
      }

      // Le backend renvoie volontairement la même réponse dans tous les cas
      // afin de ne pas révéler quels comptes existent.
      setSubmitted(true);
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Écran de succès (WhatsApp envoyé) ────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-red-50 to-white p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Demande envoyée</h2>
          <p className="text-gray-600 mb-4">
            Si les informations correspondent à un compte actif, un lien de réinitialisation valable 30 minutes a été envoyé à{" "}
            <strong className="text-red-600">{formData.email}</strong>.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-amber-700">
              <strong>⚠️ Important :</strong> Ne partagez jamais le lien reçu. Si vous n'avez rien demandé, ignorez cet e-mail.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  // ── Formulaire principal ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-red-50 to-white p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Mot de passe oublié</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Entrez votre e-mail pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email professionnel <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="utilisateur@exemple.com"
                className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* ✅ Erreur (400 / 500 / validation) */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">
               Si les informations correspondent à un compte, un lien de réinitialisation sera envoyé par e-mail.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours...</>
            ) : (
              <><Send className="h-4 w-4" /> Recevoir le lien</>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-red-600 hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
