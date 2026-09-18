// src/components/Tasks/TaskAddModal.tsx
import { useState, useEffect, useRef } from "react";
import { X, Save, Loader2, Users, Briefcase, Calendar, Flag, AlertCircle, Plus, UserCheck, Clock, CheckCircle } from "lucide-react";
import { 
  useCreateTacheMutation, 
  useGetProjetsQuery, 
  useGetConsultantsQuery  // ← Utiliser ce hook
} from "../../store/api/api";
import { useAppSelector } from "../../store/store";

interface TaskAddModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type TaskStatus = 'a_faire' | 'en_cours' | 'termine';
type TaskPriority = 'faible' | 'normale' | 'haute' | 'critique';
type UserRole = 'direction' | 'chef_projet' | 'consultant' | 'client' | 'partenaire';

export function TaskAddModal({ onClose, onSuccess }: TaskAddModalProps) {
  const { user } = useAppSelector((state) => state.auth);
  const userRole = user?.role as UserRole;
  const hasSubmitted = useRef(false); // ← Ajouter ce ref pour tracker

  const [createTache, { isLoading }] = useCreateTacheMutation();
  const { data: projetsData, isLoading: projetsLoading } = useGetProjetsQuery({ page: 1, pageSize: 100 });
  
  // ✅ Remplacer useGetRessourcesQuery par useGetConsultantsQuery
  const { data: consultantsData, isLoading: consultantsLoading } = useGetConsultantsQuery({ page: 1 });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normale" as TaskPriority,
    status: "a_faire" as TaskStatus,
    avancement: 0,
    dateEcheance: new Date().toISOString().split('T')[0],
    projetId: "",
    assigneA: "",
    assigneNom: "",
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Projets
  const allProjects = Array.isArray(projetsData) ? projetsData : (projetsData?.results || []);
  
  const filteredProjects = allProjects.filter((p: any) => {
    if (userRole === 'direction') return true;
    if (userRole === 'chef_projet') return p.chefProjetId === user?.id || p.chef_projet === user?.id;
    return false;
  });

  // ✅ Consultants - récupérés depuis /api/consultants/
  const consultants = Array.isArray(consultantsData) ? consultantsData : (consultantsData?.results || []);
  

  const canAddTask = userRole === 'direction' || userRole === 'chef_projet';

  useEffect(() => {
    if (!canAddTask) {
      setErrorMessage("Vous n'avez pas les droits pour créer une tâche");
      setTimeout(() => onClose(), 1500);
    }
  }, [canAddTask, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'avancement' ? Number(value) : value }));
    setErrorMessage(null);
  };

  const handleConsultantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedConsultant = consultants.find((c: any) => c.id === selectedId);
    setFormData(prev => ({
      ...prev,
      assigneA: selectedId,
      assigneNom: selectedConsultant?.nom || "",
    }));
  };
  const [isSubmitting, setIsSubmitting] = useState(false); // ← Ajouter cet état

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     
  //  Log unique pour chaque soumission
  const submitId = Math.random().toString(36);
  
     //  Empêcher les doubles soumissions
  if (isSubmitting || isLoading) {
    return;
  }
  if (isSubmitting || hasSubmitted.current) {
      return;
    }
    
    hasSubmitted.current = true;
  
  setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.title.trim()) {
      setErrorMessage("Le titre est requis");
      return;
    }
    if (!formData.projetId) {
      setErrorMessage("Veuillez sélectionner un projet");
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage("La description est requise");
      return;
    }
    if (!formData.dateEcheance) {
      setErrorMessage("La date d'échéance est requise");
      return;
    }

    //  Payload pour Django
    const payload: any = {
      titre: formData.title.trim(),
      description: formData.description.trim(),
      priorite: formData.priority,
      avancement: formData.avancement,
      date_debut: new Date().toISOString().split('T')[0],
      date_fin_prevue: formData.dateEcheance,
      statut: formData.status === 'en_cours' ? 'en cours' : formData.status,
      projet: formData.projetId,
    };

    // Ajouter le consultant seulement si sélectionné
    if (formData.assigneA) {
      payload.consultant = formData.assigneA;
    }

    

    try {
      const result = await createTache(payload).unwrap();
      
      setSuccessMessage("Tâche créée avec succès !");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      
      if (error?.data) {
        const errors = error.data as Record<string, string | string[]>;
        const firstValue = Object.values(errors)[0];
        const firstError = Array.isArray(firstValue) ? firstValue[0] : firstValue;
        setErrorMessage(firstError || "Erreur lors de la création");
        hasSubmitted.current = false; // ← Réinitialiser en cas d'erreur
      } else {
        setErrorMessage("Erreur lors de la création");
      }
    }
  };
  const handleClose = () => {
    hasSubmitted.current = false;
    setIsSubmitting(false);
    onClose();
  };
  const statusLabel = { a_faire: "À faire", en_cours: "En cours", termine: "Terminé" };
  const priorityLabel = { faible: "Faible", normale: "Normale", haute: "Haute", critique: "Critique" };

  if (!canAddTask) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white z-10 rounded-t-2xl">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Nouvelle tâche</h2>
                <p className="text-sm text-white/80 mt-0.5">
                  {userRole === 'direction' && " Création complète"}
                  {userRole === 'chef_projet' && "Création pour vos projets"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {successMessage && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="h-4 w-4" />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errorMessage}
            </div>
          )}

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Développer l'API d'authentification"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 focus:border-red-300 outline-none transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Décrivez la tâche en détail..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none transition resize-none"
            />
          </div>

          {/* Projet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Projet <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              {projetsLoading ? (
                <div className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
                  Chargement des projets...
                </div>
              ) : (
                <select
                  name="projetId"
                  value={formData.projetId}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none appearance-none bg-white"
                  required
                >
                  <option value="">Sélectionner un projet</option>
                  {filteredProjects.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.nom || p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Priorité et Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Flag className="h-4 w-4" /> Priorité
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
              >
                <option value="faible">Faible</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="critique">Critique</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Clock className="h-4 w-4" /> Statut
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
              >
                <option value="a_faire">À faire</option>
              </select>
            </div>
          </div>

          {/* Date échéance et Avancement */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Date d'échéance
              </label>
              <input
                type="date"
                name="dateEcheance"
                value={formData.dateEcheance}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}  // Désactive toutes les dates avant aujourd'hui
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avancement initial — {formData.avancement}%
              </label>
              <input
                type="range"
                name="avancement"
                min="0"
                max="100"
                value={formData.avancement}
                onChange={handleChange}
                className="w-full"
              />
              <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all"
                  style={{ width: `${formData.avancement}%` }} />
              </div>
            </div>
          </div>

          {/* Assignation consultant */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-red-600" />
              Assignation
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultant assigné</label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={formData.assigneA}
                  onChange={handleConsultantChange}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none appearance-none bg-white"
                >
                  <option value="">Non assigné</option>
                  {consultants.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>
              {formData.assigneNom && (
                <p className="text-xs text-green-600 mt-1">✓ Assigné à : {formData.assigneNom}</p>
              )}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || projetsLoading || consultantsLoading||isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isLoading ? "Création en cours..." : "Créer la tâche"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
