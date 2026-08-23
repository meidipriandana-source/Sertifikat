import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, X, ShieldAlert, CheckSquare, Layers } from 'lucide-react';
import { Certificate } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate?: Certificate | null;
  certificates?: Certificate[];
  onConfirmDelete: (ids: string[]) => Promise<void> | void;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  certificate,
  certificates = [],
  onConfirmDelete,
  isDeleting = false
}) => {
  // Normalize items to delete
  const targetList: Certificate[] = certificates.length > 0 
    ? certificates 
    : certificate 
      ? [certificate] 
      : [];

  const isMultiple = targetList.length > 1;
  const singleCert = targetList[0];

  const handleConfirm = () => {
    const ids = targetList.map(c => c.id);
    onConfirmDelete(ids);
  };

  return (
    <AnimatePresence>
      {isOpen && targetList.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-colors"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            id="modal-delete-confirm"
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-rose-100 dark:border-rose-950/80 transition-all"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-rose-50 dark:border-rose-950/50 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
                  {isMultiple ? <Layers className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {isMultiple ? `Hapus ${targetList.length} Sertifikat Terpilih` : 'Konfirmasi Hapus'}
                  </h2>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Tindakan ini permanen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                {isMultiple ? (
                  <span>
                    Apakah Anda yakin ingin menghapus <strong className="text-slate-900 dark:text-white font-bold">{targetList.length} sertifikat</strong> yang telah dicontreng?
                  </span>
                ) : (
                  'Apakah Anda yakin ingin menghapus data sertifikat berikut?'
                )}
              </p>

              {isMultiple ? (
                /* Multi-Item Preview List */
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between pb-1">
                    <span>Daftar Sertifikat Terpilih ({targetList.length})</span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Semua data ini akan dihapus</span>
                  </div>
                  {targetList.map((c, index) => (
                    <div 
                      key={c.id} 
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                            {c.title}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {c.recipientName} • <span className="text-indigo-600 dark:text-indigo-400 font-medium">{c.category}</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {c.issueDate}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Single Item Preview */
                singleCert && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Nama Sertifikat
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mt-0.5">
                        {singleCert.title}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Pemilik / Penerima
                        </span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {singleCert.recipientName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Kategori
                        </span>
                        <p className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {singleCert.category}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight">
                  {isMultiple 
                    ? `Metadata ${targetList.length} sertifikat akan dihapus dari database lokal dan disinkronkan dari Google Drive.` 
                    : 'Data metadata pada database akan dihapus. File pada Google Drive juga akan disinkronisasi.'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-end gap-3">
              <button
                id="btn-cancel-delete"
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              
              <button
                id="btn-confirm-delete"
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-100 dark:shadow-rose-950/50 active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isDeleting 
                    ? 'Menghapus...' 
                    : isMultiple 
                      ? `Ya, Hapus (${targetList.length}) Sertifikat` 
                      : 'Ya, Hapus Sekarang'}
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
