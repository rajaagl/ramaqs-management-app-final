// src/components/Dashboard/ExportModal.tsx

import { useState } from "react";
import { X, FileSpreadsheet, FileText, Loader2, Download, CheckCircle, ChevronRight } from "lucide-react";
import * as XLSX from 'xlsx';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projets: any[];
  taches: any[];
  stats: any;
}

export function ExportModal({ isOpen, onClose, projets, taches, stats }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'pdf' | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fonction de formatage securisee
  const formatBudget = (value: number | string | null | undefined): string => {
  if (!value) return '0 DH';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0 DH';
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};
  if (!isOpen) return null;

  // Exporter en Excel
  const exportToExcel = async () => {
    setSelectedFormat('excel');
    setIsExporting(true);
    setIsSuccess(false);
    
    try {
      const data = [
        ['RAMAQS Consulting - Rapport du Dashboard'],
        [`Date: ${new Date().toLocaleDateString('fr-FR')}`],
        [''],
        ['STATISTIQUES GENERALES'],
        ['Indicateur', 'Valeur'],
        ['Projets', projets.length],
        ['Taches', taches.length],
        ['Budget Total', formatBudget(stats.budgetTotal)],
        ['Budget Depense', formatBudget(stats.budgetConsomme)],
        ["Taux d'utilisation", `${stats.tauxBudget || 0}%`],
        ['Avancement moyen', `${stats.avancementMoyen || 0}%`],
        [''],
        ['LISTE DES PROJETS'],
        ['Nom', 'Statut', 'Budget', 'Avancement', 'Date creation'],
        ...projets.map((p: any) => [
          p.nom || p.name || 'Sans nom',
          p.statut === 'en_cours' ? 'En cours' : 
          p.statut === 'planifie' ? 'Planifie' : 
          p.statut === 'termine' ? 'Termine' : p.statut || 'Non defini',
          formatBudget(p.budget),
          `${p.avancement_globale || p.progress || 0}%`,
          new Date(p.date_creation || p.created_at || Date.now()).toLocaleDateString('fr-FR')
        ])
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      ws['!cols'] = [
        { wch: 35 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Dashboard');
      
      const fileName = `RAMAQS_Dashboard_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        resetStates();
      }, 1500);
      
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  // Exporter en PDF
  const exportToPDF = async () => {
    setSelectedFormat('pdf');
    setIsExporting(true);
    setIsSuccess(false);
    
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Titre
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor('#ef4444');
      doc.text('RAMAQS Consulting', 14, 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor('#333333');
      doc.text('Rapport du Dashboard', 14, 30);
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`, 14, 38);
      
      // Statistiques
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor('#333333');
      doc.text('Statistiques Generales', 14, 50);
      
      const statsData = [
        ['Indicateur', 'Valeur'],
        ['Projets', projets.length],
        ['Taches', taches.length],
        ['Budget Total', formatBudget(stats.budgetTotal)],
        ['Budget Depense', formatBudget(stats.budgetConsomme)],
        ["Taux d'utilisation", `${stats.tauxBudget || 0}%`],
        ['Avancement moyen', `${stats.avancementMoyen || 0}%`]
      ];
      
      autoTable(doc, {
        startY: 55,
        head: [statsData[0]],
        body: statsData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: '#ef4444', textColor: '#ffffff' },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 80 }
        }
      });
      
      // Liste des projets
      const startY = (doc as any).lastAutoTable?.finalY + 15 || 100;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Liste des Projets', 14, startY);
      
      const projectData = projets.map((p: any) => [
        p.nom || p.name || 'Sans nom',
        p.statut === 'en_cours' ? 'En cours' : 
        p.statut === 'planifie' ? 'Planifie' : 
        p.statut === 'termine' ? 'Termine' : p.statut || 'Non defini',
        formatBudget(p.budget),
        `${p.avancement_globale || p.progress || 0}%`
      ]);
      
      autoTable(doc, {
        startY: startY + 10,
        head: [['Nom', 'Statut', 'Budget', 'Avancement']],
        body: projectData,
        theme: 'striped',
        headStyles: { fillColor: '#ef4444', textColor: '#ffffff' },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 }
        }
      });
      
      // Footer
      const pageCount = doc.internal.pages.length - 1;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor('#999999');
      doc.text(`Page 1 sur ${pageCount}`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR')}`, 
        doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 10);
      
      doc.save(`RAMAQS_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        resetStates();
      }, 1500);
      
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const resetStates = () => {
    setSelectedFormat(null);
    setIsExporting(false);
    setIsSuccess(false);
  };

  const handleClose = () => {
    if (!isExporting) {
      resetStates();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        
        {/* En-tete */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Download className="h-5 w-5 text-red-600" />
              Exporter le rapport
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Choisissez le format d'export</p>
          </div>
          <button 
            onClick={handleClose} 
            disabled={isExporting}
            className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Export termine</h3>
              <p className="text-sm text-gray-500 mt-1">
                Le fichier a ete telecharge avec succes
              </p>
            </div>
          ) : isExporting ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900">Export en cours...</h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedFormat === 'excel' ? 'Generation du fichier Excel' : 'Generation du fichier PDF'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Selectionnez le format d'export
              </p>
              
              <button
                onClick={exportToExcel}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">Excel</p>
                  <p className="text-xs text-gray-500">Fichier .xlsx pour analyse</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition" />
              </button>
              
              <button
                onClick={exportToPDF}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">PDF</p>
                  <p className="text-xs text-gray-500">Rapport format imprimable</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-red-600 transition" />
              </button>
            </div>
          )}
        </div>

        {/* Pied de page */}
        {!isSuccess && !isExporting && (
          <div className="flex gap-3 p-5 pt-0">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}