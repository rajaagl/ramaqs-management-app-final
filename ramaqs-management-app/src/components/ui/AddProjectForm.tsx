import { useState } from "react";
import { X } from "lucide-react";
import { useCreateProjetMutation } from "../../store/api/api";
import type { Projet } from "../../store/interfaces";

interface AddProjectFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddProjectForm({ onClose, onSuccess }: AddProjectFormProps) {
  const [createProjet, { isLoading, error }] = useCreateProjetMutation();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    client: "",
    manager: "",
    statut: "planifie" as Projet['statut'],
    priorite: "normale" as Projet['priorite'],
    progress: 0,
    Budget: 0,
    spent: 0,
    domain: "IA",
    health: "sain" as Projet['health'],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs requis
    if (!formData.name) {
      alert("Le nom du projet est requis");
      return;
    }
    
    try {
      const projetData = {
        name: formData.name,
        description: formData.description,
        code: formData.code,
        client: formData.client,
        manager: formData.manager,
        statut: formData.statut,
        priorite: formData.priorite,
        progress: Number(formData.progress),
        Budget: Number(formData.Budget),
        spent: Number(formData.spent),
        domain: formData.domain,
        health: formData.health,
      };
      
      console.log("Envoi des données:", projetData);
      
      const result = await createProjet(projetData).unwrap();
      
      console.log("Projet créé avec succès:", result);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erreur lors de la création:", err);
      alert("Erreur lors de la création du projet. Vérifiez la console.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold">Nouveau projet</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Nom du projet */}
          <div>
            <label className="block text-sm font-medium mb-1">Nom du projet *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Refonte ERP"
            />
          </div>

          {/* Code et Client */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code projet</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: PRJ-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client</label>
              <input
                type="text"
                name="client"
                value={formData.client}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nom du client"
              />
            </div>
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
              placeholder="Description du projet..."
            />
          </div>

          {/* Manager et Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Manager</label>
              <input
                type="text"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Chef de projet"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="en_cours">En cours</option>
                <option value="planifie">Planifié</option>
                <option value="en_pause">En pause</option>
                <option value="termine">Terminé</option>
                <option value="a_risque">À risque</option>
              </select>
            </div>
          </div>

          {/* Domaine et Priorité */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Domaine</label>
              <select
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Transformation digitale">Transformation digitale</option>
                <option value="IA">IA</option>
                <option value="Industrie 4.0">Industrie 4.0</option>
                <option value="Conseil & formation">Conseil & formation</option>
              </select>
            </div>
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
          </div>

          {/* Budget et Consommé */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Budget (€)</label>
              <input
                type="number"
                name="Budget"
                value={formData.Budget}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Consommé (€)</label>
              <input
                type="number"
                name="spent"
                value={formData.spent}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0"
              />
            </div>
          </div>

          {/* Santé et Avancement */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Santé projet</label>
              <select
                name="health"
                value={formData.health}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="sain">Sain</option>
                <option value="vigilant">Vigilant</option>
                <option value="critique">Critique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Avancement (%)</label>
              <input
                type="range"
                name="progress"
                value={formData.progress}
                onChange={handleChange}
                min={0}
                max={100}
                className="w-full"
              />
              <div className="text-right text-sm text-muted-foreground">{formData.progress}%</div>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="text-red-500 text-sm text-center">
              Erreur: {JSON.stringify(error)}
            </div>
          )}

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
              {isLoading ? "Création..." : "Créer le projet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}