import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Settings, Bell, Lock, User, Globe } from "lucide-react";
import { ProtectedRoute } from "#/components/ui/ProtectedRoute";

export const Route = createFileRoute("/app/parametres")({
  component: () => (
          <ProtectedRoute allowedRoles={['direction', 'super_admin']}>
            <ParametresPage />
          </ProtectedRoute>
        ),
});

function ParametresPage() {
  return (
    <AppShell
      title="Paramètres"
      subtitle="Gérez vos préférences"
      hideSearch={true}
    >
      <div className="p-4 max-w-2xl mx-auto">
        <div className="space-y-2">
          <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/40 cursor-pointer">
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <h3 className="font-medium">Mon profil</h3>
              <p className="text-sm text-muted-foreground">Modifier vos informations personnelles</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/40 cursor-pointer">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <h3 className="font-medium">Notifications</h3>
              <p className="text-sm text-muted-foreground">Configurer vos alertes</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/40 cursor-pointer">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <h3 className="font-medium">Sécurité</h3>
              <p className="text-sm text-muted-foreground">Changer votre mot de passe</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/40 cursor-pointer">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <h3 className="font-medium">Préférences</h3>
              <p className="text-sm text-muted-foreground">Langue, thème, fuseau horaire</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
