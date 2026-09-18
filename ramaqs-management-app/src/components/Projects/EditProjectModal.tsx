// src/components/Projects/EditProjectModal.tsx

import { useState, useEffect } from "react";
import {
  X, Save, Loader2, AlertCircle, CheckCircle, Briefcase, DollarSign,
  Calendar, Users, User, Target, Trash2, UserPlus,
} from "lucide-react";
import {
  useUpdateProjetMutation,
  useGetProjetByIdQuery,   // ✅ récupère les données BRUTES du projet (pas la version allégée de la liste)
  useGetClientsQuery,
  useGetChefsProjetQuery,
  useGetPartenairesQuery,
} from "../../store/api/api";
import type { Projet, Utilisateur, Partenaire } from "../../store/interfaces";
import { normalizeProjectDomains, PROJECT_DOMAINS } from "../../constants/projectDomains";

interface EditProjectModalProps {
  project: Projet;           // ✅ on garde la prop pour l'id + l'affichage immédiat du header
  onClose: () => void;
  onSuccess: () => void;
}

type ProjectStatus = 'planifie' | 'en_cours' | 'termine' | 'en_pause' | 'a_risque';

// ───────────────────────────────────────────────────────────────
// Helpers de normalisation : le GET (lecture) renvoie souvent des
// objets imbriqués ({id, nom, email}) alors que le PUT (écriture)
// attend uniquement l'ID. On gère les deux cas partout.
// ───────────────────────────────────────────────────────────────
function extractId(value: any): string {
  if (!value) return "";
  return typeof value === "object" ? value.id : value;
}

function extractIdArray(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => (typeof v === "object" ? v.id : v)).filter(Boolean);
}

function toDateInput(value: any): string {
  if (!value) return "";
  // Déjà au format YYYY-MM-DD
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function EditProjectModal({ project, onClose, onSuccess }: EditProjectModalProps) {
  const [updateProjet, { isLoading: isSaving }] = useUpdateProjetMutation();

  // ✅ FIX PRINCIPAL : on va chercher le projet COMPLET en base,
  // au lieu de se fier au `project` (version allégée venant de la liste).
  const {
    data: projetDetail,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useGetProjetByIdQuery(project.id);

  const { data: clientsData, isLoading: clientsLoading } = useGetClientsQuery({ page: 1, pageSize: 100 });
  const { data: chefsData, isLoading: chefsLoading } = useGetChefsProjetQuery({ page: 1, pageSize: 100 });
  const { data: partenairesData, isLoading: partenairesLoading } = useGetPartenairesQuery({ page: 1, pageSize: 100 });

  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    objectsif: "",
    statut: "planifie" as ProjectStatus,
    budget: 0,
    client: "",
    clientId: "",
    code: "",
    domaine: [] as string[],
    date_debut: "",
    date_fin_prevue: "",
    chef_projet: [] as string[],
    partenaires: [] as string[],
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isFormReady, setIsFormReady] = useState(false); // évite de flasher un formulaire vide

  const clients = Array.isArray(clientsData) ? clientsData : (clientsData?.results || []);
  const chefsProjet = Array.isArray(chefsData) ? chefsData : (chefsData?.results || []);
  const partenaires = Array.isArray(partenairesData) ? partenairesData : (partenairesData?.results || []);

  // ✅ Pré-remplissage à partir des données BRUTES (projetDetail), pas de `project`
  useEffect(() => {
    if (!projetDetail) return;

    const raw: any = projetDetail;

    const chefIds = extractIdArray(raw.chef_projet ?? raw.chefProjetIds ?? raw.chefs_projet);
    const partenaireIds = extractIdArray(raw.partenaires ?? raw.partenaireIds);
    const clientId = extractId(raw.client ?? raw.client_id ?? raw.clientId);

    setFormData({
      nom: raw.nom || raw.name || "",
      description: raw.description || "",
      objectsif: raw.objectsif || "",
      statut: (raw.statut as ProjectStatus) || "planifie",
      budget: Number(raw.budget ?? raw.Budget ?? 0),
      client: clientId,
      clientId: clientId,
      code: raw.code || "",
      domaine: normalizeProjectDomains(raw.domaine),
      date_debut: toDateInput(raw.date_debut ?? raw.dateDebut),
      date_fin_prevue: toDateInput(raw.date_fin_prevue ?? raw.dateFinPrevue),
      chef_projet: chefIds,
      partenaires: partenaireIds,
    });

    setIsFormReady(true);
  }, [projetDetail]);

  // ─────────────────────────────────────────────────────────────
  const validateDates = (debut: string, fin: string) => {
    if (!debut || !fin) return true;
    if (new Date(fin) < new Date(debut)) {
      setDateError("La date de fin prévue doit être postérieure ou égale à la date de début");
      return false;
    }
    setDateError(null);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "date_debut" || name === "date_fin_prevue") {
      const newData = { ...formData, [name]: value };
      validateDates(
        name === "date_debut" ? value : formData.date_debut,
        name === "date_fin_prevue" ? value : formData.date_fin_prevue
      );
      setFormData(newData);
    } else if (name === "budget") {
      setFormData((prev) => ({ ...prev, budget: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrorMessage(null);
  };

  const handleMultiSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    field: "chef_projet" | "partenaires"
  ) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
    setFormData((prev) => ({ ...prev, [field]: selected }));
    setErrorMessage(null);
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const domaines = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({ ...prev, domaine: domaines }));
    setErrorMessage(null);
  };

  const removeItem = (field: "chef_projet" | "partenaires", id: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((itemId) => itemId !== id),
    }));
  };

  const getItemName = (field: "chef_projet" | "partenaires", id: string): string => {
    const list = field === "chef_projet" ? chefsProjet : partenaires;
    const item = list.find((i: any) => i.id === id);
    return item?.nom || item?.name || "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.nom.trim()) { setErrorMessage("Le nom du projet est requis"); return; }
    if (!formData.objectsif.trim()) { setErrorMessage("L'objectif du projet est requis"); return; }
    if (!formData.clientId) { setErrorMessage("Le client est requis"); return; }
    if (formData.chef_projet.length === 0) { setErrorMessage("Au moins un chef de projet est requis"); return; }
    if (formData.domaine.length === 0) { setErrorMessage("Sélectionnez au moins un secteur"); return; }
    if (formData.date_fin_prevue < formData.date_debut) {
      setErrorMessage("La date de fin prévue doit être postérieure à la date de début");
      return;
    }
    if (formData.budget < 0) { setErrorMessage("Le budget doit être un nombre positif"); return; }
    if (formData.budget > 99999999) { setErrorMessage("Le budget ne doit pas dépasser 99,999,999 DH"); return; }

    try {
      const payload: any = {
        nom: formData.nom,
        description: formData.description,
        objectsif: formData.objectsif,
        statut: formData.statut,
        budget: Number(formData.budget),
        code: formData.code,
        domaine: formData.domaine,
        date_debut: formData.date_debut,
        date_fin_prevue: formData.date_fin_prevue,
        client: formData.clientId,
        chef_projet: formData.chef_projet,
        partenaires: formData.partenaires,
      };
      await updateProjet({ id: project.id, data: payload }).unwrap();

      setSuccessMessage("Projet modifié avec succès !");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      if (error?.data) {
        const errors = Object.entries(error.data)
          .map(([field, msgs]) => `${field}: ${msgs}`)
          .join(", ");
        setErrorMessage(`Erreur: ${errors}`);
      } else {
        setErrorMessage(error?.data?.message || "Erreur lors de la modification");
      }
    }
  };

  const selectedChefs = formData.chef_projet.map((id) => getItemName("chef_projet", id)).filter(Boolean);
  const selectedPartenaires = formData.partenaires.map((id) => getItemName("partenaires", id)).filter(Boolean);

  const noChefsAvailable = chefsProjet.length === 0 && !chefsLoading;
  const noPartenairesAvailable = partenaires.length === 0 && !partenairesLoading;
  const noClientsAvailable = clients.length === 0 && !clientsLoading;

  // ─────────────────────────────────────────────────────────────
  // États globaux : chargement initial / erreur de récupération
  // ─────────────────────────────────────────────────────────────
  const isInitialLoading = isLoadingDetail || !isFormReady;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">

        {/* En-tête */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white z-10 rounded-t-2xl">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Modifier le projet</h2>
                <p className="text-sm text-white/80 mt-0.5">{project.nom || project.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Chargement initial des données complètes du projet ── */}
        {isInitialLoading && !isDetailError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            <p className="text-sm text-gray-500">Chargement des informations du projet…</p>
          </div>
        )}

        {/* ── Erreur de récupération ── */}
        {isDetailError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-5">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-gray-600 text-center">
              Impossible de charger les détails de ce projet.
            </p>
            <button
              onClick={() => refetchDetail()}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* ── Formulaire (affiché seulement une fois les données prêtes) ── */}
        {!isInitialLoading && !isDetailError && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {successMessage && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {errorMessage}
              </div>
            )}

            {/* Nom du projet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du projet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
                placeholder="Ex: Transformation Digitale"
              />
            </div>

            {/* Objectif */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Target className="h-4 w-4 inline mr-1" /> Objectif <span className="text-red-500">*</span>
              </label>
              <textarea
                name="objectsif"
                value={formData.objectsif}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none resize-none"
                placeholder="Objectif principal du projet..."
              />
            </div>

            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" /> Client <span className="text-red-500">*</span>
              </label>
              {noClientsAvailable ? (
                <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
                  ⚠️ Aucun client disponible
                </div>
              ) : (
                <select
                  name="client"
                  value={formData.clientId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({ ...prev, clientId: value, client: value }));
                    setErrorMessage(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.nom || client.name} - {client.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Chefs de projet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="h-4 w-4 inline mr-1" /> Chefs de projet <span className="text-red-500">*</span>
              </label>

              {selectedChefs.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {formData.chef_projet.map((id, idx) => {
                    const name = getItemName("chef_projet", id);
                    return name ? (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs border border-red-200">
                        {name}
                        <button type="button" onClick={() => removeItem("chef_projet", id)} className="hover:text-red-800">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {noChefsAvailable ? (
                <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
                  ⚠️ Aucun chef de projet disponible
                </div>
              ) : (
                <>
                  <select
                    multiple
                    value={formData.chef_projet}
                    onChange={(e) => handleMultiSelectChange(e, "chef_projet")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none min-h-[100px]"
                    disabled={chefsLoading}
                  >
                    {chefsLoading ? (
                      <option disabled>Chargement...</option>
                    ) : (
                      chefsProjet.map((chef: Utilisateur) => (
                        <option key={chef.id} value={chef.id}>
                          {chef.nom} - {chef.email}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    👆 Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs chefs
                  </p>
                </>
              )}
            </div>

            {/* Partenaires */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <UserPlus className="h-4 w-4 inline mr-1" /> Partenaires
              </label>

              {selectedPartenaires.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {formData.partenaires.map((id, idx) => {
                    const name = getItemName("partenaires", id);
                    return name ? (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs border border-blue-200">
                        {name}
                        <button type="button" onClick={() => removeItem("partenaires", id)} className="hover:text-blue-800">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {noPartenairesAvailable ? (
                <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
                  ⚠️ Aucun partenaire disponible
                </div>
              ) : (
                <>
                  <select
                    multiple
                    value={formData.partenaires}
                    onChange={(e) => handleMultiSelectChange(e, "partenaires")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none min-h-[100px]"
                    disabled={partenairesLoading}
                  >
                    {partenairesLoading ? (
                      <option disabled>Chargement...</option>
                    ) : (
                      partenaires.map((partenaire: Partenaire) => (
                        <option key={partenaire.id} value={partenaire.id}>
                          {partenaire.nom} - {partenaire.email}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    👆 Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs partenaires
                  </p>
                </>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none resize-none"
                placeholder="Description détaillée du projet..."
              />
            </div>

            {/* Code et Domaine */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code projet</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
                  placeholder="PRJ-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domaine</label>
                <select
                  name="domaine"
                  value={formData.domaine}
                  onChange={handleDomainChange}
                  multiple
                  size={6}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
                >
                  {PROJECT_DOMAINS.map((domain) => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Utilisez Ctrl+clic pour sélectionner plusieurs secteurs.</p>
              </div>
            </div>

            {/* Statut et Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
                >
                  <option value="planifie">📋 Planifié</option>
                  <option value="en_cours">🔄 En cours</option>
                  <option value="termine">✅ Terminé</option>
                  <option value="en_pause">⏸️ En pause</option>
                  <option value="a_risque">⚠️ À risque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" /> Budget (DH)
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
                  placeholder="0"
                  min="0"
                  max="99999999"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Date début
                </label>
                <input
                  type="date"
                  name="date_debut"
                  value={formData.date_debut}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Date fin prévue
                </label>
                <input
                  type="date"
                  name="date_fin_prevue"
                  value={formData.date_fin_prevue}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
                />
              </div>
            </div>
            {dateError && <p className="text-xs text-red-500 -mt-2">{dateError}</p>}

            {/* Résumé */}
            <div className="bg-gradient-to-r from-red-50 to-white rounded-lg p-3 border border-red-100 mt-2">
              <p className="text-xs font-medium text-red-600 mb-2">📋 Récapitulatif des modifications</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-white rounded-full border border-gray-200">
                  Statut: {formData.statut === "planifie" ? "Planifié" : formData.statut === "en_cours" ? "En cours" : "Terminé"}
                </span>
                <span className="px-2 py-1 bg-white rounded-full border border-gray-200">
                  Budget: {formData.budget.toLocaleString()} DH
                </span>
                {formData.chef_projet.length > 0 && (
                  <span className="px-2 py-1 bg-white rounded-full border border-gray-200">
                    👥 {formData.chef_projet.length} chef(s)
                  </span>
                )}
                {formData.partenaires.length > 0 && (
                  <span className="px-2 py-1 bg-white rounded-full border border-gray-200">
                    🤝 {formData.partenaires.length} partenaire(s)
                  </span>
                )}
              </div>
            </div>

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
                disabled={isSaving || clientsLoading || chefsLoading || partenairesLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Modification en cours..." : "Enregistrer"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
