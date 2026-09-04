// src/components/Tasks/DraggableTask.tsx
// ─── useDraggable (pas useSortable) ──────────────────────────────────────────
// useSortable = réordonner dans UNE liste
// useDraggable + useDroppable(colonne) = déplacer ENTRE colonnes  ← ce qu'on veut
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, FolderKanban, Edit, Trash2, GripVertical, AlertCircle, Clock } from 'lucide-react';
import type { Tache } from '@/store/interfaces';

interface DraggableTaskProps {
  task: Tache;
  projectName: (id: string) => string;
  onStatusChange: (task: Tache, newStatus: string) => void;
  onEdit: (task: Tache) => void;
  onDelete: (id: string) => void;
  userRole: string | undefined;
  isOverlay?: boolean; // true quand rendu dans DragOverlay
}

const PRIORITY: Record<string, { label: string; dot: string; badge: string }> = {
  critique: { label: 'Critique', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200'      },
  haute:    { label: 'Haute',    dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  normale:  { label: 'Normale',  dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200'    },
  faible:   { label: 'Faible',   dot: 'bg-gray-300',   badge: 'bg-gray-50 text-gray-500 border-gray-200'    },
};

export function DraggableTask({
  task, projectName, onStatusChange, onEdit, onDelete, userRole, isOverlay = false,
}: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  // CSS.Translate (pas Transform) → évite le scale bizarre pendant le drag
  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging && !isOverlay ? 0.3 : 1,
  };

  const canEdit   = userRole === 'direction' || userRole === 'chef_projet'||userRole === 'consultant';
  const canDelete = userRole === 'direction';
  const prio      = PRIORITY[task.priority] ?? PRIORITY.normale;

  const daysLeft  = task.dateEcheance
    ? Math.ceil((new Date(task.dateEcheance).getTime() - Date.now()) / 86_400_000)
    : null;
  const isOverdue  = daysLeft !== null && daysLeft < 0  && task.status !== 'termine';
  const isDueSoon  = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && task.status !== 'termine';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative bg-white rounded-xl border shadow-sm select-none
        transition-shadow duration-150
        ${isOverlay
          ? 'shadow-2xl border-red-300 rotate-1 scale-105'
          : isDragging
          ? 'border-dashed border-red-200'
          : 'border-gray-200 hover:shadow-md hover:border-gray-300'
        }
      `}
    >
      {/* Barre colorée priorité */}
      <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${prio.dot}`} />

      <div className="pl-4 pr-3 py-3">
        {/* Ligne 1 : badge priorité + drag handle + actions */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${prio.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${prio.dot}`} />
            {prio.label}
          </span>

          <div className="flex items-center gap-0.5">
            {canEdit && !isOverlay && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onEdit(task); }}
                  className="p-1 rounded-md hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                {canDelete && (
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); onDelete(task.id); }}
                    className="p-1 rounded-md hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            {/* Drag handle — SEULE zone qui déclenche le drag */}
            {!isOverlay && (
              <div
                {...listeners}
                {...attributes}
                className="p-1 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100
                  cursor-grab active:cursor-grabbing transition-colors touch-none"
              >
                <GripVertical className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>

        {/* Titre */}
        <h4
          className="text-sm font-semibold text-gray-900 leading-snug mb-1.5 line-clamp-2
            cursor-pointer hover:text-red-600 transition-colors"
          onClick={() => canEdit && !isOverlay && onEdit(task)}
        >
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Projet */}
        {task.projetId && (
          <div className="flex items-center gap-1 mb-2">
            <FolderKanban className="h-3 w-3 text-gray-300 flex-shrink-0" />
            <span className="text-[10px] text-gray-400 truncate">
              {projectName(task.projetId)}
            </span>
          </div>
        )}

        {/* Barre progression */}
        {task.avancement > 0 && (
          <div className="mb-2.5">
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px] text-gray-400">Progression</span>
              <span className="text-[10px] font-semibold text-gray-600">{task.avancement}%</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  task.avancement === 100 ? 'bg-emerald-500'
                  : task.avancement >= 60  ? 'bg-blue-500'
                  : 'bg-red-500'
                }`}
                style={{ width: `${task.avancement}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer : assigné + date */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {task.assigneNom ? (
              <>
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-white">
                    {task.assigneNom.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 truncate">{task.assigneNom}</span>
              </>
            ) : (
              <span className="text-[10px] text-gray-300 italic">Non assigné</span>
            )}
          </div>

          {task.dateEcheance && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium flex-shrink-0 px-1.5 py-0.5 rounded-md
              ${isOverdue ? 'bg-red-50 text-red-600' : isDueSoon ? 'bg-amber-50 text-amber-600' : 'text-gray-400'}`}
            >
              {isOverdue ? <AlertCircle className="h-3 w-3" /> : isDueSoon ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
              {isOverdue ? `${Math.abs(daysLeft!)}j retard` : daysLeft === 0 ? "Auj." : `${daysLeft}j`}
            </span>
          )}
        </div>

        {/* Select statut rapide (visible au hover, désactivé dans overlay) */}
        {canEdit && !isOverlay && (
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <select
              value={task.status}
              onPointerDown={e => e.stopPropagation()} // évite conflit drag
              onChange={e => { e.stopPropagation(); onStatusChange(task, e.target.value); }}
              className="w-full text-[10px] bg-gray-50 hover:bg-gray-100 border border-gray-200
                rounded-lg px-2 py-1 text-gray-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-300"
            >
              <option value="a_faire">→ À faire</option>
              <option value="en_cours">→ En cours</option>
              <option value="termine">→ Terminé</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}