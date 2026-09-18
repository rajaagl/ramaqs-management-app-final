
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowRight, Lock, Mail, Building2, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { useLoginMutation } from "../store/api/api";
import { useAppDispatch } from "../store/store";
import { setCredentials } from "../store/slices/authSlice";
// En haut du fichier login.tsx, ajoutez l'import
import { ChangePasswordModal } from "@/components/Users/ChangePasswordModal";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [login] = useLoginMutation();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: string; title: string; message: string; email?: string } | null>(null);

  const [particles, setParticles] = useState<Array<{ x: number; y: number; size: number; duration: number }>>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('toast_message');
    if (stored) {
      setToast(JSON.parse(stored));
      sessionStorage.removeItem('toast_message');
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
    }));
    setParticles(newParticles);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
   // src/routes/login.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;

  setIsLoading(true);
  setErrors({});

  try {
    const result = await login({
      username: formData.email,
      password: formData.password,
    }).unwrap();
      // ✅ Vérifier que les données existent
    if (!result.access || !result.user) {
      throw new Error("Réponse invalide");
    }
    // ✅ STOCKER DANS LOCALSTORAGE (APRÈS LA RÉPONSE)
    localStorage.setItem('access_token', result.access);
    localStorage.setItem('refresh_token', result.refresh);
    localStorage.setItem('user', JSON.stringify(result.user));

    // ✅ Si la réponse contient non_field_errors (compte en attente, etc.)
    if (result.non_field_errors && result.non_field_errors.length > 0) {
      setErrors({ general: result.non_field_errors[0] });
      setIsLoading(false);
      return;
    }
    
    // Connexion réussie
    if (result.doit_changer_mot_de_passe) {
      setShowChangePasswordModal(true);
      return;
    }
    
    dispatch(setCredentials({
      user: result.user,
      accessToken: result.access,
      refreshToken: result.refresh,
    }));
    const roleRedirects: Record<string, string> = {
      consultant: "/app/taches",
      client:     "/app/documents",
    };
    const destination = roleRedirects[result.user?.role] ?? "/app";
    navigate({ to: destination });
    
  } catch (err: any) {
    // ✅ Gérer les erreurs HTTP (400, 401, etc.)
    if (err.data?.non_field_errors) {
      setErrors({ general: err.data.non_field_errors[0] });
    } else if (err.data?.detail) {
      setErrors({ general: err.data.detail });
    } else {
      setErrors({ general: "Email ou mot de passe incorrect" });
    }
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white relative overflow-hidden">
      
      {toast && (
        <div className="fixed top-24 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="rounded-xl bg-white shadow-2xl border border-red-100 p-4 w-96">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{toast.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
                {toast.email && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">{toast.email}</p>
                )}
              </div>
              <button 
                onClick={() => setToast(null)}
                aria-label="Fermer la notification"
                className="text-gray-400 hover:text-gray-600 transition h-6 w-6 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full animate-progress" style={{ animationDuration: '5s' }} />
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-red-200/40 dark:bg-red-300/20"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `float ${p.duration}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>

      <div className="absolute top-0 -left-40 w-80 h-80 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-40 w-80 h-80 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-20 w-80 h-80 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl w-full mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Section gauche - Branding */}
            <div className="hidden lg:flex flex-col justify-center space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  Plateforme nouvelle génération
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
                  RAMAQS Consulting
                </h1>
                <p className="text-lg text-gray-600">
                  Centralisez, pilotez et automatisez vos projets avec intelligence
                </p>
              </div>

              <div className="space-y-3">
                {[
                  "Centralisation des données projets",
                  "Suivi en temps réel (coût, délai, qualité)",
                  "IA prédictive et recommandations",
                  "Collaboration fluide équipes internes/externes",
                  "Tableaux de bord personnalisables",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <div className="h-7 w-7 rounded-full bg-red-50 flex items-center justify-center group-hover:scale-110 transition">
                      <CheckCircle className="h-3.5 w-3.5 text-red-600" />
                    </div>
                    <span className="text-gray-600 group-hover:text-gray-900 transition text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">100+</p>
                  <p className="text-xs text-gray-500">Projets livrés</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">50+</p>
                  <p className="text-xs text-gray-500">Clients satisfaits</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">98%</p>
                  <p className="text-xs text-gray-500">Taux de succès</p>
                </div>
              </div>
            </div>

            {/* Section droite - Formulaire (ajusté pour alignement vertical) */}
            <div className="w-full max-w-md mx-auto lg:max-w-none lg:mt-0">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 md:p-8 animate-in fade-in slide-in-from-right-8 duration-500">
                
                {/* Logo mobile */}
                <div className="lg:hidden flex justify-center mb-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">R</span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Bienvenue</h2>
                  <p className="text-gray-500 mt-1">Connectez-vous à votre compte</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email professionnel
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="login-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? "login-email-error" : undefined}
                        placeholder="utilisateur@example.com"
                        className={`w-full h-10 pl-10 pr-3 rounded-lg border ${
                          errors.email 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 focus:ring-red-500'
                        } bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-sm`}
                      />
                    </div>
                    {errors.email && (
                      <p id="login-email-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                        Mot de passe
                      </label>
                      <Link 
                        to="/forgot-password" 
                        className="text-xs text-red-600 hover:text-red-700 hover:underline transition"
                      >
                        Mot de passe oublié ?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={errors.password ? "login-password-error" : undefined}
                        placeholder="••••••••"
                        className={`w-full h-10 pl-10 pr-10 rounded-lg border ${
                          errors.password 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 focus:ring-red-500'
                        } bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-sm`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        aria-pressed={showPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p id="login-password-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.password}
                      </p>
                    )}
                  </div>

                  {errors.general && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errors.general}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-10 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        Se connecter <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-5">
                  Pas encore de compte ?{" "}
                  <Link to="/register" className="text-red-600 font-medium hover:underline">
                    Créer un compte
                  </Link>
                </p>

                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Building2 className="h-3 w-3" />
                    <span>Plateforme RAMAQS Consulting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(0px) translateX(20px); }
          75% { transform: translateY(20px) translateX(10px); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes progress {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-progress { animation: progress linear forwards; }
      `}</style>
       {showChangePasswordModal && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => {
            setShowChangePasswordModal(false);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            navigate({ to: "/login" });
          }}
          onSuccess={() => {
            setShowChangePasswordModal(false);
            window.location.href = "/app";
          }}
        />
      )}
    </div>
  );
}
