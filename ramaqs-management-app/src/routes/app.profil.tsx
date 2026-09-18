import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Mail, Phone, Briefcase, Edit, LogOut, Camera, Loader2,
  UserCheck, Shield, Building2, Users, CheckCircle, AlertCircle,
  Globe, X, Save, Lock, User,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../store/store";
import {
  useGetCurrentUserQuery,
  useUpdateUserMutation,
  useLogoutMutation,
} from "../store/api/api";
import { logout } from "../store/slices/authSlice";
import { useState, useRef } from "react";
import { getToken } from "../utils/auth";
import { API_BASE_URL } from "../config/endpoints";

export const Route = createFileRoute("/app/profil")({
  component: ProfilPage,
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  direction:   { label: "Direction",        color: "text-purple-700", bg: "bg-purple-100", icon: Shield },
  chef_projet: { label: "Chef de projet",   color: "text-blue-700",   bg: "bg-blue-100",   icon: UserCheck },
  consultant:  { label: "Consultant",        color: "text-green-700",  bg: "bg-green-100",  icon: Users },
  client:      { label: "Client",            color: "text-gray-700",   bg: "bg-gray-100",   icon: Building2 },
  partenaire:  { label: "Partenaire",        color: "text-indigo-700", bg: "bg-indigo-100", icon: Globe },
  super_admin: { label: "Super Admin",       color: "text-red-700",    bg: "bg-red-100",    icon: Shield },
};

function getRoleInfo(role?: string) {
  return ROLE_CONFIG[role || ""] ?? ROLE_CONFIG.consultant;
}

// ─────────────────────────────────────────────────────────────
// Composant : ligne d'information
// ─────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
  locked,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  locked?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="h-9 w-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        {badge ? (
          badge
        ) : (
          <p className="text-sm font-medium text-gray-800 truncate">
            {value || <span className="text-gray-400 italic text-xs">Non renseigné</span>}
          </p>
        )}
      </div>
      {locked && <Lock className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" aria-label="Non modifiable" />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Composant : modal d'édition
// ─────────────────────────────────────────────────────────────
interface EditModalProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

function EditModal({ user, onClose, onSuccess }: EditModalProps) {
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const role = getRoleInfo(user?.role);
  const RoleIcon = role.icon;

  const [form, setForm] = useState({
    nom:       user?.nom       || "",
    telephone: user?.telephone || "",
    poste:     user?.poste     || "",
  });
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) { setError("Le nom complet est requis"); return; }
    try {
      await updateUser({ id: user.id, data: { nom: form.nom, telephone: form.telephone, poste: form.poste } }).unwrap();
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1300);
    } catch (err: any) {
      setError(err?.data?.detail || err?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-200">

        {/* En-tête gradient */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Modifier mon profil</h2>
              <p className="text-sm text-white/70">Mettez vos informations à jour</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="h-4 w-4 flex-shrink-0" /> Profil mis à jour avec succès !
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Nom complet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              name="nom"
              value={form.nom}
              onChange={handleChange}
              placeholder="Ex : Youssef Alaoui"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none text-sm"
            />
          </div>

          {/* Email – lecture seule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              Email <Lock className="h-3 w-3 text-gray-400" />
            </label>
            <input
              value={user?.email || ""}
              readOnly
              className="w-full px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              name="telephone"
              value={form.telephone}
              onChange={handleChange}
              placeholder="+212 6XX XXX XXX"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none text-sm"
            />
          </div>

          {/* Poste */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
            <input
              name="poste"
              value={form.poste}
              onChange={handleChange}
              placeholder="Ex : Consultant Senior"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none text-sm"
            />
          </div>

          {/* Rôle – lecture seule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              Rôle <Lock className="h-3 w-3 text-gray-400" />
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${role.bg} ${role.color}`}>
                <RoleIcon className="h-3 w-3" /> {role.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Modifiable uniquement par un administrateur.</p>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────
function ProfilPage() {
  const navigate     = useNavigate();
  const dispatch     = useAppDispatch();
  const { user: reduxUser, isAuthenticated } = useAppSelector((state) => state.auth);

  const token        = localStorage.getItem("access_token");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadSuccess,  setUploadSuccess]  = useState(false);
  const [uploadError,    setUploadError]    = useState<string | null>(null);
  const [localPhoto,     setLocalPhoto]     = useState<string | null>(null);
  const [showEditModal,  setShowEditModal]  = useState(false);

  const { data: apiUser, isLoading, refetch } = useGetCurrentUserQuery(undefined, {
    skip: !token,
  });
  const [logoutUser] = useLogoutMutation();

  // Données fusionnées : API (plus fraîche) ou Redux (fallback)
  const user = apiUser || reduxUser;

  if (!isAuthenticated && !token) {
    navigate({ to: "/login" });
    return null;
  }

  const handleLogout = async () => {
    try { await logoutUser(localStorage.getItem('refresh_token')).unwrap(); } finally {
      dispatch(logout());
      navigate({ to: "/login" });
    }
  };

  // ── Upload photo – fix : fetch direct avec FormData (pas RTK Query) ──
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) { setUploadError("Veuillez choisir une image."); return; }
    if (file.size > 5 * 1024 * 1024)    { setUploadError("L'image ne doit pas dépasser 5 Mo."); return; }

    // Prévisualisation locale immédiate
    const reader = new FileReader();
    reader.onload = (ev) => setLocalPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingPhoto(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("photo_profil", file);

      // ✅ On bypasse RTK Query pour éviter que Content-Type: application/json
      //    écrase le multipart/form-data du FormData (avec son boundary).
      const accessToken = getToken();
      const apiBase     = API_BASE_URL;

      const res = await fetch(`${apiBase}/utilisateurs/${user?.id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // ⚠️  PAS de Content-Type ici → le browser le génère automatiquement
          //     avec le boundary correct pour multipart/form-data
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? err.message ?? "Échec de l'upload");
      }

      await refetch();
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setUploadError(err.message ?? "Erreur lors de l'upload de la photo.");
      setLocalPhoto(null);
    } finally {
      setUploadingPhoto(false);
      // Réinitialiser l'input pour permettre de re-choisir le même fichier
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── États de chargement / erreur ──
  if (isLoading) {
    return (
      <AppShell title="Mon profil" subtitle="Chargement…" hideSearch={true}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell title="Mon profil" subtitle="Erreur" hideSearch={true}>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-gray-600">Impossible de charger le profil</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
            Réessayer
          </button>
        </div>
      </AppShell>
    );
  }

  const role      = getRoleInfo(user.role);
  const RoleIcon  = role.icon;
  const initials  = user.nom?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";
  const photoSrc  = localPhoto ?? user.photo_profil;

  return (
    <>
      <AppShell
        title="Mon profil"
        subtitle="Gérez vos informations personnelles"
        hideSearch={true}
        actions={
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all active:scale-95"
          >
            <Edit className="h-4 w-4" /> Modifier mon profil
          </button>
        }
      >
        <div className="max-w-4xl mx-auto space-y-5">

          {/* ── Toasts ── */}
          {uploadSuccess && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" /> Photo mise à jour avec succès !
            </div>
          )}
          {uploadError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {uploadError}
            </div>
          )}

          {/* ─────────────── HERO CARD ─────────────── */}
          <div className="relative rounded-2xl overflow-hidden shadow-md">
            {/* Bandeau gradient */}
            <div className="h-36 bg-gradient-to-r from-red-700 via-red-600 to-red-400">
              {/* motif décoratif */}
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)" }} />
            </div>

            <div className="bg-white px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-14">

                {/* Avatar + bouton upload */}
                <div className="relative group flex-shrink-0">
                  <div className="h-28 w-28 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white">
                    {photoSrc ? (
                      <img src={photoSrc} alt={user.nom} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-red-500 to-red-700 grid place-items-center text-white font-bold text-3xl select-none">
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Bouton caméra */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    title="Changer la photo de profil"
                    className="absolute -bottom-2 -right-2 h-9 w-9 rounded-xl bg-white border-2 border-red-100 shadow-lg flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all group-hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingPhoto
                      ? <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                      : <Camera className="h-4 w-4 text-red-600" />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {/* Nom + badges */}
                <div className="flex-1 text-center sm:text-left pb-1">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{user.nom}</h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${role.bg} ${role.color}`}>
                      <RoleIcon className="h-3.5 w-3.5" /> {role.label}
                    </span>
                    {user.poste && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        <Briefcase className="h-3 w-3" /> {user.poste}
                      </span>
                    )}
                  </div>
                </div>

                {/* Déconnexion (desktop) 
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition text-sm font-medium self-end pb-2"
                >
                  <LogOut className="h-4 w-4" /> Déconnexion
                </button>
                */}
              </div>
            </div>
          </div>

          {/* ─────────────── GRILLE D'INFOS ─────────────── */}
          <div className="grid md:grid-cols-2 gap-5">

            {/* Informations personnelles */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/60 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center">
                  <User className="h-4 w-4 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Informations personnelles</h3>
              </div>
              <div className="divide-y divide-gray-50">
                <InfoRow
                  icon={<User className="h-4 w-4 text-red-500" />}
                  label="Nom complet"
                  value={user.nom}
                />
                <InfoRow
                  icon={<Mail className="h-4 w-4 text-blue-500" />}
                  label="Email"
                  value={user.email}
                  locked
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4 text-green-500" />}
                  label="Téléphone"
                  value={user.telephone}
                />
              </div>
            </div>

            {/* Informations professionnelles */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/60 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Informations professionnelles</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {/* Rôle avec badge coloré */}
                <InfoRow
                  icon={<RoleIcon className="h-4 w-4 text-gray-400" />}
                  label="Rôle"
                  locked
                  badge={
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${role.bg} ${role.color}`}>
                      <RoleIcon className="h-3 w-3" /> {role.label}
                    </span>
                  }
                />
                <InfoRow
                  icon={<Briefcase className="h-4 w-4 text-purple-500" />}
                  label="Poste"
                  value={user.poste}
                />
              </div>
            </div>
          </div>

          {/* Déconnexion (mobile) */}
          <div className="flex justify-center sm:hidden pb-2">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition text-sm font-medium"
            >
              <LogOut className="h-4 w-4" /> Se déconnecter
            </button>
          </div>

        </div>
      </AppShell>

      {/* ── Modal d'édition ── */}
      {showEditModal && (
        <EditModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSuccess={async () => { await refetch(); }}
        />
      )}
    </>
  );
}
