// src/routes/confidentialite.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Shield, Eye, Database, Lock, Cookie, FileText, 
  Mail, MapPin, Phone, CheckCircle, AlertCircle,
  ExternalLink, Printer, Download, Users, Clock,
  Server, Key, Fingerprint, Bell
} from "lucide-react";

export const Route = createFileRoute("/confidentialite")({
  component: ConfidentialitePage,
});

function ConfidentialitePage() {
  const currentYear = new Date().getFullYear();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white">
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
          <div className="flex items-center gap-3">
            <Link
              to="/mentions-legales"
              className="text-sm text-gray-600 hover:text-red-600 transition"
            >
              Mentions légales
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium hover:shadow-lg transition-all"
            >
              Accéder à la plateforme
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        {/* En-tête */}
        <div className="text-center py-8 bg-gradient-to-r from-red-50 to-white rounded-2xl border border-gray-100">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 shadow-lg mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Politique de confidentialité</h1>
          <p className="text-sm text-gray-500 mt-2">Dernière mise à jour : {currentYear}</p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-600 leading-relaxed">
            Cette politique de confidentialité s'applique au site ramaqs.ma édité par <strong>RAMAQS Consulting & Solution</strong>. 
            Nous nous engageons à protéger la vie privée de nos utilisateurs et à assurer la sécurité de leurs données personnelles 
            conformément au <strong>RGPD</strong> et à la <strong>législation marocaine</strong>.
          </p>
        </div>

        {/* Grille d'informations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Responsable du traitement */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-red-600" />
              <h2 className="font-semibold text-gray-900">1. Responsable du traitement</h2>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">RAMAQS Consulting & Solution</p>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-600">Bureau 26 Angle Rue Sebta, Rue LAAMRAOUI Rased RIAD, Kénitra 14000, Maroc</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href="mailto:siteweb@ramaqs.ma" className="text-sm text-red-600 hover:underline">siteweb@ramaqs.ma</a>
              </div>
            </div>
          </div>

          {/* Données collectées */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-red-600" />
              <h2 className="font-semibold text-gray-900">2. Données collectées</h2>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Données d'identification (nom, prénom, entreprise, email, téléphone)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Données de navigation (cookies, adresse IP, pages consultées)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Messages et demandes via le formulaire de contact</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Finalités du traitement */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">3. Finalités du traitement</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Répondre aux demandes et messages des utilisateurs",
              "Gérer les inscriptions aux formations et événements",
              "Améliorer le site et l'expérience utilisateur",
              "Réaliser des statistiques anonymes de fréquentation",
              "Assurer la sécurité du site"
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-red-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Base légale */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">4. Base légale</h2>
          </div>
          <p className="text-sm text-gray-600">
            Le traitement des données repose sur le consentement de l'utilisateur, l'exécution d'un contrat ou l'intérêt légitime de RAMAQS.
          </p>
        </div>

        {/* Destinataires */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">5. Destinataires des données</h2>
          </div>
          <p className="text-sm text-gray-600">
            Les données ne sont jamais transmises à des tiers sans consentement, sauf obligation légale ou prestataires techniques 
            (hébergement, maintenance) soumis à confidentialité.
          </p>
        </div>

        {/* Durée de conservation */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">6. Durée de conservation</h2>
          </div>
          <p className="text-sm text-gray-600">
            Les données sont conservées pendant la durée nécessaire au traitement de la demande ou conformément aux obligations légales. 
            Les données de contact sont supprimées après <strong>3 ans d'inactivité</strong>.
          </p>
        </div>

        {/* Droits des utilisateurs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Fingerprint className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">7. Droits des utilisateurs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              "Droit d'accès",
              "Droit de rectification",
              "Droit d'effacement",
              "Droit d'opposition",
              "Droit à la portabilité",
              "Droit de retirer son consentement"
            ].map((right, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-red-500" />
                <span>{right}</span>
              </div>
            ))}
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-600">
              Pour exercer vos droits, contactez-nous à :{' '}
              <a href="mailto:siteweb@ramaqs.ma" className="text-red-600 hover:underline">siteweb@ramaqs.ma</a>
            </p>
          </div>
        </div>

        {/* Sécurité */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">8. Sécurité</h2>
          </div>
          <p className="text-sm text-gray-600">
            RAMAQS met en œuvre des mesures techniques et organisationnelles pour garantir la sécurité et la confidentialité des données 
            (chiffrement, accès restreint, sauvegardes).
          </p>
        </div>

        {/* Cookies */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cookie className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">9. Cookies</h2>
          </div>
          <p className="text-sm text-gray-600">
            Le site utilise des cookies pour améliorer la navigation et réaliser des statistiques. 
            Vous pouvez gérer vos préférences via le bandeau cookies affiché lors de votre première visite.
          </p>
        </div>

        {/* Modifications */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">10. Modifications</h2>
          </div>
          <p className="text-sm text-gray-600">
            RAMAQS se réserve le droit de modifier la présente politique. La version en vigueur est celle publiée sur le site.
          </p>
        </div>

        {/* Résumé RGPD */}
        <div className="bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-100 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">Conformité RGPD</p>
              <p className="text-xs text-green-600">RAMAQS Consulting s'engage à respecter les réglementations européennes et marocaines</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">© {currentYear} RAMAQS Consulting. Tous droits réservés.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/mentions-legales" className="text-xs text-gray-400 hover:text-red-600 transition">
              Mentions légales
            </Link>
            <span className="text-xs text-gray-300">|</span>
            <Link to="/confidentialite" className="text-xs text-gray-400 hover:text-red-600 transition">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </main>

      {/* Bouton imprimer flottant */}
      <button
        onClick={handlePrint}
        className="fixed bottom-6 right-6 p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all hover:shadow-xl z-50"
        title="Imprimer"
      >
        <Printer className="h-5 w-5" />
      </button>
    </div>
  );
}

// Imports manquants
import { Building2, Scale, Target } from "lucide-react";