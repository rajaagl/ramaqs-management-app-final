// src/routes/forgot-password.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, CheckCircle, AlertCircle, Loader2, Send, Info } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [formData, setFormData] = useState({ email: "", telephone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    // ── Validation frontend ───────────────────────────────────────────────────
    if (!formData.email || !formData.telephone) {
      setError("Email et numéro de téléphone sont requis");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Email invalide");
      return;
    }
    if (formData.telephone.length < 9) {
      setError("Numéro de téléphone invalide (minimum 9 chiffres)");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/forgot-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          telephone: formData.telephone,
        }),
      });

      const data = await response.json();

      // ── Erreur serveur (400, 500) ─────────────────────────────────────────
      if (!response.ok) {
        setError(data.error || data.message || "Une erreur est survenue");
        return;
      }

      // ── ✅ FIX PRINCIPAL ──────────────────────────────────────────────────
      // Le backend renvoie TOUJOURS un 200, même quand l'email ou le téléphone
      // ne correspondent à aucun compte (mesure de sécurité anti-énumération).
      // La seule façon de savoir si le WhatsApp a vraiment été envoyé, c'est
      // de vérifier `data.success === true`, présent UNIQUEMENT en cas de succès réel.
      //
      // Avant le fix : setSubmitted(true) s'exécutait sur tout 200
      //   → écran de succès même quand rien n'était envoyé.
      // Après le fix : seul data.success === true déclenche l'écran de succès.
      if (data.success === true) {
        setSubmitted(true); // ← uniquement si WhatsApp vraiment envoyé
      } else {
        // 200 sans success:true = email/téléphone non reconnus dans la base
        // On affiche un message neutre (on ne révèle pas si l'email existe)
        setInfoMessage(
          data.message ||
          "Si ces informations correspondent à un compte, vous recevrez un message WhatsApp."
        );
      }
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe envoyé !</h2>
          <p className="text-gray-600 mb-4">
            Un nouveau mot de passe temporaire a été envoyé par WhatsApp au{" "}
            <strong className="text-red-600">{formData.telephone}</strong>
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-amber-700">
              <strong>⚠️ Important :</strong> Ce mot de passe est temporaire. Vous devrez le modifier dès votre première connexion.
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
            Entrez votre email et numéro de téléphone pour recevoir un nouveau mot de passe par WhatsApp
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

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Numéro de téléphone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="0600000000"
                className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                required
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Le numéro enregistré lors de votre inscription
            </p>
          </div>

          {/* ✅ Erreur (400 / 500 / validation) */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ✅ Message neutre (email/tel inconnus — 200 sans success:true) */}
          {infoMessage && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex items-start gap-2 animate-in fade-in">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">
               Un mot de passe temporaire vous sera envoyé par WhatsApp si vos informations correspondent à un compte.
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
              <><Send className="h-4 w-4" /> Recevoir le mot de passe</>
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