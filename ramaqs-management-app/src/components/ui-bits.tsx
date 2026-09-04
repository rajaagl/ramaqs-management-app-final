import { ReactNode } from "react";
import {
  type ProjectStatus, type Priority, type TaskStatus,
  statusLabels, priorityLabels, taskStatusLabels,
} from "@/lib/mock-data";

export function StatCard({
  label, value, sublabel, trend, icon, accent = "primary",
}: {
  label: string; value: ReactNode; sublabel?: string;
  trend?: { value: string; positive?: boolean };
  icon?: ReactNode;
  accent?: "primary" | "success" | "warning" | "destructive" | "info";
}) {
  const accentBg: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
          <div className="text-2xl lg:text-3xl font-bold mt-2 text-foreground">{value}</div>
          {sublabel && <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>}
        </div>
        {icon && <div className={`h-10 w-10 rounded-lg grid place-items-center ${accentBg[accent]}`}>{icon}</div>}
      </div>
      {trend && (
        <div className={`mt-3 text-xs font-medium ${trend.positive ? "text-success" : "text-destructive"}`}>
          {trend.positive ? "▲" : "▼"} {trend.value}
        </div>
      )}
    </div>
  );
}

const statusStyles: Record<ProjectStatus, string> = {
  en_cours: "bg-info/10 text-info border-info/20",
  planifie: "bg-muted text-muted-foreground border-border",
  en_pause: "bg-warning/15 text-warning-foreground border-warning/30",
  termine: "bg-success/10 text-success border-success/20",
  a_risque: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

const priorityStyles: Record<Priority, string> = {
  faible: "bg-muted text-muted-foreground",
  normale: "bg-info/10 text-info",
  haute: "bg-warning/20 text-warning-foreground",
  critique: "bg-destructive/10 text-destructive",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${priorityStyles[priority]}`}>
      {priorityLabels[priority]}
    </span>
  );
}

const taskStatusStyles: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-info/10 text-info",
  review: "bg-warning/15 text-warning-foreground",
  done: "bg-success/10 text-success",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${taskStatusStyles[status]}`}>
      {taskStatusLabels[status]}
    </span>
  );
}

export function ProgressBar({ value, accent = "primary" }: { value: number; accent?: "primary" | "success" | "warning" | "destructive" }) {
  const colors: Record<string, string> = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  };
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${colors[accent]} transition-all`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Avatar({ initials, size = "sm" }: { initials: string; size?: "xs" | "sm" | "md" }) {
  const sizes = { xs: "h-6 w-6 text-[10px]", sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm" };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-primary text-primary-foreground grid place-items-center font-semibold ring-2 ring-card`}>
      {initials}
    </div>
  );
}

export function AvatarStack({ items, max = 4 }: { items: string[]; max?: number }) {
  const visible = items.slice(0, max);
  const extra = items.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((i) => <Avatar key={i} initials={i} size="xs" />)}
      {extra > 0 && (
        <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground grid place-items-center text-[10px] font-semibold ring-2 ring-card">
          +{extra}
        </div>
      )}
    </div>
  );
}

export function Section({ title, action, children, description }: {
  title: string; action?: ReactNode; children: ReactNode; description?: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
