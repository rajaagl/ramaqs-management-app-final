// src/components/Projects/ImportExcelModal.tsx

import { useState, useRef } from "react";
import {
  X, UploadCloud, FileSpreadsheet, CheckCircle,
  AlertCircle, Loader2, Download, Info
} from "lucide-react";
import api from "@/lib/api";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface ResultatImport {
  projets_crees: number;
  projets: { id: string; nom: string; statut: string; budget: number }[];
  erreurs: string[];
}

export function ImportExcelModal({ onClose, onSuccess }: Props) {
  const [fichier, setFichier]       = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [resultat, setResultat]     = useState<ResultatImport | null>(null);
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext ?? '')) {
      setErreurGlobale('Seuls les fichiers .xlsx et .xls sont acceptés');
      return;
    }
    setFichier(f);
    setErreurGlobale(null);
    setResultat(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) pickFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!fichier) return;
    setIsLoading(true);
    setErreurGlobale(null);

    const fd = new FormData();
    fd.append('fichier', fichier);

    try {
      const { data } = await api.post('/projets/import-excel/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResultat(data);
      if (data.projets_crees > 0) onSuccess();
    } catch (err: any) {
      setErreurGlobale(
        err?.response?.data?.error ?? 'Erreur lors de l\'import'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Télécharger un fichier template
     const downloadTemplate = () => {
       const a    = document.createElement('a');
       a.href     = '/template_projets.xlsx';
       a.download = 'template_projets.xlsx';
       a.click();
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 grid place-items-center">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Importer des projets</h2>
              <p className="text-xs text-gray-500">Fichier Excel (.xlsx / .xls)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Info colonnes attendues */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-semibold mb-1">Colonnes attendues dans le fichier :</p>
               <p className="font-mono">
                 nom · description · statut · budget · domaine · date_debut · date_fin_prevue · chef_projet · client · partenaire
               </p>
              <p className="mt-1 text-blue-600">
                Les colonnes <strong>chef_projet</strong> et <strong>client</strong> , <strong>partenaire</strong> acceptent des emails.
              </p>
              <p className="mt-1 text-blue-600">
                Pour plusieurs secteurs, séparez les valeurs de la colonne <strong>domaine</strong> par des virgules ou des points-virgules.
              </p>
            </div>
          </div>

          {/* Zone de drop */}
          {!resultat && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <UploadCloud className={`h-10 w-10 mx-auto mb-3 ${dragActive ? 'text-emerald-500' : 'text-gray-400'}`} />
              {fichier ? (
                <div>
                  <p className="font-medium text-gray-800">{fichier.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(fichier.size / 1024).toFixed(1)} Ko — cliquez pour changer
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Glissez votre fichier Excel ici
                  </p>
                  <p className="text-xs text-gray-400 mt-1">ou cliquez pour parcourir</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
              />
            </div>
          )}

          {/* Erreur globale */}
          {erreurGlobale && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{erreurGlobale}</p>
            </div>
          )}

          {/* Résultat */}
          {resultat && (
            <div className="space-y-3">
              {/* Succès */}
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">
                  {resultat.projets_crees} projet{resultat.projets_crees > 1 ? 's' : ''} importé{resultat.projets_crees > 1 ? 's' : ''} avec succès
                </p>
              </div>

              {/* Liste des projets créés */}
              {resultat.projets.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
                  {resultat.projets.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-800">{p.nom}</span>
                      <span className="text-xs text-gray-400">
                        {p.budget.toLocaleString('fr-FR')} DH
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Erreurs par ligne */}
              {resultat.erreurs.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-2">
                    ⚠️ {resultat.erreurs.length} avertissement{resultat.erreurs.length > 1 ? 's' : ''} :
                  </p>
                  <ul className="space-y-1 max-h-28 overflow-y-auto">
                    {resultat.erreurs.map((err, i) => (
                      <li key={i} className="text-xs text-amber-600">• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition"
            >
              <Download className="h-4 w-4" /> Template
            </button>

            {!resultat ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleImport}
                  disabled={!fichier || isLoading}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Import en cours…</>
                    : <><FileSpreadsheet className="h-4 w-4" /> Importer</>
                  }
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
