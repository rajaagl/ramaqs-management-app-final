import type  { ReactNode } from "react";
import { Building2 } from "lucide-react";

interface AuthCardProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  footer?: ReactNode;
}

export function AuthCard({ children, title, subtitle, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-border p-6 md:p-8 animate-in fade-in slide-in-from-right-8 duration-500">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <span className="text-primary-foreground font-bold text-xl">R</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {/* Content */}
        {children}

        {/* Footer */}
        {footer && (
          <div className="mt-6 pt-6 border-t border-border text-center">
            {footer}
          </div>
        )}

        {/* Entreprise */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3" />
          <span>Plateforme multi-tenant RAMAQS</span>
        </div>
      </div>
    </div>
  );
}