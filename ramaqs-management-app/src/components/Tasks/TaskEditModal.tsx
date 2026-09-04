// src/components/Tasks/TaskEditModal.tsx

import { useState, useEffect } from "react";
import { X, Save, Loader2, Users, Briefcase, Calendar, Flag, AlertCircle, Clock, CheckCircle, XCircle, Info } from "lucide-react";
import { usePatchTacheMutation, useGetConsultantsQuery, useGetProjetsQuery } from "../../store/api/api";
import { useAppSelector } from "../../store/store";

interface TaskEditModalProps {
  task: any;
  onClose: () => void;
  onSuccess: () => void;
}

type UserRole = 'direction' | 'chef_projet' | 'consultant' | 'client' | 'partenaire';
type TaskStatus = 'a_faire' | 'en_cours' | 'en_attente_validation' | 'termine';
type TaskPriority = 'faible' | 'normale' | 'haute' | 'critique';

export function TaskEditModal({ task, onClose, onSuccess }: TaskEditModalProps) {
  const { user } = useAppSelector((state) => state.auth);
  const userRole = user?.role as UserRole;
  const [patchTache, { isLoading }] = usePatchTacheMutation();
  
  const { data: consultantsData, isLoading: consultantsLoading } = useGetConsultantsQuery({ page: 1, pageSize: 100 });
  const { data: projetsData, isLoading: projetsLoading } = useGetProjetsQuery({ page: 1, pageSize: 100 });
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normale" as TaskPriority,
    status: "a_faire" as TaskStatus,
    avancement: 0,
    dateEcheance: "",
    projetId: "",
    assigneA: "",
    assigneNom: "",
  });
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [showValidationInfo, setShowValidationInfo] = useState(false);
  
  const projects = Array.isArray(projetsData) ? projetsData : (projetsData?.results || []);
  const consultants = Array.isArray(consultantsData) ? consultantsData : (consultantsData?.results || []);
  
  // ✅ PERMISSIONS PAR RÔLE
  const permissions = {
    canEditTitle: userRole === 'direction' || userRole === 'chef_projet',
    canEditDescription: userRole === 'direction' || userRole === 'chef_projet',
    canEditPriority: userRole === 'direction' || userRole === 'chef_projet'||userRole === 'consultant',
    canEditStatus: true,
    canEditAvancement: true,
    canEditDateEcheance: userRole === 'direction' || userRole === 'chef_projet',
    canEditProjet: userRole === 'direction',
    canEditConsultant: (userRole === 'direction' || userRole === 'chef_projet') && task?.status !== 'termine',
    canValidateTask: userRole === 'direction' || userRole === 'chef_projet',
  };
  
  useEffect(() => {
    if (task) {
      console.log(" Initialisation tâche:", task);
      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: (task.priority as TaskPriority) || "normale",
        status: (task.status as TaskStatus) || "a_faire",
        avancement: task.avancement || 0,
        dateEcheance: task.dateEcheance || "",
        projetId: task.projetId || "",
        assigneA: task.assigneA || "",
        assigneNom: task.assigneNom || "",
      });
      
      // ✅ Vérifier si la tâche est en attente de validation
      if (task.status === 'en_attente_validation') {
        setShowValidationInfo(true);
      }
    }
  }, [task]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'dateEcheance') {
      const today = new Date().toISOString().split('T')[0];
      if (value < today) {
        setDateError("La date d'échéance ne peut pas être antérieure à aujourd'hui");
      } else {
        setDateError(null);
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage(null);
  };
  
  // ✅ Gestion de l'avancement avec validation automatique
  const handleAvancementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    
    // ✅ Si consultant met avancement à 100% → demande validation
    if (userRole === 'consultant' && value === 100 && formData.status !== 'termine') {
      setShowValidationInfo(true);
      setFormData(prev => ({ 
        ...prev, 
        avancement: value, 
        status: 'en_attente_validation' 
      }));
    } else {
      setShowValidationInfo(false);
      setFormData(prev => ({ ...prev, avancement: value }));
    }
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
  
  // ✅ Approuver la tâche
  const handleApproveTask = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/taches/${task.id}/approuver_validation/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Erreur lors de l'approbation");
      }
    } catch (error) {
      setErrorMessage("Erreur lors de l'approbation");
    }
  };
  
  // ✅ Rejeter la tâche
  const handleRejectTask = async () => {
    const justification = prompt("Motif du rejet :");
    if (justification === null) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/taches/${task.id}/rejeter_validation/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ justification }),
      });
      
      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Erreur lors du rejet");
      }
    } catch (error) {
      setErrorMessage("Erreur lors du rejet");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setErrorMessage("Le titre est requis");
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (formData.dateEcheance && formData.dateEcheance < today) {
      setErrorMessage("La date d'échéance ne peut pas être antérieure à aujourd'hui");
      return;
    }
    
    const payload: any = {};
    // ✅ Définir les champs autorisés pour chaque rôle
  const allowedFields = userRole === 'consultant' 
    ? ['statut', 'priorite', 'avancement']  // Consultant : seulement 3 champs
    : ['titre', 'description', 'priorite', 'statut', 'avancement', 'date_fin_prevue', 'projet', 'consultant']; // Direction/Chef : tous les champs
  
  // ✅ Construire le payload
  const fieldMapping: Record<string, string> = {
    title: 'titre',
    description: 'description',
    priority: 'priorite',
    status: 'statut',
    avancement: 'avancement',
    dateEcheance: 'date_fin_prevue',
    projetId: 'projet',
    assigneA: 'consultant',
  };
  
  Object.entries(fieldMapping).forEach(([frontKey, backKey]) => {
    if (allowedFields.includes(backKey)) {
      const frontValue = formData[frontKey as keyof typeof formData];
      const taskValue = task[frontKey as keyof typeof task];
      if (frontValue !== taskValue) {
        payload[backKey] = frontValue;
      }
    }
  });
  
  console.log("📤 Payload envoyé:", payload);
    if (Object.keys(payload).length === 0) {
      setErrorMessage("Aucune modification détectée");
      return;
    }
    
    try {
      await patchTache({ id: task.id, data: payload }).unwrap();
      onSuccess();
    } catch (error: any) {
      console.error("❌ Erreur:", error);
      setErrorMessage(error?.data?.message || "Erreur lors de la modification");
    }
  };
  
  const getStatusLabel = (status: string) => {
    const labels = { 
      a_faire: "À faire", 
      en_cours: "En cours", 
      en_attente_validation: "⏳ En attente de validation",
      termine: "✅ Terminé" 
    };
    return labels[status as keyof typeof labels] || status;
  };
  
  const getPriorityLabel = (priority: string) => {
    const labels = { faible: "Faible", normale: "Normale", haute: "Haute", critique: "Critique" };
    return labels[priority as keyof typeof labels] || priority;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* ✅ EN-TÊTE ROUGE */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 z-10 flex items-center justify-between p-5 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white">Modifier la tâche</h2>
            <p className="text-sm text-white/80 mt-0.5">
              {userRole === 'direction' && " Accès complet"}
              {userRole === 'chef_projet' && " Accès limité"}
              {userRole === 'consultant' && " Accès limité "}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errorMessage}
            </div>
          )}
          
          {/* ✅ BANNIÈRE D'ATTENTE DE VALIDATION */}
          {showValidationInfo && task.status === 'en_attente_validation' && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-start gap-3">
              <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">⏳ En attente de validation</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Cette tâche a été marquée comme terminée par le consultant et attend l'approbation du chef de projet.
                </p>
                {permissions.canValidateTask && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleApproveTask}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approuver
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectTask}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* ✅ Indicateur pour consultant qui met à 100% */}
          {userRole === 'consultant' && formData.avancement === 100 && !showValidationInfo && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              La tâche sera soumise pour validation au chef de projet.
            </div>
          )}
          
          {/* Titre */}
          {permissions.canEditTitle ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
                {formData.title}
              </div>
            </div>
          )}
          
          {/* Description */}
          {permissions.canEditDescription && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
              />
            </div>
          )}
          
          {/* Projet */}
          {permissions.canEditProjet && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Projet</label>
              <select
                name="projetId"
                value={formData.projetId}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
              >
                <option value="">Sélectionner un projet</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.nom || p.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Priorité et Statut */}
          <div className="grid grid-cols-2 gap-4">
            {permissions.canEditPriority ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
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
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
                  {getPriorityLabel(formData.priority)}
                </div>
              </div>
            )}
            
            {permissions.canEditStatus ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
                >
                  <option value="a_faire">À faire</option>
                  <option value="en_cours">En cours</option>
                  {(userRole === 'direction' || userRole === 'chef_projet') && (
                    <option value="en_attente_validation">⏳ En attente de validation</option>
                  )}
                  <option value="termine">Terminé</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
                  {getStatusLabel(formData.status)}
                  {task.status === 'en_attente_validation' && (
                    <span className="ml-2 text-xs text-amber-600">(En attente de validation)</span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Date et Avancement */}
          <div className="grid grid-cols-2 gap-4">
            {permissions.canEditDateEcheance ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                <input
                  type="date"
                  name="dateEcheance"
                  value={formData.dateEcheance}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-red-500/50 outline-none ${dateError ? 'border-red-500' : 'border-gray-200'}`}
                />
                {dateError && <p className="text-xs text-red-500 mt-1">{dateError}</p>}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
                  {formData.dateEcheance ? new Date(formData.dateEcheance).toLocaleDateString("fr-FR") : "Non définie"}
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avancement (%)</label>
              <input
                type="range"
                name="avancement"
                min="0"
                max="100"
                value={formData.avancement}
                onChange={handleAvancementChange}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 mt-1">{formData.avancement}%</div>
              {task.status === 'en_attente_validation' && (
                <p className="text-center text-xs text-amber-600 mt-0.5">⏳ En attente de validation</p>
              )}
            </div>
          </div>
          
          {/* Assignation consultant */}
          {permissions.canEditConsultant ? (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-red-600" />
                Assignation
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultant assigné</label>
                <select
                  value={formData.assigneA}
                  onChange={handleConsultantChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
                >
                  <option value="">Non assigné</option>
                  {consultants.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
                {formData.assigneNom && (
                  <p className="text-xs text-green-600 mt-1">✓ Assigné à : {formData.assigneNom}</p>
                )}
              </div>
            </div>
          ) : task?.status === 'termine' ? (
            <div className="border-t border-gray-100 pt-4 bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                La tâche est terminée, le consultant ne peut plus être modifié.
              </p>
              <div className="mt-2 text-sm text-gray-700">
                Consultant : <strong>{formData.assigneNom || "Non assigné"}</strong>
              </div>
            </div>
          ) : null}
          
          {/* Boutons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || projetsLoading || consultantsLoading || task.status === 'en_attente_validation'}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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