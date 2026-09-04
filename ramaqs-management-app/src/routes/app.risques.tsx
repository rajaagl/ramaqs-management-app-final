import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Section, StatCard } from "@/components/ui-bits";
import { risks, projects } from "@/lib/mock-data";
import { AlertTriangle, ShieldCheck, TrendingDown, Plus } from "lucide-react";
import { ProtectedRoute } from "#/components/ui/ProtectedRoute";

export const Route = createFileRoute("/app/risques")({
    component: () => (
            <ProtectedRoute allowedRoles={['direction', 'super_admin','chef_projet','partenaire']}>
              <RisquesPage />
            </ProtectedRoute>
          ),
});

function severity(impact: number, prob: number) {
  const s = impact * prob;
  if (s >= 16) return { label: "Critique", color: "destructive" };
  if (s >= 9) return { label: "Élevé", color: "warning" };
  if (s >= 4) return { label: "Modéré", color: "info" };
  return { label: "Faible", color: "success" };
}

function RisquesPage() {
  const projectName = (id: string) => projects.find((p) => p.id === id)?.code ?? "—";

  return (
    <AppShell
      title="Gestion des risques"
      subtitle="Identification, scoring et plans d'action"
      actions={
        <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-sm">
          <Plus className="h-4 w-4" /> Déclarer un risque
        </button>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Risques actifs" value={risks.filter((r) => r.status === "ouvert").length} icon={<AlertTriangle className="h-5 w-5" />} accent="destructive" />
        <StatCard label="Atténués" value={risks.filter((r) => r.status === "atténué").length} icon={<ShieldCheck className="h-5 w-5" />} accent="success" />
        <StatCard label="Score moyen" value={Math.round(risks.reduce((s, r) => s + r.impact * r.probability, 0) / risks.length)} sublabel="impact × probabilité" icon={<TrendingDown className="h-5 w-5" />} accent="warning" />
        <StatCard label="Catégorie #1" value="Externe" sublabel="2 risques actifs" icon={<AlertTriangle className="h-5 w-5" />} accent="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Section title="Registre des risques">
            <div className="space-y-3">
              {risks.map((r) => {
                const sev = severity(r.impact, r.probability);
                return (
                  <div key={r.id} className="rounded-lg border border-border p-4 hover:bg-muted/40 transition">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 shrink-0 rounded-lg grid place-items-center bg-${sev.color}/10 text-${sev.color}`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-${sev.color}/10 text-${sev.color}`}>{sev.label}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{projectName(r.projectId)}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{r.category}</span>
                          {r.status === "atténué" && <span className="text-[10px] px-2 py-0.5 rounded bg-success/10 text-success">Atténué</span>}
                        </div>
                        <h4 className="font-medium text-sm mt-1.5">{r.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1"><span className="font-medium text-foreground">Mitigation :</span> {r.mitigation}</p>
                        <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                          <span>Owner : <span className="font-medium text-foreground">{r.owner}</span></span>
                          <span>Impact : <strong className="text-foreground">{r.impact}/5</strong></span>
                          <span>Probabilité : <strong className="text-foreground">{r.probability}/5</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        <Section title="Matrice impact × probabilité">
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 25 }, (_, i) => {
              const prob = 5 - Math.floor(i / 5);
              const imp = (i % 5) + 1;
              const score = prob * imp;
              const count = risks.filter((r) => r.impact === imp && r.probability === prob).length;
              const bg = score >= 16 ? "bg-destructive/30" :
                         score >= 9 ? "bg-warning/30" :
                         score >= 4 ? "bg-info/20" : "bg-success/15";
              return (
                <div key={i} className={`aspect-square rounded ${bg} grid place-items-center text-xs font-semibold`}>
                  {count > 0 ? count : ""}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
            <span>← Impact croissant →</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Probabilité (axe vertical, 5 en haut) × Impact (axe horizontal). Le chiffre indique le nombre de risques.</p>
        </Section>
      </div>
    </AppShell>
  );
}
