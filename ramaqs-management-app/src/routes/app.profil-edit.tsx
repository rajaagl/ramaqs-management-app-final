import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Save, X, User, Mail, Phone, Briefcase, Calendar } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/profil-edit")({
  component: ProfilEditPage,
});

function ProfilEditPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: "Salma Bennani",
    email: "salma.bennani@ramaqs.com",
    telephone: "+212 6 12 34 56 78",
    poste: "Directrice projets",
    departement: "Direction des projets",
    dateEntree: "2023-01-15",
    bio: "Experte en transformation digitale et pilotage de projets complexes.",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Données sauvegardées :", formData);
    // Ici, appel API pour sauvegarder
    navigate({ to: "/app/profil" });
  };

  return (
    <AppShell
      title="Modifier mon profil"
      subtitle="Modifiez vos informations personnelles"
      hideSearch={true}
      actions={
        <div className="flex gap-2">
          <Link
            to="/app/profil"
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card text-sm hover:bg-muted"
          >
            <X className="h-4 w-4" /> Annuler
          </Link>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-sm"
          >
            <Save className="h-4 w-4" /> Enregistrer
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-4 max-w-2xl mx-auto">
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {/* Nom */}
          <div className="flex items-center gap-4 p-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Nom complet</p>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-border focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4 p-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-border focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div className="flex items-center gap-4 p-4">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Téléphone</p>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-border focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Poste */}
          <div className="flex items-center gap-4 p-4">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Poste</p>
              <input
                type="text"
                name="poste"
                value={formData.poste}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-border focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Département */}
          <div className="flex items-center gap-4 p-4">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Département</p>
              <input
                type="text"
                name="departement"
                value={formData.departement}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-border focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Date d'entrée */}
          <div className="flex items-center gap-4 p-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Date d'entrée</p>
              <input
                type="date"
                name="dateEntree"
                value={formData.dateEntree}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-border focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="flex items-start gap-4 p-4">
            <User className="h-5 w-5 text-muted-foreground mt-1" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Bio</p>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full bg-transparent border border-border rounded-lg p-2 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}