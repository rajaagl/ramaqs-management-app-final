
// src/routes/app.taches.tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Plus, Search, Filter, Loader2, CheckCircle, ListChecks, AlertCircle, X } from "lucide-react";
import { useState, useCallback } from "react";
import {
  useGetTachesQuery, useGetProjetsQuery,
  usePatchTacheMutation, useDeleteTacheMutation,
} from "../store/api/api";
import { useAppSelector } from "../store/store";
import { ProtectedRoute } from "#/components/ui/ProtectedRoute";
import { TaskColumn } from "@/components/Tasks/TaskColumn";
import { DraggableTask } from "@/components/Tasks/DraggableTask";
import { DeleteConfirmModal } from "@/components/Tasks/DeleteConfirmModal";
import { TaskAddModal } from "@/components/Tasks/TaskAddModal";
import { TaskEditModal } from "@/components/Tasks/TaskEditModal";
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, KeyboardSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import type { Tache, Projet } from "../store/interfaces";

type TaskStatus = "a_faire" | "en_cours" | "en_attente_validation" | "termine";

const COLUMNS = [
  { id: "a_faire"  as TaskStatus, label: "À faire",  dotColor: "bg-slate-400",   borderColor: "border-slate-200",   headerBg: "bg-slate-50"   },
  { id: "en_cours" as TaskStatus, label: "En cours", dotColor: "bg-amber-400",   borderColor: "border-amber-200",   headerBg: "bg-amber-50"   },
  { id: "en_attente_validation" as TaskStatus, label: "À valider", dotColor: "bg-violet-400", borderColor: "border-violet-200", headerBg: "bg-violet-50" },
  { id: "termine"  as TaskStatus, label: "Terminé",  dotColor: "bg-emerald-500", borderColor: "border-emerald-200", headerBg: "bg-emerald-50" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Règles d'avancement automatique selon la transition de statut
//
//  a_faire  → avancement = 0,   date_debut effacée, date_fin_reelle effacée
//  en_cours → avancement gardé (ou 10 min si était à 0 ou 100),
//             date_debut = aujourd'hui si absente,
//             date_fin_reelle effacée si on revient depuis "termine"
//  termine  → avancement = 100, date_fin_reelle = aujourd'hui
// ─────────────────────────────────────────────────────────────────────────────
function buildTransitionPayload(task: Tache, newStatus: TaskStatus): Record<string, any> {
  const today = new Date().toISOString().split("T")[0];
  const payload: Record<string, any> = { status: newStatus };

  switch (newStatus) {
    case "a_faire":
      payload.avancement     = 0;
      payload.date_fin_reelle = null;
      break;

    case "en_cours":
      // Si avancement est à 0 (jamais démarré) ou à 100 (retour depuis terminé),
      // on le remet à 10 pour signifier "en cours mais pas encore avancé"
      if (task.avancement === 0 || task.avancement === 100) {
        payload.avancement = 10;
      }
      // Renseigner la date de début si elle n'existe pas encore
      if (!task.dateDebut) {
        payload.date_debut = today;
      }
      // Si on revient depuis "terminé", on efface la date de fin réelle
      if (task.status === "termine") {
        payload.date_fin_reelle = null;
      }
      break;

    case "termine":
      // Forcer 100% et horodater la fin réelle
      payload.avancement      = 100;
      payload.date_fin_reelle = today;
      // S'assurer que la date de début est bien renseignée
      if (!task.dateDebut) {
        payload.date_debut = today;
      }
      break;
  }

  return payload;
}

// ─────────────────────────────────────────────────────────────────────────────
// Libellé de la transition pour le toast
// ─────────────────────────────────────────────────────────────────────────────
function transitionMessage(from: TaskStatus, to: TaskStatus): string {
  if (to === "termine")  return `✅ Tâche terminée — avancement mis à 100%`;
  if (to === "en_cours" && from === "a_faire")  return `Tâche démarrée — date de début enregistrée`;
  if (to === "en_cours" && from === "termine")  return `↩Tâche réouverte — avancement remis à 10%`;
  if (to === "a_faire")  return `Tâche remise à zéro`;
  return `Déplacé vers "${COLUMNS.find(c => c.id === to)?.label}"`;
}

export const Route = createFileRoute("/app/taches")({
  component: () => (
    <ProtectedRoute allowedRoles={["direction", "chef_projet", "consultant"]}>
      <TachesPage />
    </ProtectedRoute>
  ),
});

function TachesPage() {
  const navigate  = useNavigate();
  const { user }  = useAppSelector((s) => s.auth);

  const [searchTerm,        setSearchTerm]        = useState("");
  const [selectedProject,   setSelectedProject]   = useState("");
  const [selectedPriority,  setSelectedPriority]  = useState("");
  const [showFilters,       setShowFilters]        = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [toast,             setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const [isUpdating,        setIsUpdating]        = useState(false);
  const [activeTask,        setActiveTask]        = useState<Tache | null>(null);
  const [showAddModal,      setShowAddModal]      = useState(false);
  const [editingTask,       setEditingTask]       = useState<Tache | null>(null);

  const { data: tachesData,  isLoading: tL, error: tE, refetch } = useGetTachesQuery({ page: 1, pageSize: 100 });
  const { data: projetsData, isLoading: pL }                     = useGetProjetsQuery({ page: 1, pageSize: 100 });
  const [patchTache]  = usePatchTacheMutation();
  const [deleteTache] = useDeleteTacheMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  // ── Données ──────────────────────────────────────────────────────────────────
  // ✅ FIX : gère les deux formats possibles (tableau direct ou objet paginé)
  const allTasks: Tache[] = Array.isArray(tachesData)
    ? tachesData
    : (tachesData?.results ?? []);

  const projects = Array.isArray(projetsData)
    ? projetsData
    : (projetsData?.results || []);

  // ── IDs des projets du chef connecté (calculé une seule fois) ───────────────
  const myProjectIds: string[] = user?.role === "chef_projet"
    ? projects
        .filter((p: Projet) => p.chefProjetId === user?.id)
        .map((p: Projet) => p.id)
    : [];

  // ─────────────────────────────────────────────────────────────────────────────
  // Permissions par rôle et par tâche
  // ─────────────────────────────────────────────────────────────────────────────

  // Peut-on déplacer (changer le statut de) cette tâche ?
  const canMove = useCallback((task: Tache): boolean => {
    if (!user) return false;
    if (user.role === "direction" ) return true;
    if (user.role === "chef_projet") return myProjectIds.includes(task.projetId);
    return false;
  }, [user, myProjectIds]);

  // Peut-on supprimer cette tâche ?
  // consultant → jamais
  // chef_projet → seulement ses projets
  // direction/super_admin → toujours
  const canDeleteTask = useCallback((task: Tache): boolean => {
    if (!user) return false;
    if (user.role === "direction" ) return true;
    if (user.role === "chef_projet") return myProjectIds.includes(task.projetId);
    return false; // consultant ne peut pas supprimer
  }, [user, myProjectIds]);

  // Peut-on créer une tâche ?
  const canCreate = user?.role === "direction" || user?.role === "chef_projet" ;

  // ── Filtre par rôle ──────────────────────────────────────────────────────────
  const tasksByRole = allTasks; 

  // ── Filtres UI ────────────────────────────────────────────────────────────────
  const filteredTasks = tasksByRole.filter(t => {
    const q = searchTerm.toLowerCase();
    return (
      (!q || (t.title?.toLowerCase() ?? "").includes(q) || (t.description?.toLowerCase() ?? "").includes(q)) &&
      (!selectedProject  || t.projetId === selectedProject) &&
      (!selectedPriority || t.priority === selectedPriority)
    );
  });

  // ── Groupage par statut ───────────────────────────────────────────────────────
  const grouped: Record<TaskStatus, Tache[]> = {
    a_faire:  filteredTasks.filter(t => t.status === "a_faire"),
    en_cours: filteredTasks.filter(t => t.status === "en_cours"),
    en_attente_validation: filteredTasks.filter(t => t.status === "en_attente_validation"),
    termine:  filteredTasks.filter(t => t.status === "termine"),
  };

  // ── Nom de projet ─────────────────────────────────────────────────────────────
  const getProjectName = useCallback((projetId: string): string => {
    if (!projetId) return "—";
    const p = projects.find((p: any) => p.id === projetId);
    return p?.nom ?? p?.name ?? "Projet inconnu";
  }, [projects]);

  // ── Toast ──────────────────────────────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Mise à jour du statut avec logique d'avancement automatique
  // ─────────────────────────────────────────────────────────────────────────────
  const updateStatus = async (task: Tache, newStatus: string) => {
    if (task.status === newStatus) return;

    // ✅ Vérifier la permission avant d'agir
    if (!canMove(task)) {
      showToast("Vous n'êtes pas autorisé à modifier cette tâche", false);
      return;
    }

    setIsUpdating(true);
    try {
      // ✅ Payload minimal : seulement les champs qui changent
      // (status + avancement + dates selon la transition)
      const data = buildTransitionPayload(task, newStatus as TaskStatus);

      await patchTache({ id: task.id, data }).unwrap();
      showToast(transitionMessage(task.status, newStatus as TaskStatus));
      await refetch();
    } catch (err) {
      showToast("Erreur lors de la mise à jour", false);
      refetch();
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Suppression ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const task = allTasks.find(t => t.id === id);
    if (task && !canDeleteTask(task)) {
      showToast("Vous n'êtes pas autorisé à supprimer cette tâche", false);
      return;
    }
    setIsUpdating(true);
    try {
      await deleteTache(id).unwrap();
      setShowDeleteConfirm(null);
      showToast("Tâche supprimée");
    } catch (err) {
      showToast("Erreur suppression", false);
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const task = allTasks.find(t => t.id === event.active.id) ?? null;
    // ✅ Bloquer le drag si l'utilisateur n'a pas la permission
    if (task && !canMove(task)) return;
    setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const targetStatus = over.id as string;
    if (!["a_faire", "en_cours", "en_attente_validation", "termine"].includes(targetStatus)) return;

    const task = allTasks.find(t => t.id === active.id);
    if (!task || task.status === targetStatus) return;

    await updateStatus(task, targetStatus);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────────
  const avancementMoyen = filteredTasks.length > 0
    ? Math.round(filteredTasks.reduce((s, t) => s + (t.avancement || 0), 0) / filteredTasks.length)
    : 0;

  const stats = [
    { label: "Total",          value: filteredTasks.length,    bg: "bg-white",      text: "text-gray-800"    },
    { label: "À faire",        value: grouped.a_faire.length,  bg: "bg-slate-50",   text: "text-slate-600"   },
    { label: "En cours",       value: grouped.en_cours.length, bg: "bg-amber-50",   text: "text-amber-600"   },
    { label: "À valider",      value: grouped.en_attente_validation.length, bg: "bg-violet-50", text: "text-violet-600" },
    { label: "Terminés",       value: grouped.termine.length,  bg: "bg-emerald-50", text: "text-emerald-600" },
  ];

  // ── Chargement / Erreur ────────────────────────────────────────────────────────
  if (tL || pL) {
    return (
      <AppShell title="Tâches" subtitle="Chargement...">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            <p className="text-sm text-gray-500">Chargement des tâches…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (tE) {
    return (
      <AppShell title="Tâches" subtitle="Erreur">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-gray-600 font-medium">Impossible de charger les tâches</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">
            Réessayer
          </button>
        </div>
      </AppShell>
    );
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────────
  return (
    <AppShell
      title="Tâches"
      subtitle={
        isUpdating
          ? "Mise à jour…"
          : `${filteredTasks.length} tâche${filteredTasks.length !== 1 ? "s" : ""} · ${avancementMoyen}% d'avancement moyen`
      }
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-9 pl-9 pr-8 rounded-lg border border-gray-200 bg-white text-sm w-52
                outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-all
              ${showFilters || selectedProject || selectedPriority
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
          >
            <Filter className="h-4 w-4" />
            Filtres
            {(selectedProject || selectedPriority) && (
              <span className="bg-white/25 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {[selectedProject, selectedPriority].filter(Boolean).length}
              </span>
            )}
          </button>

          {canCreate && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold hover:shadow-lg transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> Nouvelle tâche
            </button>
          )}
        </div>
      }
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] animate-in fade-in slide-in-from-top-3 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border
            ${toast.ok ? "bg-white border-emerald-200 text-gray-700" : "bg-white border-red-200 text-red-700"}`}
          >
            {toast.ok
              ? <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              : <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
            {toast.msg}
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className={`${s.bg} border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between`}>
              <span className="text-xs font-medium text-gray-500">{s.label}</span>
              <span className={`text-2xl font-bold ${s.text}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Barre d'avancement globale */}
        {filteredTasks.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Avancement global</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${avancementMoyen}%`,
                  background: avancementMoyen === 100 ? "#22c55e" : avancementMoyen >= 50 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
            <span className="text-sm font-bold text-gray-700 w-10 text-right">{avancementMoyen}%</span>
          </div>
        )}

        {/* Filtres */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Filtres</span>
              {(selectedProject || selectedPriority) && (
                <button onClick={() => { setSelectedProject(""); setSelectedPriority(""); }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                  <X className="h-3 w-3" /> Réinitialiser
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Projet</label>
                <select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <option value="">Tous les projets</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nom ?? p.name ?? "Sans nom"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Priorité</label>
                <select
                  value={selectedPriority}
                  onChange={e => setSelectedPriority(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <option value="">Toutes les priorités</option>
                  <option value="critique">🔴 Critique</option>
                  <option value="haute">🟠 Haute</option>
                  <option value="normale">🔵 Normale</option>
                  <option value="faible">⚪ Faible</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Kanban */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {COLUMNS.map(col => (
              <TaskColumn
                key={col.id}
                status={col.id}
                title={col.label}
                dotColor={col.dotColor}
                borderColor={col.borderColor}
                headerBg={col.headerBg}
                tasks={grouped[col.id]}
                projectName={getProjectName}
                onEdit={task => setEditingTask(task)}
                // ✅ onDelete conditionnel selon le rôle et la tâche
                onDelete={id => {
                  const task = allTasks.find(t => t.id === id);
                  if (task && canDeleteTask(task)) {
                    setShowDeleteConfirm(id);
                  } else {
                    showToast("Vous n'êtes pas autorisé à supprimer cette tâche", false);
                  }
                }}
                onStatusChange={updateStatus}
                userRole={user?.role}
                activeTaskId={activeTask?.id ?? null}
                onAddTask={canCreate ? () => setShowAddModal(true) : undefined}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeTask ? (
              <div className="pointer-events-none">
                <DraggableTask
                  task={activeTask}
                  projectName={getProjectName}
                  onStatusChange={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  userRole={user?.role}
                  isOverlay={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Empty state */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <ListChecks className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">Aucune tâche</h3>
            <p className="text-sm text-gray-400 mb-4">
              {searchTerm || selectedProject || selectedPriority
                ? "Modifiez vos filtres"
                : canCreate ? "Créez votre première tâche" : "Aucune tâche assignée"}
            </p>
            {canCreate && !searchTerm && !selectedProject && !selectedPriority && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <Plus className="h-4 w-4" /> Créer une tâche
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={() => { setEditingTask(null); refetch(); }}
        />
      )}

      {showAddModal && (
        <TaskAddModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); refetch(); }}
        />
      )}
    </AppShell>
  );
}
