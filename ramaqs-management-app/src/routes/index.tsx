import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Sparkles, Brain, Factory, GraduationCap, ArrowRight, BarChart3,
  Users, Shield, Zap, CheckCircle2,
} from "lucide-react";
import { TestApi } from '../components/ui/testApi';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RAMAQS Consulting — Plateforme de gestion de projets nouvelle génération" },
      { name: "description", content: "Centralisez, pilotez et automatisez vos projets de transformation digitale, IA, Industrie 4.0 et conseil avec l'intelligence augmentée RAMAQS." },
      { property: "og:title", content: "RAMAQS Consulting — Pilotage de projets augmenté par l'IA" },
      { property: "og:description", content: "Une plateforme unique pour centraliser, suivre en temps réel et automatiser vos projets stratégiques." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-white">
      
      

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-red-600 to-red-700 grid place-items-center shadow-md">
              <span className="text-white font-bold">R</span>
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-gray-900">RAMAQS</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400">Consulting</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#fonctionnalites" className="hover:text-red-600 transition">Fonctionnalités</a>
            <a href="#ia" className="hover:text-red-600 transition">Intelligence IA</a>
            <a href="#secteurs" className="hover:text-red-600 transition">Secteurs</a>
          </nav>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200"
          >
            Accéder à la plateforme
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-red-50 to-white" aria-hidden />
        <div className="absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-red-200/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-red-100/20 blur-3xl" aria-hidden />

        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Nouveau · Pilotage projet augmenté par l'IA
            </span>
            <h1 className="mt-6 text-4xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.05]">
              Pilotez tous vos projets avec
              <span className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent"> intelligence et précision.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl">
              La plateforme RAMAQS centralise vos projets de transformation digitale, IA, Industrie 4.0 et conseil.
              Coût, délai, qualité, ressources : un seul cockpit, des décisions augmentées par l'IA.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-medium shadow-md hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200"
              >
                Accéder à la plateforme
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#fonctionnalites"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Découvrir les modules
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-500">
              {["10+ modules métier", "IA prédictive intégrée", "Multi-équipes & clients"].map((t) => (
                <span key={t} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-600" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Mock dashboard preview */}
          <div className="mt-16 lg:mt-20 relative">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
              <div className="h-9 border-b border-gray-100 bg-gray-50 flex items-center gap-1.5 px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-orange-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                <span className="ml-3 text-xs text-gray-400">platform.ramaqs.com/app</span>
              </div>
              <div className="p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
                {[
                  { l: "Projets actifs", v: "24", t: "+3 ce mois", c: "text-green-600" },
                  { l: "Budget global", v: "1,8 M€", t: "82% consommé", c: "text-blue-600" },
                  { l: "Risques élevés", v: "5", t: "1 critique", c: "text-red-600" },
                  { l: "Score IA santé", v: "87/100", t: "▲ stable", c: "text-green-600" },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-4">
                    <div className="text-xs text-gray-500">{s.l}</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{s.v}</div>
                    <div className={`text-xs mt-1 ${s.c}`}>{s.t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Domaines */}
      <section id="secteurs" className="py-20 max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">4 domaines d'expertise, une plateforme unifiée</h2>
          <p className="mt-4 text-gray-500">RAMAQS Consulting accompagne vos transformations sur l'ensemble de la chaîne de valeur.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Zap, title: "Transformation digitale", desc: "Cloud, ERP, modernisation des SI." },
            { icon: Brain, title: "Solutions IA", desc: "GenAI, NLP, vision, MLOps." },
            { icon: Factory, title: "Industrie 4.0", desc: "IoT, OT/IT, jumeaux numériques." },
            { icon: GraduationCap, title: "Conseil & formation", desc: "Stratégie, change, upskilling." },
          ].map((d) => (
            <div key={d.title} className="rounded-xl border border-gray-100 bg-white p-6 hover:shadow-md transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-red-50 text-red-600 grid place-items-center">
                <d.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{d.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="py-20 bg-gradient-to-br from-gray-50 to-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">Tout ce qu'il faut pour livrer dans les délais</h2>
            <p className="mt-4 text-gray-500">Une suite intégrée qui couvre 100% du cycle projet, du cadrage au bilan.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: BarChart3, title: "Pilotage temps réel", desc: "Tableaux de bord dynamiques, KPI coût/délai/qualité, exports PDF & Excel." },
              { icon: Users, title: "Collaboration fluide", desc: "Messagerie, commentaires, partage de documents et historique complet." },
              { icon: Shield, title: "Gestion des risques", desc: "Identification, scoring impact/probabilité, plans d'action et suivi." },
              { icon: Sparkles, title: "IA décisionnelle", desc: "Prédiction des retards, allocation intelligente, assistant projet." },
              { icon: Zap, title: "Automatisations", desc: "Notifications, workflows, validations, relances automatiques." },
              { icon: Brain, title: "Recherche intelligente", desc: "Retrouvez n'importe quel document, tâche ou décision en secondes." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-100 bg-white p-6 hover:shadow-md transition-shadow">
                <f.icon className="h-5 w-5 text-red-600" />
                <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IA */}
      <section id="ia" className="py-20 max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Module IA différenciateur
            </span>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">L'IA qui anticipe, recommande et alerte.</h2>
            <p className="mt-4 text-gray-500">
              Notre moteur prédictif analyse vos données projet en continu pour détecter les dérives,
              optimiser l'allocation des ressources et fournir un assistant intelligent à vos chefs de projet.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              {[
                "Prédiction des retards avec score de probabilité",
                "Recommandation automatique d'allocation des ressources",
                "Détection précoce des risques techniques et budgétaires",
                "Assistant conversationnel par projet (chat IA)",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-red-600 mt-0.5" /> {i}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-6 space-y-3">
            {[
              { sev: "red", t: "Retard probable détecté", m: "RMQ-2025-004 — 78% de risque de dépasser la deadline." },
              { sev: "orange", t: "Surcharge équipe", m: "Yassine A. à 92% sur 4 semaines. Réallouer T8 ?" },
              { sev: "blue", t: "Économie possible", m: "Optimisation cloud RMQ-2025-003 : -8 200 €." },
            ].map((a) => (
              <div key={a.t} className={`rounded-xl border p-4 ${
                a.sev === 'red' ? 'bg-red-50 border-red-200' : 
                a.sev === 'orange' ? 'bg-orange-50 border-orange-200' : 
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  <Sparkles className={`h-4 w-4 mt-0.5 ${
                    a.sev === 'red' ? 'text-red-600' : 
                    a.sev === 'orange' ? 'text-orange-600' : 
                    'text-blue-600'
                  }`} />
                  <div>
                    <div className={`font-medium text-sm ${
                      a.sev === 'red' ? 'text-red-800' : 
                      a.sev === 'orange' ? 'text-orange-800' : 
                      'text-blue-800'
                    }`}>{a.t}</div>
                    <div className={`text-xs mt-1 ${
                      a.sev === 'red' ? 'text-red-600' : 
                      a.sev === 'orange' ? 'text-orange-600' : 
                      'text-blue-600'
                    }`}>{a.m}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-red-600 to-red-700 p-10 lg:p-16 text-center shadow-xl">
            <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Prêt à transformer votre pilotage projet ?
            </h2>
            <p className="mt-4 text-red-100 max-w-2xl mx-auto">
              Découvrez la plateforme RAMAQS Consulting  immédiatement . 
            </p>
            <Link
              to="/app"
              className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-white text-red-600 font-medium hover:shadow-lg hover:bg-gray-50 transition-all duration-200"
            >
              Accéder à la plateforme <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8">
  <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
    <div>© 2026 RAMAQS Consulting. Tous droits réservés.</div>
    <div className="flex gap-6">
      <Link 
        to="/mentions-legales" 
        className="hover:text-red-600 transition"
        activeProps={{ className: "text-red-600" }}
      >
        Mentions légales
      </Link>
      <Link 
        to="/confidentialite" 
        className="hover:text-red-600 transition"
        activeProps={{ className: "text-red-600" }}
      >
        Confidentialité
      </Link>
      <Link 
        to="/" 
        className="hover:text-red-600 transition"
        activeProps={{ className: "text-red-600" }}
      >
        Contact
      </Link>
    </div>
  </div>
</footer>
    </div>
  );
}