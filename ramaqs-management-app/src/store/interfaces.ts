

export type ProjectStatus = "en_cours" | "planifie" | "en_pause" | "termine" | "a_risque";
export type Priority = "faible" | "normale" | "haute" | "critique";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export type SousTacheStatus = "a_faire" | "en_cours" | "termine";
export type RiskLevel = "faible" | "moyen" | "eleve" | "critique";
export type NotificationType = "info" | "succes" | "attention" | "erreur";
export type DocumentType = "pdf" | "docx" | "xlsx" | "pptx" | "image";

// Types de rôles possibles
export type UserRole = 'direction' | 'chef_projet' | 'consultant' | 'client' | 'partenaire';

// Types de statut d'approbation
export type StatutApprobation = 'pending' | 'approved' | 'rejected';


export type UUID = string;
export type Email = string;
export type Phone = string;
export type Percentage = number;

// Interface pour la réponse de la liste des utilisateurs
export interface UsersListResponse {
  results: Utilisateur[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    par_role: {
      chef_projet: number;
      consultant: number;
      partenaire: number;
      client: number;
    };
  };
}
// Interface pour l'inscription
export interface RegisterData {
  nom: string;
  email: string;
  telephone?: string;
  password: string;
  role: UserRole;
  entreprise?: string;
  poste?: string;
}
// Interface pour l'approbation/rejet
export interface ApproveRejectData {
  id: string;
  action: 'approve' | 'reject';
  justification?: string;
}
export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: Utilisateur;
}

export interface AuthState {
  user: Utilisateur | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}


export interface Utilisateur {
  id: UUID;
  nom: string;
  email: Email;
  username?: string;  // ← AJOUTER
  motDePasse: string;     
  telephone: Phone;
  photoProfile: string;
  dateCreation: Date;
  dernierConnexion: Date;
  actif: boolean;
  role: 'direction' | 'chef_projet' | 'consultant' | 'client' | 'partenaire';
   // ✅ CHAMPS POUR L'APPROBATION (workflow client)
  statut_approbation: 'pending' | 'approved' | 'rejected';
  justification_rejet?: string;
  date_approbation?: Date;
  approuve_par?: string;
  approuve_par_nom?: string;
   // ✅ CHAMPS POUR LES PARTENAIRES
  type_partenaire?: 'technique' | 'commercial' | 'consulting' | 'strategique' | 'financier';
  date_debut_partenariat?: Date;
  date_fin_partenariat?: Date;
  // ✅ CHAMPS POUR L'ENTREPRISE
  entreprise?: string;
  poste?: string;
}

export interface Budget {
  id: UUID;
  montant_total: number;
  montant_depense: number;
  montant_restant: number;
  devise: string;
  date?: string;
  projet: UUID;
  projet_nom?: string;
}




export interface ChefProjet extends Utilisateur {
  specialite: string;
  certifications: string[];
}

export interface Client {
  id: UUID;
  nom: string;
  email: Email;
  telephone?: Phone;
  adresse?: string;
  secteurActivite: string;
  numeroSiret: string;
  notes?: string;
  
  // ⬇️ Champs optionnels pour enrichir la page ⬇️
  
  // Pour les statistiques
  activeProjects?: number;      // Nombre de projets actifs
  totalRevenue?: number;        // Chiffre d'affaires total
  satisfaction?: number;        // Score de satisfaction (0-5)
  
  // Pour l'affichage
  logo?: string;                // URL du logo
  siteWeb?: string;             // Site internet
  createdAt?: string;           // Date de création du compte client
  
  // Contacts multiples
  contacts?: ClientContact[];   // Liste des contacts
}

export interface ClientContact {
  id: UUID;
  nom: string;
  email: string;
  telephone?: string;
  poste?: string;
  isPrincipal: boolean;
}

export interface Partenaire {
  id: UUID;
  nom: string;
  email: Email;
  telephone: Phone;
  typePartenaire: string;     
  contrat: string;            
  dateDebutPartenaire: Date;
  dateFinPartenaire?: Date;
  actif: boolean;
}
export interface Projet {
  id: UUID;
  name: string;
  nom?: string;
  description: string;
  objectifs: string[];
  dateDebut: Date;
  dateFinPrevue: Date;
  dateFinReelle?: Date;      
  statut: ProjectStatus;
  avancementGlobal: Percentage;
  priorite: Priority;
  Budget: number;
  manager: string;
  client: string;
  code: string;
  health: "sain" | "vigilant" | "critique";
  team: { id: UUID; name: string; role: string }[];
  spent: number; // budjet consommé
  progress: number; // avancement en pourcentage
  domain: string;

  // (clés étrangères)
  chefProjetId: UUID;
  clientId: UUID;
  partenaireIds?: UUID[];

  budgetTotal?: number;
  budgetDepense?: number;
  budgetRestant?: number;
}
export interface Ressource {
  id: UUID;
  name: string;
  type: string;
  disponibilite: number;
  coutHoraire: number;
  skills: string[];
  projetsAssignes: UUID[];
  dateCreation: Date;
  dateModification: Date;
  chargeTravail: number; // en pourcentage
  workload?: number; // en heures par semaine
  hourlyRate?: number; // en monnaie locale
  initials ?: string; // pour l'affichage de l'avatar
  role?: string; // rôle ou fonction de la ressource
}
export interface Tache {
  id: string;
  projetId: string;           // Clé étrangère vers Projet
  title: string;              // Titre de la tâche
  description?: string;       // Description optionnelle
  status: 'a_faire' | 'en_cours' | 'en_attente_validation' | 'termine';
  avancement: number;         // Pourcentage d'avancement (0-100)
  dateEcheance: string;       // Date d'échéance (YYYY-MM-DD)
  assigneA?: string;          // ID de la personne assignée (optionnel)
  assigneNom?: string;        // Nom de la personne assignée (dénormalisé)
  dateDebut?: string;         // Date de début (optionnel)
  dateCreation: string;       // Date de création
  dateModification: string;   // Date de dernière modification
  commentaires?: string[];    // IDs des commentaires (optionnel)
  progress: number;  
  priority: 'faible' | 'normale' | 'haute' | 'critique';
  assignee: string; // Nom de la personne assignée (optionnel)
  projectId: string; // ID du projet associé
  dueDate: string; // Date d'échéance (YYYY-MM-DD)
  projetNom?: string; // Nom du projet (dénormalisé pour affichage)
  consultant?: string; // Nom du consultant assigné (optionnel)
}
export interface SousTache {
  id: UUID;
  projetId: UUID;
  titre: string;
  description?: string;
  statut: SousTacheStatus;
  avancement: Percentage;
  dateEcheance: Date;        
  assigneA?: UUID;            
  parentId?: UUID;            
  dateDebut?: Date;
  dateCreation: Date;
  dateModification: Date;
}

export interface KPI {
  id: UUID;
  nom: string;
  valeurCible: number;
  unite: string;              
  seuilAlerte: number;
  valeurActuelle?: number;
  ecart?: number;
  alerteDeclenchee?: boolean;
  projetId?: UUID;
  periode: 'jour' | 'semaine' | 'mois' | 'trimestre' | 'annee';
}
// ---------------------------------------------------doc--------------------------------------
// store/interfaces.ts
export interface Document {
  id: string;
  name: string;
  description?: string;
  type: "livrable" | "document" | "rapport" | "contrat";
  chemin: string;
  size: string;
  version: number;
  projectId: string;
  projectName?: string;
  uploadById?: string;
  uploadBy: string;
  uploadAt: string;
}

// -------------------------------interface notification------------------------------------------------
export interface Notification {
  id: UUID;
  type: NotificationType;
  titre: string;
  message: string;
  lu: boolean;               
  dateEnvoi: string;
  destinataireId: UUID;
  lienAction?: string;  
  // ✅ AJOUTER CES CHAMPS
  entite_id?: string;        // ID de l'entité liée (tâche, projet, etc.)
  entite_type?: string;      // Type d'entité ('tache', 'projet')
  entite_nom?: string;       // Nom de l'entité (optionnel)      
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
// store/interfaces.ts
export interface User {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  poste?: string;
  departement?: string;
  dateEntree?: string;
  photo_profil?: string | null;
  role: 'direction' | 'chef_projet' | 'consultant' | 'client' | 'partenaire';
}
