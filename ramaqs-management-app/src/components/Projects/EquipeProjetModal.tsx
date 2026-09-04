import { X, Mail, Phone, Loader2, Users, AlertCircle } from "lucide-react";
import { useGetProjetMembresQuery } from "@/store/api/api";

interface Props {
  projetId: string;
  projetNom: string;
  onClose: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  direction:   "Direction",
  chef_projet: "Chef de projet",
  consultant:  "Consultant",
  client:      "Client",
  partenaire:  "Partenaire",
};

const ROLE_COLORS: Record<string, string> = {
  direction:   "bg-purple-100 text-purple-700",
  chef_projet: "bg-blue-100 text-blue-700",
  consultant:  "bg-emerald-100 text-emerald-700",
  client:      "bg-amber-100 text-amber-700",
  partenaire:  "bg-pink-100 text-pink-700",
};

const ROLE_ORDER = ["chef_projet", "consultant", "client", "partenaire", "direction"];

export function EquipeProjetModal({ projetId, projetNom, onClose }: Props) {
  const { data, isLoading, isError } = useGetProjetMembresQuery(projetId);

  const sorted = data?.membres
    ? [...data.membres].sort(
        (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-50 grid place-items-center">
              <Users className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Équipe du projet</h2>
              <p className="text-xs text-gray-500 truncate max-w-[260px]">{projetNom}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Contenu */}
        <div className="overflow-y-auto flex-1 p-5 space-y-3">

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 className="h-7 w-7 animate-spin text-red-500" />
              <p className="text-sm">Chargement de l'équipe…</p>
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">Impossible de charger les membres.</p>
            </div>
          )}

          {!isLoading && !isError && sorted.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun membre assigné à ce projet.</p>
            </div>
          )}

          {sorted.map((membre) => (
            <div
              key={membre.id}
              className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition"
            >
              {/* Avatar initiales */}
              <div className="h-10 w-10 rounded-full bg-red-100 grid place-items-center shrink-0">
                <span className="text-sm font-semibold text-red-600">
                  {membre.nom.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {membre.nom}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[membre.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {ROLE_LABELS[membre.role] ?? membre.role}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
                  <a
                    href={`mailto:${membre.email}`}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[180px]">{membre.email}</span>
                  </a>

                  {membre.telephone && (
                    <a
                      href={`tel:${membre.telephone}`}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{membre.telephone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {!isLoading && sorted.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 shrink-0">
            <p className="text-xs text-gray-400 text-center">
              {sorted.length} membre{sorted.length > 1 ? "s" : ""} au total
            </p>
          </div>
        )}
      </div>
    </div>
  );
}