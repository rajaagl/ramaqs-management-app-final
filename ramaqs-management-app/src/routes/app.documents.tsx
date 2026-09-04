import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Upload, FileText, Download, Trash2, X, Search, Filter,
  Loader2, FolderOpen, CheckCircle, AlertCircle, Info, Eye, UploadCloud,
} from "lucide-react";
import { useState, useRef } from "react";
import {
  useGetDocumentsQuery, useGetProjetsQuery,
  useUploadDocumentMutation, useDeleteDocumentMutation,
} from "../store/api/api";
import { useAppSelector } from "../store/store";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import type { Document, Projet } from "../store/interfaces";

type UserRole = "direction" | "chef_projet" | "consultant" | "client" | "partenaire";
type DocType = "livrable" | "document" | "rapport" | "contrat";

const TYPE_META: Record<DocType, { label: string; badge: string; dot: string }> = {
  livrable: { label: "Livrable", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  document: { label: "Document", badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  rapport:  { label: "Rapport",  badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  contrat:  { label: "Contrat",  badge: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
};

// Types autorisés à l'upload selon le rôle — ajustable, ce n'est qu'une suggestion UX
const UPLOAD_TYPES_BY_ROLE: Record<UserRole, DocType[]> = {
  direction:   ["livrable", "document", "rapport", "contrat"],
  chef_projet: ["livrable", "document", "rapport", "contrat"],
  consultant:  ["livrable", "document"],
  partenaire:  ["document", "contrat"],
  client:      ["document", "contrat"],
};

const SCOPE_MESSAGE: Record<UserRole, string> = {
  direction:   "Vous avez accès à tous les documents, tous projets confondus.",
  chef_projet: "Vous voyez tous les documents des projets dont vous êtes chef.",
  consultant:  "Vous voyez les livrables des projets sur lesquels vous intervenez, ainsi que vos propres fichiers.",
  partenaire:  "Vous voyez les livrables des projets où vous êtes partenaire, ainsi que vos propres fichiers.",
  client:      "Vous voyez les livrables de vos projets, ainsi que vos propres fichiers.",
};

const EXT_COLORS: Record<string, string> = {
  PDF: "bg-red-500", DOC: "bg-blue-500", DOCX: "bg-blue-500",
  XLS: "bg-emerald-500", XLSX: "bg-emerald-500",
  PPT: "bg-orange-500", PPTX: "bg-orange-500",
  PNG: "bg-purple-500", JPG: "bg-purple-500", JPEG: "bg-purple-500",
};

function getExt(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toUpperCase().slice(0, 4) : "FILE";
}

const MAX_FILE_MB = 20;

export const Route = createFileRoute("/app/documents")({
  component: () => (
    <ProtectedRoute allowedRoles={["direction", "chef_projet", "consultant", "client", "partenaire"]}>
      <DocumentsPage />
    </ProtectedRoute>
  ),
});

function DocumentsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role as UserRole;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedType, setSelectedType] = useState<DocType | "">("");
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    nom: "", description: "", type: "document" as DocType, projet: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documentsData, isLoading: docsLoading, error: docsError, refetch } =
    useGetDocumentsQuery({ page: 1, pageSize: 100 });
  const { data: projetsData, isLoading: projetsLoading } =
    useGetProjetsQuery({ page: 1, pageSize: 100 });
  const [uploadDocument] = useUploadDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();

  // Le backend a déjà filtré par rôle — ici on ne fait plus que de la recherche/affichage
  const allDocuments: Document[] = documentsData?.results ?? [];
  const projects: Projet[] = Array.isArray(projetsData) ? projetsData : (projetsData?.results ?? []);

  const filteredDocuments = allDocuments.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      (!q || d.name.toLowerCase().includes(q) || (d.description ?? "").toLowerCase().includes(q)) &&
      (!selectedProject || d.projectId === selectedProject) &&
      (!selectedType || d.type === selectedType)
    );
  });

  const getProjectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "Projet inconnu";

  const canDeleteDoc = (doc: Document) => {
    if (role === "direction") return true;
    if (role === "chef_projet") {
      const project = projects.find((p) => p.id === doc.projectId);
      return project?.chefProjetId === user?.id;
    }
    return false;
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Upload ──────────────────────────────────────────────────────────────
  const resetUploadForm = () => {
    setUploadForm({ nom: "", description: "", type: "document", projet: "" });
    setSelectedFile(null);
  };

  const pickFile = (file: File) => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      showToast(`Fichier trop volumineux (max ${MAX_FILE_MB} Mo)`, false);
      return;
    }
    setSelectedFile(file);
    if (!uploadForm.nom) setUploadForm((f) => ({ ...f, nom: file.name.replace(/\.[^/.]+$/, "") }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) pickFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadForm.projet) {
      showToast("Choisissez un fichier et un projet", false);
      return;
    }
    const fd = new FormData();
    fd.append("fichier", selectedFile);
    fd.append("nom", uploadForm.nom || selectedFile.name);
    fd.append("description", uploadForm.description);
    fd.append("type", uploadForm.type);
    fd.append("projet", uploadForm.projet);

    setIsUploading(true);
    try {
      await uploadDocument(fd).unwrap();
      showToast(`"${uploadForm.nom || selectedFile.name}" téléversé`);
      resetUploadForm();
      setShowUploadModal(false);
      refetch();
    } catch {
      showToast("Erreur lors du téléversement", false);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Suppression ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteDocument(id).unwrap();
      setConfirmDeleteId(null);
      setSelectedDoc(null);
      showToast("Document supprimé");
      refetch();
    } catch {
      showToast("Erreur lors de la suppression", false);
    } finally {
      setIsDeleting(false);
    }
  };

  const allowedUploadTypes = UPLOAD_TYPES_BY_ROLE[role] ?? ["document"];

  const stats = [
    { label: "Total", value: filteredDocuments.length },
    { label: "Livrables", value: filteredDocuments.filter((d) => d.type === "livrable").length },
    { label: "Mes fichiers", value: filteredDocuments.filter((d) => d.uploadById === user?.id).length },
    { label: "Projets", value: new Set(filteredDocuments.map((d) => d.projectId)).size },
  ];

  if (docsLoading || projetsLoading) {
    return (
      <AppShell title="Documents" subtitle="Chargement...">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      </AppShell>
    );
  }

  if (docsError) {
    return (
      <AppShell title="Documents" subtitle="Erreur">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-gray-600 font-medium">Impossible de charger les documents</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">
            Réessayer
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Documents"
      subtitle={`${filteredDocuments.length} fichier${filteredDocuments.length !== 1 ? "s" : ""}`}
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Rechercher…" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm w-52 outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-all ${
              showFilters || selectedProject || selectedType
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            <Filter className="h-4 w-4" /> Filtres
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold hover:shadow-lg transition-all active:scale-95"
          >
            <Upload className="h-4 w-4" /> Téléverser
          </button>
        </div>
      }
    >
      {toast && (
        <div className="fixed top-5 right-5 z-[100] animate-in fade-in slide-in-from-top-3 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
            toast.ok ? "bg-white border-emerald-200 text-gray-700" : "bg-white border-red-200 text-red-700"
          }`}>
            {toast.ok ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
            {toast.msg}
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* Bandeau de portée — transparence sur ce que voit le rôle courant */}
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <Info className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{SCOPE_MESSAGE[role]}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">{s.label}</span>
              <span className="text-2xl font-bold text-gray-800">{s.value}</span>
            </div>
          ))}
        </div>

        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Filtres</span>
              {(selectedProject || selectedType) && (
                <button onClick={() => { setSelectedProject(""); setSelectedType(""); }} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                  <X className="h-3 w-3" /> Réinitialiser
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-300">
                <option value="">Tous les projets</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as DocType | "")}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-300">
                <option value="">Tous les types</option>
                {Object.entries(TYPE_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">Aucun document</h3>
            <p className="text-sm text-gray-400">
              {role === "client" ? "Vos livrables apparaîtront ici dès qu'ils seront prêts." : "Téléversez le premier fichier de ce projet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => {
              const ext = getExt(doc.name);
              const meta = TYPE_META[doc.type];
              return (
                <div key={doc.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
                  onClick={() => setSelectedDoc(doc)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`h-11 w-11 rounded-xl grid place-items-center text-white text-[10px] font-bold ${EXT_COLORS[ext] ?? "bg-gray-400"}`}>
                      {ext}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={doc.chemin} download onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-gray-100" title="Télécharger">
                        <Download className="h-4 w-4 text-gray-500" />
                      </a>
                      {canDeleteDoc(doc) && (
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(doc.id); }} className="p-1.5 rounded-lg hover:bg-red-50" title="Supprimer">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="font-medium text-gray-900 truncate mb-1">{doc.name}</p>
                  <p className="text-xs text-gray-400 truncate mb-3">{doc.description || "—"}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${meta.badge}`}>{meta.label}</span>
                    <span className="text-xs text-gray-400">{doc.size}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <span className="truncate">{getProjectName(doc.projectId)}</span>
                    <span>{new Date(doc.uploadAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal upload */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Téléverser un document</h2>
              <button onClick={() => { setShowUploadModal(false); resetUploadForm(); }} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-5 space-y-4">
              <div
                onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragActive ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <UploadCloud className={`h-8 w-8 mx-auto mb-2 ${dragActive ? "text-red-500" : "text-gray-400"}`} />
                {selectedFile ? (
                  <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                ) : (
                  <p className="text-sm text-gray-500">Glissez un fichier ici ou cliquez pour choisir (max {MAX_FILE_MB} Mo)</p>
                )}
                <input ref={fileInputRef} type="file" className="hidden"
                  onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])} />
              </div>

              <input type="text" placeholder="Nom du document" value={uploadForm.nom}
                onChange={(e) => setUploadForm((f) => ({ ...f, nom: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none text-sm" />

              <textarea placeholder="Description (optionnel)" value={uploadForm.description}
                onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}
                rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none text-sm resize-none" />

              <select value={uploadForm.type} onChange={(e) => setUploadForm((f) => ({ ...f, type: e.target.value as DocType }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none text-sm">
                {allowedUploadTypes.map((t) => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
              </select>

              <select required value={uploadForm.projet} onChange={(e) => setUploadForm((f) => ({ ...f, projet: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none text-sm">
                <option value="">Sélectionner un projet</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium">
                  Annuler
                </button>
                <button type="submit" disabled={isUploading}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Téléverser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Détail document */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl grid place-items-center text-white text-[10px] font-bold ${EXT_COLORS[getExt(selectedDoc.name)] ?? "bg-gray-400"}`}>
                  {getExt(selectedDoc.name)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedDoc.name}</h2>
                  <p className="text-xs text-gray-500">{selectedDoc.size} · Version {selectedDoc.version}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-400">Projet</p><p className="font-medium">{getProjectName(selectedDoc.projectId)}</p></div>
                <div><p className="text-xs text-gray-400">Type</p><span className={`text-[10px] px-2 py-0.5 rounded-full border ${TYPE_META[selectedDoc.type].badge}`}>{TYPE_META[selectedDoc.type].label}</span></div>
                <div><p className="text-xs text-gray-400">Téléversé par</p><p className="font-medium">{selectedDoc.uploadBy}</p></div>
                <div><p className="text-xs text-gray-400">Date</p><p className="font-medium">{new Date(selectedDoc.uploadAt).toLocaleDateString("fr-FR")}</p></div>
              </div>
              {selectedDoc.description && <p className="text-sm text-gray-600 border-t border-gray-100 pt-3">{selectedDoc.description}</p>}
              <div className="flex gap-3 pt-2">
                <a href={selectedDoc.chemin} download className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium">
                  <Download className="h-4 w-4" /> Télécharger
                </a>
                {canDeleteDoc(selectedDoc) && (
                  <button onClick={() => setConfirmDeleteId(selectedDoc.id)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium">
                    <Trash2 className="h-4 w-4" /> Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5">
            <h3 className="font-bold text-gray-900 mb-2">Supprimer ce document ?</h3>
            <p className="text-sm text-gray-500 mb-4">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium">Annuler</button>
              <button onClick={() => handleDelete(confirmDeleteId)} disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}