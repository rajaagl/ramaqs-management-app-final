import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Eye, EyeOff, ArrowRight, Mail, Lock, User, Building2, 
  Phone, CheckCircle, AlertCircle, Sparkles, Briefcase, 
  Calendar, Shield, Users, Target, Award, Zap, Loader2
} from "lucide-react";
import { useRegisterMutation } from "../store/api/api";
import { API_BASE_URL } from "../config/endpoints";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: "",
    role: "consultant",
    entreprise: "",
    poste: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [register, { isLoading }] = useRegisterMutation();

  const [particles, setParticles] = useState<Array<{ x: number; y: number; size: number; duration: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
    }));
    setParticles(newParticles);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nom) newErrors.nom = "Le nom est requis";
    if (!formData.email) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email invalide";
    // ✅ AJOUTER CETTE VALIDATION POUR LE TÉLÉPHONE
    if (!formData.telephone) {
     newErrors.telephone = "Le numéro de téléphone est requis";
    } else if (formData.telephone.length < 9) {
    newErrors.telephone = "Numéro de téléphone invalide (9 chiffres minimum)";
    }
    if (!formData.role) newErrors.role = "Le rôle est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.password) newErrors.password = "Le mot de passe est requis";
    else if (formData.password.length < 8) newErrors.password = "8 caractères minimum";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Confirmez votre mot de passe";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

   // src/routes/register.tsx - Version complète avec commentaires détaillés

  // src/routes/register.tsx - Modifiez handleSubmit

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateStep2()) return;
  
  try {
    // ✅ TOUS LES RÔLES (sauf direction) utilisent le même endpoint
    // Le backend déterminera le workflow en fonction du rôle
    const response = await fetch(`${API_BASE_URL}/users/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nom: formData.nom,
        email: formData.email,
        telephone: formData.telephone,
        entreprise: formData.entreprise,
        poste: formData.poste,
        role: formData.role,  // chef_projet, consultant, partenaire, client
        password: formData.password,        // ✅ AJOUTER CETTE LIGNE
        confirmPassword: formData.confirmPassword  // Optionnel
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de l'inscription");
    }
    
    // ✅ Message de succès (toujours "en attente d'approbation")
    const roleLabels: Record<string, string> = {
      chef_projet: "Chef de projet",
      consultant: "Consultant",
      partenaire: "Partenaire",
      client: "Client"
    };
    
    sessionStorage.setItem('toast_message', JSON.stringify({
      type: 'success',
      title: 'Demande envoyée !',
      message: `Votre demande d'inscription en tant que ${roleLabels[formData.role] || formData.role} a été envoyée. Vous recevrez un email une fois votre compte approuvé par la direction.`,
      email: formData.email
    }));
    
    navigate({ to: "/login" });
    
  } catch (err: any) {
    console.error("❌ Erreur:", err);
    setErrors({ general: err.message || "Erreur lors de l'inscription" });
  }
};
  const roles = [
    { value: "chef_projet", label: "Chef de projet", icon: Target, description: "Gestion opérationnelle des projets" },
    { value: "consultant", label: "Consultant", icon: Users, description: "Exécution des missions terrain" },
    { value: "client", label: "Client", icon: Building2, description: "Suivi des projets et livrables" },
    { value: "partenaire", label: "Partenaire", icon: Briefcase, description: "Collaboration externe" },
  ];

  const features = [
    { icon: Zap, title: "Centralisation", desc: "Tous les projets au même endroit" },
    { icon: Shield, title: "Sécurité", desc: "Données chiffrées et isolées" },
    { icon: Calendar, title: "Planning", desc: "Gestion des délais en temps réel" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white relative overflow-hidden">
      
      {/* Particules */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <div key={i} className="absolute rounded-full bg-red-200/40" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, animation: `float ${p.duration}s infinite ease-in-out` }} />
        ))}
      </div>

      {/* Dégradés rouge/blanc */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-40 w-80 h-80 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-20 w-80 h-80 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative min-h-screen flex items-center justify-center p-4 py-12">
        <div className="max-w-5xl w-full mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Section gauche - Branding */}
            <div className="hidden lg:flex flex-col justify-center space-y-6 p-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-medium w-fit">
                <Sparkles className="h-4 w-4" />
                Rejoignez RAMAQS
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
                Créez votre compte
              </h1>
              <p className="text-lg text-gray-600">
                Accédez à la plateforme de pilotage de projets nouvelle génération
              </p>

              <div className="space-y-3 pt-4">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{feature.title}</p>
                      <p className="text-sm text-gray-500">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-red-600" /> Sécurisé</span>
                  <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-red-600" /> RGPD</span>
                  <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-red-600" /> Support 24/7</span>
                </div>
              </div>
            </div>

            {/* Section droite - Formulaire */}
            <div className="w-full max-w-md mx-auto lg:max-w-none">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 md:p-8 animate-in fade-in slide-in-from-right-8 duration-500">
                
                {/* Logo mobile */}
                <div className="lg:hidden flex justify-center mb-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">R</span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Inscription</h2>
                  <p className="text-gray-500 mt-1">Créez votre compte en quelques minutes</p>
                </div>

                {/* Progress steps */}
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${currentStep >= step ? "bg-red-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                        {currentStep > step ? <CheckCircle className="h-4 w-4" /> : step}
                      </div>
                      {step < 2 && <div className={`w-12 h-0.5 mx-1 transition-all ${currentStep > step ? "bg-red-600" : "bg-gray-200"}`} />}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit}>
                  {currentStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {/* Nom */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            placeholder="Nom et Prénom"
                            className={`w-full h-10 pl-10 pr-3 rounded-lg border ${errors.nom ? 'border-red-500' : 'border-gray-200'} bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-sm`}
                          />
                        </div>
                        {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Utilisateur@exemple.com"
                            className={`w-full h-10 pl-10 pr-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-200'} bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-sm`}
                          />
                        </div>
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                      </div>

                      {/* Téléphone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone<span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="tel"
                            name="telephone"
                            value={formData.telephone}
                            onChange={handleChange}
                            placeholder="+112 6 12 34 56 78"
                            required  // ← AJOUTER required
                            className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-sm"
                          />
                           
                               {errors.telephone && (
                               <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>
                                )}
                            
                        </div>
                      </div>
                      {/* Rôle */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rôle <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/50 appearance-none cursor-pointer text-sm"
                          >
                            {roles.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                        {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
                      </div>

                      {/* Description du rôle */}
                      <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium text-red-600">{roles.find(r => r.value === formData.role)?.label}</span> :{" "}
                          {roles.find(r => r.value === formData.role)?.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleNext}
                        className="w-full h-10 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                      >
                        Continuer <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {/* Mot de passe */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className={`w-full h-10 pl-10 pr-10 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-200'} bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-sm`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
            
                          </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                      </div>

                      {/* Confirmation mot de passe */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className={`w-full h-10 pl-10 pr-10 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-sm`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            
                          </button>
                        </div>
                        {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                      </div>

                      {/* Entreprise et Poste (optionnel) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
                          <input
                            type="text"
                            name="entreprise"
                            value={formData.entreprise}
                            onChange={handleChange}
                            placeholder="Votre entreprise"
                            className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
                          <input
                            type="text"
                            name="poste"
                            value={formData.poste}
                            onChange={handleChange}
                            placeholder="Votre poste"
                            className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm"
                          />
                        </div>
                      </div>

                      {errors.general && (
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.general}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleBack}
                          className="flex-1 h-10 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all text-sm"
                        >
                          Retour
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 h-10 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                        >
                          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "S'inscrire"}
                        </button>
                      </div>
                    </div>
                  )}
                </form>

                {/* Lien connexion */}
                <p className="text-center text-sm text-gray-500 mt-5">
                  Déjà un compte ?{" "}
                  <Link to="/login" className="text-red-600 font-medium hover:underline">
                    Se connecter
                  </Link>
                </p>
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
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
