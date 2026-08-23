import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileSpreadsheet, FileJson, Printer, Check, Copy, RotateCcw } from 'lucide-react';
import { Certificate } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: Certificate[];
  onOpenRestore?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  certificates,
  onOpenRestore
}) => {
  const [copied, setCopied] = useState(false);

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Nama Sertifikat',
      'Nama Pemilik',
      'Email Pemilik',
      'Tanggal Terbit',
      'Masa Berlaku / Kadaluarsa',
      'Lembaga Penerbit',
      'Kategori',
      'Nomor Kredensial',
      'Google Drive ID',
      'Google Drive Web View Link',
      'Google Drive Download Link',
      'Nama File',
      'Ukuran (Bytes)',
      'Tanggal Diunggah'
    ];

    const rows = certificates.map(c => [
      `"${c.id}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${(c.recipientName || '').replace(/"/g, '""')}"`,
      `"${(c.recipientEmail || '').replace(/"/g, '""')}"`,
      `"${c.issueDate}"`,
      `"${c.expiryDate ? c.expiryDate : 'Seumur Hidup'}"`,
      `"${(c.issuer || '').replace(/"/g, '""')}"`,
      `"${c.category}"`,
      `"${(c.credentialId || '').replace(/"/g, '""')}"`,
      `"${c.driveFileId}"`,
      `"${c.webViewLink}"`,
      `"${c.webContentLink || ''}"`,
      `"${(c.fileName || '').replace(/"/g, '""')}"`,
      c.fileSize,
      `"${c.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sertifikat_GoogleDrive_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(certificates, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `Sertifikat_GoogleDrive_Export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-colors"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            id="modal-export-data"
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 transition-all"
          >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Ekspor Data Sertifikat</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Unduh rekapan metadata dan tautan Google Drive</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Total <strong className="text-slate-900 dark:text-white font-bold">{certificates.length}</strong> data sertifikat siap diekspor dalam format berikut:
          </p>

          <div className="space-y-3">
            {/* CSV Option */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Format CSV (Excel)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Cocok untuk olah data di Microsoft Excel atau Google Sheets</p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
            </button>

            {/* JSON Option */}
            <button
              type="button"
              onClick={handleExportJSON}
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 shadow-xs">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Format JSON</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Struktur data lengkap untuk integrasi API & backup database</p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </button>

            {/* Print Option */}
            <button
              type="button"
              onClick={handlePrint}
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 shadow-xs">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400">Cetak Laporan (Print / PDF)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Cetak rekapitulasi data sertifikat ke dokumen fisik / PDF</p>
                </div>
              </div>
              <Printer className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            </button>
          </div>

          {/* Quick Restore Helper Note */}
          {onOpenRestore && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                  Ingin memulihkan data dari file cadangan sebelumnya?
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRestore();
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Buka Pulihkan Data
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
