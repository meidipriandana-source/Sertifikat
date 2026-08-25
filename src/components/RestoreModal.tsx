import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, UploadCloud, RotateCcw, AlertTriangle, CheckCircle, 
  FileText, ArrowRight, HardDrive, Database, ShieldAlert, Sparkles,
  Layers, RefreshCw, Download, Info, Check, Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Certificate } from '../types';
import { restoreCertificates, resetSampleCertificates } from '../services/api';
import { ExpiryIndicatorBadge } from './ExpiryIndicatorBadge';

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  currentCertificates: Certificate[];
}

export const RestoreModal: React.FC<RestoreModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentCertificates
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste' | 'sample'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [rawJsonText, setRawJsonText] = useState('');
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [metadataInfo, setMetadataInfo] = useState<{ exportDate?: string; app?: string } | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setRawJsonText('');
    setParsedData(null);
    setMetadataInfo(null);
    setErrorMessage(null);
    setConfirmStep(false);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateAndParseJSON = (jsonString: string, sourceName: string) => {
    setErrorMessage(null);
    try {
      const parsed = JSON.parse(jsonString);
      let certList: any[] = [];
      let meta: any = null;

      if (Array.isArray(parsed)) {
        certList = parsed;
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.certificates)) {
        certList = parsed.certificates;
        meta = {
          exportDate: parsed.exportDate,
          app: parsed.app || 'CertifyDrive'
        };
      } else {
        throw new Error('Format JSON tidak dikenali. Pastikan file berisi array sertifikat atau objek ekspor yang valid.');
      }

      if (certList.length === 0) {
        throw new Error('File cadangan tidak memuat data sertifikat apapun.');
      }

      // Quick sanity check on items
      const validItems = certList.filter(item => item && typeof item === 'object' && (item.title || item.recipientName));
      if (validItems.length === 0) {
        throw new Error('Tidak ditemukan sertifikat yang valid di dalam file ini.');
      }

      setParsedData(validItems);
      setMetadataInfo(meta);
    } catch (err: any) {
      setParsedData(null);
      setErrorMessage(`Gagal membaca ${sourceName}: ${err.message || 'Format JSON tidak valid'}`);
    }
  };

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.json')) {
      setErrorMessage('Harap pilih file dengan format .json yang diekspor dari aplikasi.');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      validateAndParseJSON(content, selectedFile.name);
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca isi file yang dipilih.');
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handlePasteChange = (text: string) => {
    setRawJsonText(text);
    if (text.trim()) {
      validateAndParseJSON(text, 'Teks JSON');
    } else {
      setParsedData(null);
      setErrorMessage(null);
    }
  };

  const executeRestore = async () => {
    if (!parsedData || parsedData.length === 0) {
      setErrorMessage('Tidak ada data valid yang siap dipulihkan.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const res = await restoreCertificates(parsedData, restoreMode);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      onSuccess(res.message);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memulihkan data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeResetSample = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const res = await resetSampleCertificates();

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      onSuccess(res.message);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mereset ke data contoh bawaan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCurrentBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      exportDate: new Date().toISOString(),
      app: "CertifyDrive",
      totalCount: currentCertificates.length,
      certificates: currentCertificates
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CertifyDrive_Backup_Emergency_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="modal-restore-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
        >
          <motion.div 
            key="modal-restore-card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 transition-all"
          >
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Pulihkan / Restore Data
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Impor file cadangan JSON atau kembalikan ke data contoh awal
              </p>
            </div>
          </div>
          <button
            id="btn-close-restore-modal"
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Tabs Navigation */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1.5 gap-1 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('file');
                resetState();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Unggah File JSON</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('paste');
                resetState();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tempel Teks JSON</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('sample');
                resetState();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sample'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Data Bawaan</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Terjadi Kesalahan Validasi</span>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* TAB 1: File Upload */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[0.99]'
                    : file
                    ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  file 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {file ? <CheckCircle className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                </div>

                <div>
                  {file ? (
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{file.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB • Klik untuk mengganti file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Klik untuk memilih file cadangan JSON atau seret ke sini
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        Mendukung file .json yang diekspor dari menu Ekspor Data
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Raw Text Paste */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Tempelkan Teks JSON Cadangan
              </label>
              <textarea
                value={rawJsonText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder="[ { &quot;title&quot;: &quot;Sertifikat Kelulusan...&quot;, &quot;recipientName&quot;: &quot;Nama...&quot; } ]"
                className="w-full h-36 px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-800 dark:text-slate-200 transition-all"
              />
            </div>
          )}

          {/* TAB 3: Reset to Sample Data */}
          {activeTab === 'sample' && (
            <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Pulihkan ke 5 Data Contoh Bawaan (Default Seed)
                  </h3>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1 leading-relaxed">
                    Tindakan ini akan mengembalikan data database sertifikat Anda ke 5 contoh sertifikat awal (termasuk sertifikat berbatas waktu, kadaluarsa, dan seumur hidup) yang siap dipakai untuk eksplorasi dan demonstrasi.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  Status database saat ini: <b>{currentCertificates.length} sertifikat</b>
                </span>
                <button
                  type="button"
                  onClick={executeResetSample}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Memulihkan...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Pulihkan Data Contoh Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PREVIEW & MODE SELECTION (if file/paste parsed successfully) */}
          {parsedData && parsedData.length > 0 && activeTab !== 'sample' && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
              
              {/* Summary of Detected Data */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {parsedData.length}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      {parsedData.length} Sertifikat Terdeteksi Siap Dipulihkan
                    </h4>
                    <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80">
                      {metadataInfo?.exportDate ? `Dicadangkan pada: ${new Date(metadataInfo.exportDate).toLocaleString('id-ID')}` : 'Struktur data valid'}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50">
                  <Check className="w-3 h-3" /> Valid & Siap Impor
                </span>
              </div>

              {/* Data Preview Table Mini */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Judul Sertifikat</th>
                      <th className="py-2 px-3">Penerima</th>
                      <th className="py-2 px-3">Kategori</th>
                      <th className="py-2 px-3">Masa Berlaku</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                    {parsedData.slice(0, 5).map((item, idx) => (
                      <tr key={`restore-row-${item.id || item.title || 'cert'}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-3 font-semibold truncate max-w-[140px]">{item.title || 'Tanpa Judul'}</td>
                        <td className="py-2 px-3 truncate max-w-[120px]">{item.recipientName || '-'}</td>
                        <td className="py-2 px-3">{item.category || 'Lainnya'}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <ExpiryIndicatorBadge expiryDate={item.expiryDate} variant="pill" />
                        </td>
                      </tr>
                    ))}
                    {parsedData.length > 5 && (
                      <tr>
                        <td colSpan={4} className="py-2 px-3 text-center text-slate-400 dark:text-slate-500 italic text-[10px] bg-slate-50/50 dark:bg-slate-900">
                          ...dan {parsedData.length - 5} sertifikat lainnya
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Pilih Mode Pemulihan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Mode 1: Merge */}
                  <div
                    onClick={() => setRestoreMode('merge')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      restoreMode === 'merge'
                        ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Gabungkan (Merge)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 leading-tight">
                      Tambahkan {parsedData.length} data baru ke database tanpa menghapus {currentCertificates.length} data yang sudah ada.
                    </p>
                  </div>

                  {/* Mode 2: Replace */}
                  <div
                    onClick={() => setRestoreMode('replace')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      restoreMode === 'replace'
                        ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
                        Timpa Penuh (Replace All)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 leading-tight">
                      Hapus semua data saat ini ({currentCertificates.length} item) dan ganti sepenuhnya dengan {parsedData.length} data baru.
                    </p>
                  </div>

                </div>
              </div>

              {/* Warning on Replace */}
              {restoreMode === 'replace' && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-[11px]">
                      Disarankan mengunduh cadangan darurat terlebih dahulu sebelum menimpa database.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={downloadCurrentBackup}
                    className="px-2.5 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Unduh Cadangan
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>

          {activeTab !== 'sample' && parsedData && parsedData.length > 0 && (
            <button
              id="btn-execute-restore"
              type="button"
              onClick={executeRestore}
              disabled={isProcessing}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                restoreMode === 'replace'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-rose-950/50'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-indigo-950/50'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses Pemulihan...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {restoreMode === 'merge' ? `Gabungkan ${parsedData.length} Sertifikat` : `Timpa & Pulihkan ${parsedData.length} Data`}
                  </span>
                </>
              )}
            </button>
          )}
        </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
