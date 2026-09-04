
export type ProjectStatus = "en_cours" | "planifie" | "en_pause" | "termine" | "a_risque";
export type Priority = "faible" | "normale" | "haute" | "critique";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  domain: "Transformation digitale" | "IA" | "Industrie 4.0" | "Conseil & formation";
  status: ProjectStatus;
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  manager: string;
  team: string[];
  health: "excellent" | "bon" | "vigilant" | "critique";
  riskScore: number;
}

export const projects: Project[] = [
  {
    id: "p1", code: "RMQ-2025-001", name: "Refonte ERP Industrie 4.0",
    client: "Manufacto SA", domain: "Industrie 4.0", status: "en_cours",
    progress: 68, budget: 285000, spent: 192000,
    startDate: "2025-01-15", endDate: "2025-09-30",
    manager: "Salma Bennani", team: ["YA", "ME", "KH", "SO"],
    health: "bon", riskScore: 32,
  },
  {
    id: "p2", code: "RMQ-2025-002", name: "Assistant IA Service Client",
    client: "Banque Atlas", domain: "IA", status: "en_cours",
    progress: 45, budget: 180000, spent: 102000,
    startDate: "2025-02-01", endDate: "2025-07-15",
    manager: "Yassine Alaoui", team: ["ME", "RA", "NO"],
    health: "vigilant", riskScore: 58,
  },
  {
    id: "p3", code: "RMQ-2025-003", name: "Plateforme e-commerce B2B",
    client: "DistriPro", domain: "Transformation digitale", status: "en_cours",
    progress: 82, budget: 145000, spent: 128000,
    startDate: "2024-11-10", endDate: "2025-05-20",
    manager: "Karim Hadi", team: ["YA", "SO", "RA"],
    health: "excellent", riskScore: 18,
  },
  {
    id: "p4", code: "RMQ-2025-004", name: "Audit cybersécurité OT",
    client: "Énergie Plus", domain: "Industrie 4.0", status: "a_risque",
    progress: 35, budget: 95000, spent: 71000,
    startDate: "2025-03-01", endDate: "2025-06-15",
    manager: "Salma Bennani", team: ["NO", "ME"],
    health: "critique", riskScore: 78,
  },
  {
    id: "p5", code: "RMQ-2025-005", name: "Formation IA Générative",
    client: "Groupe Talent", domain: "Conseil & formation", status: "planifie",
    progress: 12, budget: 62000, spent: 8000,
    startDate: "2025-04-15", endDate: "2025-08-30",
    manager: "Yassine Alaoui", team: ["KH", "RA"],
    health: "bon", riskScore: 22,
  },
  {
    id: "p6", code: "RMQ-2024-098", name: "Migration Cloud Azure",
    client: "RetailMax", domain: "Transformation digitale", status: "termine",
    progress: 100, budget: 210000, spent: 198000,
    startDate: "2024-06-01", endDate: "2025-02-28",
    manager: "Karim Hadi", team: ["YA", "ME", "SO"],
    health: "excellent", riskScore: 8,
  },
];

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assignee: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  progress: number;
}

export const tasks: Task[] = [
  { id: "t1", projectId: "p1", title: "Spécifications module logistique", assignee: "Mehdi El Amrani", status: "done", priority: "haute", dueDate: "2025-04-10", progress: 100 },
  { id: "t2", projectId: "p1", title: "Intégration capteurs IoT ligne A", assignee: "Karim Hadi", status: "in_progress", priority: "critique", dueDate: "2025-05-02", progress: 65 },
  { id: "t3", projectId: "p2", title: "Entraînement modèle NLP fr/ar", assignee: "Rania Tazi", status: "in_progress", priority: "haute", dueDate: "2025-05-12", progress: 40 },
  { id: "t4", projectId: "p2", title: "Tests A/B chatbot v2", assignee: "Nora Benali", status: "review", priority: "normale", dueDate: "2025-04-30", progress: 90 },
  { id: "t5", projectId: "p3", title: "Refonte tunnel de commande", assignee: "Yassine Alaoui", status: "in_progress", priority: "haute", dueDate: "2025-05-05", progress: 75 },
  { id: "t6", projectId: "p4", title: "Cartographie réseau OT", assignee: "Nora Benali", status: "todo", priority: "critique", dueDate: "2025-05-08", progress: 15 },
  { id: "t7", projectId: "p5", title: "Préparation supports module 1", assignee: "Karim Hadi", status: "todo", priority: "normale", dueDate: "2025-05-20", progress: 5 },
  { id: "t8", projectId: "p1", title: "Recette utilisateur module RH", assignee: "Salma Bennani", status: "todo", priority: "normale", dueDate: "2025-05-25", progress: 0 },
];

export interface Resource {
  id: string;
  initials: string;
  name: string;
  role: string;
  skills: string[];
  availability: number; // %
  workload: number; // %
  hourlyRate: number;
}

export const resources: Resource[] = [
  { id: "r1", initials: "YA", name: "Yassine Alaoui", role: "Chef de projet senior", skills: ["Agile", "Scrum", "Cloud"], availability: 80, workload: 92, hourlyRate: 85 },
  { id: "r2", initials: "ME", name: "Mehdi El Amrani", role: "Architecte solution", skills: ["Azure", "DevOps", "ERP"], availability: 100, workload: 78, hourlyRate: 95 },
  { id: "r3", initials: "KH", name: "Karim Hadi", role: "Lead développeur", skills: ["React", "Node.js", "IoT"], availability: 100, workload: 85, hourlyRate: 75 },
  { id: "r4", initials: "SO", name: "Salma Bennani", role: "Cheffe de projet", skills: ["PMP", "Risk", "Finance"], availability: 90, workload: 88, hourlyRate: 80 },
  { id: "r5", initials: "RA", name: "Rania Tazi", role: "Data scientist", skills: ["Python", "ML", "NLP"], availability: 100, workload: 70, hourlyRate: 85 },
  { id: "r6", initials: "NO", name: "Nora Benali", role: "Consultante cybersécu", skills: ["ISO27001", "OT/IT", "Pentest"], availability: 80, workload: 65, hourlyRate: 90 },
];

export interface Risk {
  id: string;
  projectId: string;
  title: string;
  category: "Technique" | "Délai" | "Budget" | "Ressources" | "Externe";
  impact: 1 | 2 | 3 | 4 | 5;
  probability: 1 | 2 | 3 | 4 | 5;
  status: "ouvert" | "atténué" | "fermé";
  owner: string;
  mitigation: string;
}

export const risks: Risk[] = [
  { id: "rk1", projectId: "p4", title: "Accès tardif aux systèmes OT du client", category: "Externe", impact: 5, probability: 4, status: "ouvert", owner: "Nora Benali", mitigation: "Escalade direction client + plan B audit documentaire" },
  { id: "rk2", projectId: "p2", title: "Qualité du dataset NLP insuffisante", category: "Technique", impact: 4, probability: 3, status: "atténué", owner: "Rania Tazi", mitigation: "Augmentation dataset + fine-tuning supplémentaire" },
  { id: "rk3", projectId: "p1", title: "Surcharge équipe intégration capteurs", category: "Ressources", impact: 3, probability: 4, status: "ouvert", owner: "Yassine Alaoui", mitigation: "Recrutement freelance senior IoT" },
  { id: "rk4", projectId: "p3", title: "Dépassement budget paliers paiement", category: "Budget", impact: 3, probability: 2, status: "atténué", owner: "Karim Hadi", mitigation: "Renégociation scope module fidélité" },
  { id: "rk5", projectId: "p4", title: "Retard livraison rapport audit", category: "Délai", impact: 4, probability: 4, status: "ouvert", owner: "Nora Benali", mitigation: "Doublement effectif sur dernière phase" },
];

export interface Document {
  id: string;
  name: string;
  type: "PDF" | "DOCX" | "XLSX" | "PPTX" | "Image";
  projectId: string;
  size: string;
  version: string;
  updatedAt: string;
  updatedBy: string;
}

export const documents: Document[] = [
  { id: "d1", name: "Cahier des charges ERP v3.2", type: "PDF", projectId: "p1", size: "4.2 MB", version: "v3.2", updatedAt: "2025-04-12", updatedBy: "Salma Bennani" },
  { id: "d2", name: "Architecture technique chatbot", type: "PPTX", projectId: "p2", size: "8.1 MB", version: "v2.0", updatedAt: "2025-04-18", updatedBy: "Mehdi El Amrani" },
  { id: "d3", name: "Budget prévisionnel B2B", type: "XLSX", projectId: "p3", size: "320 KB", version: "v4.1", updatedAt: "2025-04-20", updatedBy: "Karim Hadi" },
  { id: "d4", name: "Rapport audit phase 1", type: "DOCX", projectId: "p4", size: "1.8 MB", version: "v1.0", updatedAt: "2025-04-15", updatedBy: "Nora Benali" },
  { id: "d5", name: "Programme formation IA", type: "PDF", projectId: "p5", size: "2.4 MB", version: "v1.3", updatedAt: "2025-04-22", updatedBy: "Yassine Alaoui" },
];

export interface Client {
  id: string;
  name: string;
  sector: string;
  contact: string;
  email: string;
  activeProjects: number;
  totalRevenue: number;
  satisfaction: number;
}

export const clients: Client[] = [
  { id: "c1", name: "Manufacto SA", sector: "Industrie", contact: "H. Bourkadi", email: "h.bourkadi@manufacto.com", activeProjects: 1, totalRevenue: 285000, satisfaction: 4.5 },
  { id: "c2", name: "Banque Atlas", sector: "Finance", contact: "L. Cherkaoui", email: "l.cherkaoui@atlas.bank", activeProjects: 1, totalRevenue: 180000, satisfaction: 4.2 },
  { id: "c3", name: "DistriPro", sector: "Distribution", contact: "M. Idrissi", email: "m.idrissi@distripro.ma", activeProjects: 1, totalRevenue: 145000, satisfaction: 4.8 },
  { id: "c4", name: "Énergie Plus", sector: "Énergie", contact: "F. Sebti", email: "f.sebti@energieplus.com", activeProjects: 1, totalRevenue: 95000, satisfaction: 3.6 },
  { id: "c5", name: "Groupe Talent", sector: "RH & Formation", contact: "A. Naciri", email: "a.naciri@talent.ma", activeProjects: 1, totalRevenue: 62000, satisfaction: 4.7 },
  { id: "c6", name: "RetailMax", sector: "Retail", contact: "Y. Lahlou", email: "y.lahlou@retailmax.com", activeProjects: 0, totalRevenue: 210000, satisfaction: 4.6 },
];

// Données graphiques
export const monthlyRevenue = [
  { month: "Nov", revenu: 78, cout: 52 },
  { month: "Déc", revenu: 92, cout: 61 },
  { month: "Jan", revenu: 105, cout: 70 },
  { month: "Fév", revenu: 118, cout: 78 },
  { month: "Mar", revenu: 132, cout: 85 },
  { month: "Avr", revenu: 145, cout: 92 },
];

export const projectsByDomain = [
  { name: "Industrie 4.0", value: 2, color: "var(--chart-1)" },
  { name: "IA", value: 1, color: "var(--chart-2)" },
  { name: "Transfo digitale", value: 2, color: "var(--chart-3)" },
  { name: "Conseil & formation", value: 1, color: "var(--chart-4)" },
];

export const aiInsights = [
  { id: "i1", type: "risque", severity: "high" as const, title: "Retard probable détecté", message: "Le projet RMQ-2025-004 a 78% de risque de dépasser sa deadline. Recommandation : renforcer l'équipe de 1 ETP." },
  { id: "i2", type: "ressource", severity: "medium" as const, title: "Surcharge équipe", message: "Yassine Alaoui est à 92% de charge sur les 4 prochaines semaines. Réallouer la tâche T8 à Salma Bennani." },
  { id: "i3", type: "budget", severity: "low" as const, title: "Économie possible", message: "Optimisation des licences cloud sur RMQ-2025-003 : économie estimée 8 200 €." },
  { id: "i4", type: "performance", severity: "low" as const, title: "Performance équipe", message: "Vélocité globale +14% ce trimestre. Les sprints de 2 semaines donnent les meilleurs résultats." },
];

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const statusLabels: Record<ProjectStatus, string> = {
  en_cours: "En cours",
  planifie: "Planifié",
  en_pause: "En pause",
  termine: "Terminé",
  a_risque: "À risque",
};

export const priorityLabels: Record<Priority, string> = {
  faible: "Faible",
  normale: "Normale",
  haute: "Haute",
  critique: "Critique",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  review: "En revue",
  done: "Terminée",
};
