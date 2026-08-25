import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, AlertTriangle, X, Layers, Users, HardDrive, 
  Tag, Search, CheckSquare, ShieldAlert, FileText, CheckCircle2,
  FileCheck2, ArrowRight
} from 'lucide-react';
import { Certificate, CategoryItem } from '../types';
import { getCategoryTheme } from '../utils/categoryColors';

interface BulkDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: Certificate[];
  onConfirmDelete: (ids: string[]) => Promise<void> | void;
  isDeleting?: boolean;
  categoriesList?: CategoryItem[];
  onRemoveFromQueue?: (certId: string) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const BulkDeleteConfirmModal: React.FC<BulkDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  certificates = [],
  onConfirmDelete,
  isDeleting = false,
  categoriesList,
  onRemoveFromQueue
}) => {
  // Local list in case user excludes items within modal
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  // Active items to be deleted after filtering out excluded ones
  const activeCerts = useMemo(() => {
    return certificates.filter(c => !excludedIds.has(c.id));
  }, [certificates, excludedIds]);

  // Reset local state when modal opens or certificates change
  React.useEffect(() => {
    if (isOpen) {
      setExcludedIds(new Set());
      setSearchFilter('');
      setIsAcknowledged(false);
    }
  }, [isOpen, certificates]);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalCount = activeCerts.length;
    const uniqueRecipients = new Set(activeCerts.map(c => (c.recipientName || '').trim()).filter(Boolean));
    const totalBytes = activeCerts.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);

    // Breakdown per category
    const categoryMap = new Map<string, number>();
    activeCerts.forEach(c => {
      const cat = c.category || 'Lainnya';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
      theme: getCategoryTheme(name, categoriesList)
    }));

    return {
      totalCount,
      uniqueRecipientsCount: uniqueRecipients.size,
      totalBytesFormatted: formatBytes(totalBytes),
      categoryBreakdown
    };
  }, [activeCerts, categoriesList]);

  // Filtered list for in-modal search
  const displayedCerts = useMemo(() => {
    if (!searchFilter.trim()) return activeCerts;
    const q = searchFilter.toLowerCase().trim();
    return activeCerts.filter(c => 
      c.title.toLowerCase().includes(q) ||
      c.recipientName.toLowerCase().includes(q) ||
      (c.issuer && c.issuer.toLowerCase().includes(q)) ||
      (c.credentialId && c.credentialId.toLowerCase().includes(q)) ||
      c.category.toLowerCase().includes(q)
    );
  }, [activeCerts, searchFilter]);

  const handleExcludeItem = (id: string) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    if (onRemoveFromQueue) {
      onRemoveFromQueue(id);
    }
  };

  const handleRestoreAll = () => {
    setExcludedIds(new Set());
  };

  const handleConfirm = () => {
    const idsToDelete = activeCerts.map(c => c.id);
    if (idsToDelete.length > 0) {
      onConfirmDelete(idsToDelete);
    }
  };

  if (!isOpen || certificates.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div 
        key="modal-bulk-delete-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-colors"
      >
        <motion.div 
          key="modal-bulk-delete-card"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          id="modal-bulk-delete-confirm"
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-rose-200/80 dark:border-rose-900/60 transition-all flex flex-col max-h-[92vh]"
        >
          {/* Top Header */}
          <div className="px-6 py-4.5 border-b border-rose-100 dark:border-rose-950/60 flex items-center justify-between bg-gradient-to-r from-rose-50/80 via-white to-rose-50/40 dark:from-rose-950/40 dark:via-slate-900 dark:to-rose-950/20">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Konfirmasi Penghapusan Massal
                  </h2>
                  <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px] rounded-full border border-rose-200 dark:border-rose-800">
                    {activeCerts.length} Item
                  </span>
                </div>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                  Tinjau ringkasan item sebelum melakukan penghapusan permanen
                </p>
              </div>
            </div>
            <button
              id="btn-close-bulk-delete-modal"
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              title="Tutup dialog"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 space-y-5 overflow-y-auto text-xs flex-1">
            
            {/* Warning Callout */}
            <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-rose-950 dark:text-rose-100">
                  Perhatian: Tindakan Ini Tidak Dapat Dibatalkan
                </h4>
                <p className="text-[11px] text-rose-800 dark:text-rose-300/90 leading-relaxed">
                  Sebanyak <strong className="font-bold">{activeCerts.length} berkas sertifikat</strong> yang dipilih akan dihapus secara permanen dari basis data dan daftar riwayat sertifikat.
                </p>
              </div>
            </div>

            {/* SUMMARY STATS GRID (Ringkasan Jumlah & Informasi) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Ringkasan Item Yang Akan Dihapus</span>
                </span>
                {excludedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleRestoreAll}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    Kembalikan {excludedIds.size} Item yang Dikecualikan
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Metric 1: Total Certificates */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-[10px] font-semibold">Total Sertifikat</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {summary.totalCount} <span className="text-xs font-normal text-slate-500">Berkas</span>
                  </p>
                </div>

                {/* Metric 2: Unique Recipients */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-semibold">Penerima Terdampak</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {summary.uniqueRecipientsCount} <span className="text-xs font-normal text-slate-500">Orang</span>
                  </p>
                </div>

                {/* Metric 3: Total Size */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-semibold">Total Ukuran</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {summary.totalBytesFormatted}
                  </p>
                </div>
              </div>

              {/* Category Breakdown Badges */}
              {summary.categoryBreakdown.length > 0 && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span>Distribusi Kategori Terdampak:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.categoryBreakdown.map((cat, idx) => (
                      <span 
                        key={`bulk-cat-badge-${cat.name}-${idx}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs ${cat.theme.bg} ${cat.theme.text} ${cat.theme.border}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${cat.theme.dot}`} />
                        <span>{cat.name}</span>
                        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-md bg-white/70 dark:bg-black/30">
                          {cat.count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ITEM PREVIEW LIST WITH IN-MODAL SEARCH */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Daftar Sertifikat Terpilih ({activeCerts.length})</span>
                </span>
                
                {/* In-modal search box */}
                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Cari dalam daftar pilihan..."
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus:ring-1 focus:ring-rose-500 outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                </div>
              </div>

              {/* Items container */}
              <div 
                id="container-bulk-delete-items"
                className="space-y-2 max-h-52 overflow-y-auto pr-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50"
              >
                {displayedCerts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Tidak ada sertifikat yang cocok dengan pencarian di atas.
                  </div>
                ) : (
                  displayedCerts.map((cert, index) => {
                    const catTheme = getCategoryTheme(cert.category, categoriesList);
                    return (
                      <div 
                        key={`bulk-del-item-${cert.id}-${index}`}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-3 shadow-2xs group hover:border-rose-200 dark:hover:border-rose-900/60 transition-colors"
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                              {cert.title}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                {cert.recipientName}
                              </span>
                              <span>&bull;</span>
                              <span className={`px-1.5 py-0.2 rounded font-semibold ${catTheme.bg} ${catTheme.text}`}>
                                {cert.category}
                              </span>
                              {cert.credentialId && (
                                <>
                                  <span>&bull;</span>
                                  <span className="font-mono text-slate-400">ID: {cert.credentialId}</span>
                                </>
                              )}
                              {cert.fileSize ? (
                                <>
                                  <span>&bull;</span>
                                  <span>{formatBytes(cert.fileSize)}</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Button to remove from deletion queue */}
                        <button
                          type="button"
                          onClick={() => handleExcludeItem(cert.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Keluarkan item ini dari daftar yang akan dihapus"
                          aria-label={`Keluarkan ${cert.title} dari antrean hapus`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SAFETY CONFIRMATION CHECKBOX */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
              <label 
                htmlFor="check-bulk-delete-confirm"
                className="flex items-start gap-2.5 cursor-pointer select-none"
              >
                <input
                  id="check-bulk-delete-confirm"
                  type="checkbox"
                  checked={isAcknowledged}
                  onChange={(e) => setIsAcknowledged(e.target.checked)}
                  disabled={isDeleting || activeCerts.length === 0}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">Saya mengonfirmasi:</strong> Saya telah meninjau <span className="font-bold text-rose-600 dark:text-rose-400">{activeCerts.length} berkas sertifikat</span> di atas dan memahami bahwa data ini akan dihapus secara permanen.
                </span>
              </label>
            </div>

          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              {activeCerts.length === 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">Semua item telah dikeluarkan dari antrean.</span>
              ) : (
                <span>Menghapus <strong className="text-slate-900 dark:text-white font-bold">{activeCerts.length}</strong> dari {certificates.length} item</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                id="btn-cancel-bulk-delete"
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer w-full sm:w-auto text-center"
              >
                Batal
              </button>
              
              <button
                id="btn-confirm-bulk-delete"
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting || activeCerts.length === 0 || !isAcknowledged}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 dark:disabled:bg-rose-950/60 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-rose-200 dark:shadow-rose-950/40 active:scale-95 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isDeleting 
                    ? `Menghapus ${activeCerts.length} Sertifikat...` 
                    : `Hapus Permanen (${activeCerts.length}) Sertifikat`}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
