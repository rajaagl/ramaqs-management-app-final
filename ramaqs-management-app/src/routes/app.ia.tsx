import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Section } from "@/components/ui-bits";
import { aiInsights } from "@/lib/mock-data";
import { Sparkles, Send, Bot, User, TrendingUp, AlertTriangle, Brain } from "lucide-react";
import { ProtectedRoute } from "#/components/ui/ProtectedRoute";

export const Route = createFileRoute("/app/ia")({
 component: () => (
           <ProtectedRoute allowedRoles={['direction', 'super_admin','chef_projet','partenaire','consultant','client']}>
             <IAPage />
           </ProtectedRoute>
         ),
});

const conversation = [
  { role: "user", content: "Quels projets risquent un retard ce trimestre ?" },
  { role: "assistant", content: "D'après l'analyse en temps réel, **2 projets** présentent un risque significatif de retard :\n\n• **RMQ-2025-004 (Audit cybersécu OT)** — score 78/100. La cause principale est le retard d'accès aux systèmes OT du client.\n• **RMQ-2025-002 (Assistant IA)** — score 58/100. La qualité du dataset NLP est en cours d'amélioration.\n\nJe recommande une réunion d'escalade avec le client Énergie Plus dans les 5 jours." },
  { role: "user", content: "Propose une réallocation pour soulager Yassine." },
  { role: "assistant", content: "Yassine Alaoui est à **92% de charge**. Je propose :\n\n1. Transférer la **tâche T8 (Recette utilisateur RH)** à **Salma Bennani** (charge actuelle 88%, expertise PMP).\n2. Reporter la **tâche T5** d'une semaine pour libérer 10h.\n\nImpact estimé : charge Yassine ramenée à **78%**, aucun retard projet." },
];

function IAPage() {
  return (
    <AppShell
      title="Intelligence IA"
      subtitle="Assistant projet & insights prédictifs"
      actions={
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> En ligne
        </span>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {[
          { icon: AlertTriangle, label: "Alertes critiques", value: "2", color: "destructive" },
          { icon: TrendingUp, label: "Optimisations détectées", value: "8", color: "info" },
          { icon: Brain, label: "Modèles actifs", value: "5", color: "primary" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl grid place-items-center bg-${s.color}/10 text-${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-bold mt-0.5">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Section title="Assistant IA RAMAQS" description="Posez vos questions sur vos projets, ressources, risques…">
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
              {conversation.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`h-8 w-8 rounded-lg shrink-0 grid place-items-center ${
                    m.role === "user" ? "bg-muted" : "bg-gradient-primary text-primary-foreground"
                  }`}>
                    {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}>
                    {m.content.split("\n").map((line, j) => (
                      <p key={j} className={j > 0 ? "mt-2" : ""} dangerouslySetInnerHTML={{
                        __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                      }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  placeholder="Demandez une analyse, une prédiction, une recommandation…"
                  className="flex-1 h-10 rounded-lg bg-muted px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button className="h-10 px-4 rounded-lg bg-gradient-primary text-primary-foreground font-medium hover:opacity-90 inline-flex items-center gap-2 shadow-sm">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {["Risques semaine prochaine", "Projets en dépassement", "Suggérer planning sprint"].map((s) => (
                  <button key={s} className="text-xs px-3 py-1.5 rounded-full bg-primary-soft text-primary hover:bg-primary/10">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </Section>
        </div>

        <Section title="Insights" description="Analyses générées en continu" action={<Sparkles className="h-4 w-4 text-primary" />}>
          <div className="space-y-3">
            {aiInsights.map((i) => {
              const colors = {
                high: "bg-destructive/5 border-destructive/20",
                medium: "bg-warning/10 border-warning/30",
                low: "bg-info/5 border-info/20",
              };
              const dot = { high: "bg-destructive", medium: "bg-warning", low: "bg-info" };
              return (
                <div key={i.id} className={`rounded-lg border p-3 ${colors[i.severity]}`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dot[i.severity]}`} />
                    <span className="text-xs font-semibold uppercase tracking-wide">{i.type}</span>
                  </div>
                  <h4 className="font-medium text-sm mt-2">{i.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{i.message}</p>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
