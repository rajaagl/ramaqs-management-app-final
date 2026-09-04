// src/components/Tasks/TaskColumn.tsx
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { DraggableTask } from './DraggableTask';
import type { Tache } from '@/store/interfaces';

interface TaskColumnProps {
  status: string;
  title: string;
  dotColor: string;
  borderColor: string;
  headerBg: string;
  tasks: Tache[];
  projectName: (id: string) => string;
  onStatusChange: (task: Tache, newStatus: string) => void;
  onEdit: (task: Tache) => void;
  onDelete: (id: string) => void;
  userRole: string | undefined;
  activeTaskId: string | null;
  onAddTask?: () => void;
}

export function TaskColumn({
  status, title, dotColor, borderColor, headerBg,
  tasks, projectName, onStatusChange, onEdit, onDelete,
  userRole, activeTaskId, onAddTask,
}: TaskColumnProps) {
  // useDroppable : id = status exact ("a_faire" | "en_cours" | "termine")
  // C'est cet id qu'on lit dans handleDragEnd via event.over.id
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const canCreate = userRole === 'direction' || userRole === 'chef_projet';

  return (
    <div className="flex flex-col gap-2">
      {/* En-tête */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 ${borderColor} ${headerBg}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
          <span className="text-sm font-bold text-gray-700">{title}</span>
          <span className="text-xs font-bold text-gray-500 bg-white rounded-full px-2 py-0.5 border border-gray-200 min-w-[22px] text-center">
            {tasks.length}
          </span>
        </div>
        {canCreate && onAddTask && (
          <button onClick={onAddTask}
            className="h-6 w-6 rounded-md hover:bg-white/70 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Zone droppable — toute la surface est une drop zone */}
      <div
        ref={setNodeRef}
        className={`
          flex flex-col gap-2 p-2 rounded-xl min-h-[480px] transition-all duration-150
          ${isOver ? 'bg-red-50/60 ring-2 ring-red-300 ring-offset-1 shadow-inner' : 'bg-gray-50/50'}
        `}
      >
        {tasks.map(task => (
          <DraggableTask
            key={task.id}
            task={task}
            projectName={projectName}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
            userRole={userRole}
            isOverlay={false}
          />
        ))}

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className={`flex flex-col items-center justify-center flex-1 min-h-[200px]
            rounded-xl border-2 border-dashed transition-all
            ${isOver ? 'border-red-300 bg-red-50/40' : 'border-gray-200'}`}
          >
            {isOver
              ? <><div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center mb-2">
                  <Plus className="h-4 w-4 text-red-500" />
                </div>
                <span className="text-xs font-semibold text-red-500">Lâcher ici</span></>
              : <span className="text-xs text-gray-400 font-medium">Aucune tâche</span>
            }
          </div>
        )}

        {/* Indicateur drop sur colonne non vide */}
        {isOver && tasks.length > 0 && (
          <div className="h-0.5 w-full rounded-full bg-red-300 animate-pulse" />
        )}
      </div>
    </div>
  );
}