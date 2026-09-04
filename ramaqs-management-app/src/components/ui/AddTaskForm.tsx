import { useState } from "react";
import { X } from "lucide-react";
import { useCreateTacheMutation, useGetProjetsQuery } from "../../store/api/api";
import { useAppDispatch } from "../../store/store";
import type { Tache } from "../../store/interfaces";
interface AddTaskFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTaskForm({ onClose, onSuccess }: AddTaskFormProps) {
  const dispatch = useAppDispatch();
  const [createTache, { isLoading }] = useCreateTacheMutation();
  const { data: projetsData } = useGetProjetsQuery({ page: 1, pageSize: 100 });
  
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    priorite: "normale" as Tache['priority'],
    statut: "a_faire" as Tache['status'],
    projetId: "",
    assigneA: "",
    dateEcheance: "",
    avancement: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Appel API via RTK Query
      const result = await createTache({
        title: formData.titre,
        description: formData.description,
        priority: formData.priorite,
        status: formData.statut,
        projectId: formData.projetId,
        assigneA: formData.assigneA || undefined,
        dueDate: formData.dateEcheance,
        progress: formData.avancement,
      }).unwrap();
      
      console.log("Tâche créée avec succès:", result);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Nouvelle tâche</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium mb-1">Titre *</label>
            <input
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Développer le dashboard"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Description détaillée de la tâche..."
            />
          </div>

          {/* Projet */}
          <div>
            <label className="block text-sm font-medium mb-1">Projet *</label>
            <select
              name="projetId"
              value={formData.projetId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner un projet</option>
               {projetsData?.results && projetsData.results.length > 0 ? (
                 projetsData.results.map((projet: any) => (
               <option key={projet.id} value={projet.id}>
                   {projet.name || projet.nom || "—"}
                  </option>
                ))
               ) : (
                  <option value="" disabled>Aucun projet disponible</option>
    )}
            </select>
          </div>

          {/* Priorité et Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priorité</label>
              <select
                name="priorite"
                value={formData.priorite}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="faible">Faible</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="critique">Critique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
          </div>

          {/* Assigné à et Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Assigné à (ID)</label>
              <input
                type="text"
                name="assigneA"
                value={formData.assigneA}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="ID du consultant"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date échéance</label>
              <input
                type="date"
                name="dateEcheance"
                value={formData.dateEcheance}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Avancement */}
          <div>
            <label className="block text-sm font-medium mb-1">Avancement (%)</label>
            <input
              type="range"
              name="avancement"
              value={formData.avancement}
              onChange={handleChange}
              min={0}
              max={100}
              className="w-full"
            />
            <div className="text-right text-sm text-muted-foreground">{formData.avancement}%</div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
            >
              {isLoading ? "Création..." : "Créer la tâche"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}