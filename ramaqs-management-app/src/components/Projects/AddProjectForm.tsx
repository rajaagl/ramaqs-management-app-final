// src/components/Projects/AddProjectForm.tsx

import { useState, useEffect } from "react";
import { 
  X, Save, Loader2, AlertCircle, CheckCircle, 
  Briefcase, Calendar, DollarSign, Users, Trash2, Target, UserPlus 
} from "lucide-react";
import { 
  useCreateProjetMutation, 
  useGetClientsQuery,
  useGetChefsProjetQuery,
  useGetPartenairesQuery,
} from "../../store/api/api";
import { useAppSelector } from "../../store/store";
import { PROJECT_DOMAINS } from "../../constants/projectDomains";

interface AddProjectFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ProjectStatus = 'planifie' | 'en_cours' | 'termine' | 'en_pause' | 'a_risque';

export function AddProjectForm({ onClose, onSuccess }: AddProjectFormProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [createProjet, { isLoading }] = useCreateProjetMutation();
  
  // ✅ Récupérer les données
  const { 
    data: clientsData, 
    isLoading: clientsLoading, 
  } = useGetClientsQuery({ page: 1,  });
  
  const { 
    data: chefsData, 
    isLoading: chefsLoading, 
  } = useGetChefsProjetQuery({ page: 1, pageSize: 100 });
  
  const { 
    data: partenairesData, 
    isLoading: partenairesLoading, 
  } = useGetPartenairesQuery({ page: 1});
  
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    objectsif: "",
    statut: "planifie" as ProjectStatus,
    budget: 0,
    client: "",
    clientId: "",
    isNewClient: false,
    domaine: ["Général"],
    date_debut: new Date().toISOString().split('T')[0],
    date_fin_prevue: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
    chefProjetIds: [] as string[],
    partenaireIds: [] as string[],  // ✅ AJOUTÉ
  });
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  
  // ✅ Si la réponse est un tableau direct
const existingClients = Array.isArray(clientsData) ? clientsData : (clientsData?.results || []);
const chefsProjet = Array.isArray(chefsData) ? chefsData : (chefsData?.results || []);
const partenaires = Array.isArray(partenairesData) ? partenairesData : (partenairesData?.results || []);

  
  
  // ✅ Validation des dates : date_fin >= date_debut
  const validateDates = (debut: string, fin: string) => {
    if (!debut || !fin) return true;
    
    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);
    
    // ✅ La date de fin doit être >= date de début
    if (dateFin < dateDebut) {
      setDateError("La date de fin prévue doit être postérieure ou égale à la date de début");
      return false;
    }
    
    setDateError(null);
    return true;
  };
  
  // ✅ Validation du budget (doit être positif)
  const validateBudget = (budget: number) => {
    if (budget < 0) {
      setErrorMessage("Le budget doit être un nombre positif");
      return false;
    }
    return true;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'date_debut' || name === 'date_fin_prevue') {
      const newData = { ...formData, [name]: value };
      validateDates(
        name === 'date_debut' ? value : formData.date_debut,
        name === 'date_fin_prevue' ? value : formData.date_fin_prevue
      );
      setFormData(newData);
    } else if (name === 'budget') {
      const budgetValue = parseFloat(value) || 0;
      validateBudget(budgetValue);
      setFormData(prev => ({ ...prev, [name]: budgetValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setErrorMessage(null);
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const domaines = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({ ...prev, domaine: domaines }));
    setErrorMessage(null);
  };
  
  // ✅ Gestion du client
  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId === "new") {
      setFormData(prev => ({ ...prev, isNewClient: true, client: "", clientId: "" }));
    } else {
      const selectedClient = existingClients.find((c: any) => c.id === selectedId);
      setFormData(prev => ({ 
        ...prev, 
        isNewClient: false, 
        clientId: selectedId,
        client: selectedClient?.nom ||  ""
      }));
    }
  };
  
  // ✅ Gestion multi-select des chefs de projet
  const handleChefProjetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, chefProjetIds: selectedOptions }));
  };
  
  // ✅ Gestion multi-select des partenaires
  const handlePartenaireChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, partenaireIds: selectedOptions }));
  };
  
  const removeChefProjet = (id: string) => {
    setFormData(prev => ({
      ...prev,
      chefProjetIds: prev.chefProjetIds.filter(cId => cId !== id)
    }));
  };
  
  const removePartenaire = (id: string) => {
    setFormData(prev => ({
      ...prev,
      partenaireIds: prev.partenaireIds.filter(pId => pId !== id)
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    
    // ✅ Validation du nom
    if (!formData.nom.trim()) {
      setErrorMessage("Le nom du projet est requis");
      return;
    }
    
    // ✅ Validation de l'objectif
    if (!formData.objectsif.trim()) {
      setErrorMessage("L'objectif du projet est requis");
      return;
    }
    
    // ✅ Validation du client
    if (!formData.client.trim() && !formData.clientId) {
      setErrorMessage("Le client est requis");
      return;
    }
    
    // ✅ Validation des chefs de projet
    if (formData.chefProjetIds.length === 0) {
      setErrorMessage("Au moins un chef de projet est requis");
      return;
    }
    if (formData.domaine.length === 0) {
      setErrorMessage("Sélectionnez au moins un secteur");
      return;
    }
    
    // ✅ Validation des dates
    if (formData.date_fin_prevue < formData.date_debut) {
      setErrorMessage("La date de fin prévue doit être postérieure à la date de début");
      return;
    }
    
    // ✅ Validation du budget
    if (formData.budget < 0) {
      setErrorMessage("Le budget doit être un nombre positif");
      return;
    }
    // ✅ Limiter le budget (max 99,999,999)
    if (formData.budget > 99999999) {
     setErrorMessage("Le budget ne doit pas dépasser 99,999,999 DH");
    return;
   }
    
    try {
      // ✅ Construction du payload
      const payload: any = {
        nom: formData.nom,
        description: formData.description,
        objectsif: formData.objectsif,
        statut: formData.statut,
        budget: Number(formData.budget),
        domaine: formData.domaine,
        date_debut: formData.date_debut,
        date_fin_prevue: formData.date_fin_prevue,
        chef_projet: formData.chefProjetIds,      // ← "chef_projet" (pas "chef_projet_ids")
        partenaires: formData.partenaireIds,      // ← "partenaires" (pas "partenaires_ids")
        client: formData.clientId,   
      };
      
      // Gestion du client
      if (formData.isNewClient) {
        payload.client_nom = formData.client;
      } else {
        payload.client_id = formData.clientId;
      }

      await createProjet(payload).unwrap();
      
      setSuccessMessage("Projet créé avec succès !");
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
        setErrorMessage(error?.data?.message || "Erreur lors de la création du projet");
      }
    }
  };
  
  // Récupérer les noms des chefs de projet sélectionnés
  const getChefNames = () => {
    return formData.chefProjetIds.map(id => {
      const chef = chefsProjet.find((c: any) => c.id === id);
      return chef?.nom || "";
    }).filter(Boolean);
  };
  
  // Récupérer les noms des partenaires sélectionnés
  const getPartenaireNames = () => {
    return formData.partenaireIds.map(id => {
      const partenaire = partenaires.find((p: any) => p.id === id);
      return partenaire?.nom || "";
    }).filter(Boolean);
  };
  
  const noChefsAvailable = chefsProjet.length === 0 && !chefsLoading;
  const noPartenairesAvailable = partenaires.length === 0 && !partenairesLoading;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* En-tête */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white z-10 rounded-t-2xl">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Nouveau projet</h2>
                <p className="text-sm text-white/80 mt-0.5">Création de projet</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Messages */}
          {successMessage && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
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
              placeholder="Ex: Transformation Digitale Banque Atlas"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
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
              Client <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <select
                onChange={handleClientSelect}
                value={formData.isNewClient ? "new" : (formData.clientId || "")}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
              >
                <option value="">Sélectionner un client</option>
                {existingClients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.nom || c.name} - {c.email}
                  </option>
                ))}
                <option value="new">+ Créer un nouveau client</option>
              </select>
              
              {formData.isNewClient && (
                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  placeholder="Nom du nouveau client"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
                  autoFocus
                />
              )}
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Décrivez le projet en détail..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none resize-none"
            />
          </div>
          
          {/* Domaine */}
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
                <option value="planifie"> Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="en_pause"> En pause</option>
                <option value="a_risque"> À risque</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Budget (DH) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="1000"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Budget en Dirhams Marocains (DH)</p>
            </div>
          </div>
          
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Date début <span className="text-red-500">*</span>
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
                <Calendar className="h-4 w-4" /> Date fin prévue <span className="text-red-500">*</span>
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
          
          {/* ✅ Message d'erreur date */}
          {dateError && (
            <p className="text-xs text-red-500 -mt-2">{dateError}</p>
          )}
          
          {/* ✅ Chefs de projet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Users className="h-4 w-4" /> Chefs de projet <span className="text-red-500">*</span>
            </label>
            
            {noChefsAvailable ? (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
                ⚠️ Aucun chef de projet disponible. Veuillez en créer un.
              </div>
            ) : (
              <>
                <select
                  multiple
                  value={formData.chefProjetIds}
                  onChange={handleChefProjetChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none min-h-[100px]"
                  size={4}
                  disabled={chefsLoading}
                >
                  {chefsLoading ? (
                    <option disabled>Chargement...</option>
                  ) : (
                    chefsProjet.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.nom} - {c.email}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs chefs
                </p>
              </>
            )}
            
            {/* Affichage des chefs sélectionnés */}
            {formData.chefProjetIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {getChefNames().map((name, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs">
                    {name}
                    <button
                      type="button"
                      onClick={() => removeChefProjet(formData.chefProjetIds[idx])}
                      className="hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* ✅ Partenaires */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <UserPlus className="h-4 w-4" /> Partenaires
            </label>
            
            {noPartenairesAvailable ? (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
                ⚠️ Aucun partenaire disponible. Veuillez en créer un.
              </div>
            ) : (
              <>
                <select
                  multiple
                  value={formData.partenaireIds}
                  onChange={handlePartenaireChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none min-h-[100px]"
                  size={4}
                  disabled={partenairesLoading}
                >
                  {partenairesLoading ? (
                    <option disabled>Chargement...</option>
                  ) : (
                    partenaires.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.nom} - {p.email}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs partenaires
                </p>
              </>
            )}
            
            {/* Affichage des partenaires sélectionnés */}
            {formData.partenaireIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {getPartenaireNames().map((name, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs">
                     {name}
                    <button
                      type="button"
                      onClick={() => removePartenaire(formData.partenaireIds[idx])}
                      className="hover:text-blue-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Résumé */}
          <div className="bg-gradient-to-r from-red-50 to-white rounded-lg p-3 border border-red-100 mt-2">
            <p className="text-xs font-medium text-red-600 mb-2">📋 Récapitulatif</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-white rounded-full border border-gray-200">
                Statut: {formData.statut === 'planifie' ? 'Planifié' : formData.statut === 'en_cours' ? 'En cours' : 'Terminé'}
              </span>
              <span className="px-2 py-1 bg-white rounded-full border border-gray-200">
                Budget: {formData.budget.toLocaleString()} DH
              </span>
              <span className="px-2 py-1 bg-white rounded-full border border-gray-200">
                Client: {formData.client || "À définir"}
              </span>
              {formData.chefProjetIds.length > 0 && (
                <span className="px-2 py-1 bg-white rounded-full border border-gray-200">
                   {formData.chefProjetIds.length} chef(s)
                </span>
              )}
              {formData.partenaireIds.length > 0 && (
                <span className="px-2 py-1 bg-white rounded-full border border-gray-200">
                   {formData.partenaireIds.length} partenaire(s)
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
              disabled={isLoading || clientsLoading || chefsLoading || partenairesLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isLoading ? "Création en cours..." : "Créer le projet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
