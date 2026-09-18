// src/routes/mentions-legales.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Building2, Phone, Mail, Globe, MapPin, Shield, 
  FileText, Scale, ExternalLink, CheckCircle
} from "lucide-react";

export const Route = createFileRoute("/mentions-legales")({
  component: MentionsLegalesPage,
});

function MentionsLegalesPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white">
      {/* Header simple */}
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
          <Link
            to="/login"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium hover:shadow-lg transition-all"
          >
            Accéder à la plateforme
          </Link>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        {/* En-tête */}
        <div className="text-center py-8 bg-gradient-to-r from-red-50 to-white rounded-2xl border border-gray-100">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Mentions légales</h1>
          <p className="text-sm text-gray-500 mt-2">Dernière mise à jour : {currentYear}</p>
        </div>

        {/* Grille d'informations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Éditeur */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-red-600" />
              <h2 className="font-semibold text-gray-900">Éditeur du site</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400">Raison sociale</p>
                <p className="text-sm font-medium text-gray-800">RAMAQS Consulting</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Forme juridique</p>
                <p className="text-sm text-gray-800">Société de conseil en management</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Capital social</p>
                <p className="text-sm text-gray-800">100 000 MAD</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Registre du commerce</p>
                <p className="text-sm text-gray-800">Casablanca - RC 123456</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-red-600" />
              <h2 className="font-semibold text-gray-900">Contact</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400">Adresse</p>
                <div className="flex items-start gap-2 mt-0.5">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-800">Rabat, Maroc</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Téléphone</p>
                <a href="tel:+212530600900" className="text-sm text-red-600 hover:underline">+212 530 60 09 00</a>
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <a href="mailto:siteweb@ramaqs.ma" className="text-sm text-red-600 hover:underline">siteweb@ramaqs.ma</a>
              </div>
              <div>
                <p className="text-xs text-gray-400">Responsable publication</p>
                <p className="text-sm text-gray-800">Direction RAMAQS Consulting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hébergement */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">Hébergement</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Hébergeur</p>
              <p className="text-sm font-medium text-gray-800">OVH Cloud</p>
              <p className="text-xs text-gray-500 mt-1">2 rue Kellermann - 59100 Roubaix - France</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Infrastructure</p>
              <p className="text-sm font-medium text-gray-800">Serveurs sécurisés - Région EU</p>
              <p className="text-xs text-gray-500 mt-1">Certification ISO 27001</p>
            </div>
          </div>
        </div>

        {/* Protection des données */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">Protection des données</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Conformément à la loi n°09-08 relative à la protection des données personnelles, vous disposez d'un droit d'accès, 
            de rectification, de suppression et d'opposition.
          </p>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Déclaration CNPD</p>
              <p className="text-xs text-green-600">N° d'enregistrement : A-RM-2024-00123</p>
            </div>
          </div>
        </div>

        {/* Propriété intellectuelle */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">Propriété intellectuelle</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            L'ensemble des éléments composant le site est la propriété exclusive de RAMAQS Consulting et est protégé 
            par le droit d'auteur et les dispositions du Code de la propriété intellectuelle.
          </p>
        </div>

        {/* Cookies */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">Cookies</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Le site utilise des cookies pour améliorer l'expérience utilisateur. Vous pouvez paramétrer vos préférences à tout moment.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">© {currentYear} RAMAQS Consulting. Tous droits réservés.</p>
        </div>
      </main>

    </div>
  );
}
