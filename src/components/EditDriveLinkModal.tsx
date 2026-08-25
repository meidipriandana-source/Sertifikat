import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Link2, 
  ExternalLink, 
  Check, 
  X, 
  Save, 
  FileText, 
  Folder, 
  AlertCircle, 
  CheckCircle2, 
  Clipboard, 
  RefreshCw 
} from 'lucide-react';
import { Certificate } from '../types';
import { updateCertificate } from '../services/api';
import { parseGoogleDriveLink } from '../utils/drive';

interface EditDriveLinkModalProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: Certificate) => void;
}

export const EditDriveLinkModal: React.FC<EditDriveLinkModalProps> = ({
  certificate,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (certificate && isOpen) {
      setInputUrl(certificate.webViewLink || '');
      setErrorMsg('');
      setSaveSuccess(false);
    }
  }, [certificate, isOpen]);

  if (!certificate && !isOpen) return null;

  const parsed = parseGoogleDriveLink(inputUrl);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text.trim());
      }
    } catch {
      // Clipboard read may be blocked in some browser permissions
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificate) return;

    if (!inputUrl.trim()) {
      setErrorMsg('Tautan Google Drive tidak boleh kosong.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');

      const cleanWebViewLink = parsed.isValid ? parsed.webViewLink : inputUrl.trim();
      const cleanDriveFileId = parsed.isValid ? parsed.driveId : certificate.driveFileId;
      const cleanWebContentLink = parsed.webContentLink || certificate.webContentLink;
      const cleanThumbnailLink = parsed.thumbnailLink || certificate.thumbnailLink;

      const updated = await updateCertificate(certificate.id, {
        webViewLink: cleanWebViewLink,
        driveFileId: cleanDriveFileId,
        webContentLink: cleanWebContentLink,
        thumbnailLink: cleanThumbnailLink
      });

      setSaveSuccess(true);
      onUpdate(updated);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan perubahan tautan Google Drive.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-edit-drive-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
        >
          <motion.div
            key="modal-edit-drive-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col"
          >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Ubah Tautan Google Drive
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Perbarui URL tautan berkas sertifikat di Google Drive
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSave} className="p-6 space-y-4">
            {/* Target Certificate Info */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Sertifikat yang diubah:
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                {certificate.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pemilik: <span className="font-semibold text-slate-700 dark:text-slate-300">{certificate.recipientName}</span> • ID: <span className="font-mono text-slate-600 dark:text-slate-400">{certificate.credentialId || '-'}</span>
              </p>
            </div>

            {/* Input Google Drive URL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Tautan / URL Google Drive Baru</span>
                </label>

                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <Clipboard className="w-3 h-3" />
                  <span>Tempel (Paste)</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="https://drive.google.com/file/d/... atau https://drive.google.com/drive/folders/..."
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all pr-10 font-mono"
                  autoFocus
                />
                {inputUrl && (
                  <button
                    type="button"
                    onClick={() => setInputUrl('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Format yang didukung: Link berbagi file Google Drive (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">/file/d/ID</code>), Link folder (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">/folders/ID</code>), atau ID file langsung.
              </p>
            </div>

            {/* Parsing Detection Card */}
            {inputUrl.trim() && (
              <div className={`p-3 rounded-xl border text-xs flex flex-col gap-2 transition-all ${
                parsed.isValid 
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200' 
                  : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {parsed.isValid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Tautan Google Drive Valid Terdeteksi</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Tautan Kustom / Standar</span>
                      </>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/80 dark:bg-slate-800/80 border border-current">
                    {parsed.isFolder ? <Folder className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    <span>{parsed.isFolder ? 'Folder Drive' : 'File Dokumen'}</span>
                  </span>
                </div>

                {parsed.driveId && (
                  <div className="font-mono text-[11px] opacity-90 truncate">
                    <strong>Drive ID:</strong> {parsed.driveId}
                  </div>
                )}

                {/* Test open button */}
                <div className="pt-1 flex justify-end">
                  <a
                    href={parsed.isValid ? parsed.webViewLink : inputUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors"
                  >
                    <span>Uji Buka Tautan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSaving || saveSuccess}
                className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 text-white shadow-xs transition-all cursor-pointer ${
                  saveSuccess 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'
                }`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Tautan</span>
                  </>
                )}
              </button>
            </div>
          </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
