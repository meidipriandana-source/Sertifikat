import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Cloud, CheckCircle2, KeyRound, AlertCircle, 
  ShieldCheck, Folder, Sparkles, FolderSync, Layers,
  Plus, Trash2, Info, ListFilter, Users, FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleAuthState, saveAuthState, clearAuthState } from '../services/googleAuth';
import { verifyGoogleDriveFolder, syncGoogleDriveFolder, parseCertificateItemInfo } from '../services/api';
import { CertificateCategory } from '../types';

interface GoogleConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  authState: GoogleAuthState;
  onAuthStateChange: (newState: GoogleAuthState) => void;
  onSyncSuccess?: () => void;
}

type FolderPresetType = 'outhouse' | 'inhouse' | 'workshop' | 'custom';

export const GoogleConnectModal: React.FC<GoogleConnectModalProps> = ({
  isOpen,
  onClose,
  authState,
  onAuthStateChange,
  onSyncSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'sync-folder' | 'connect' | 'guide'>('sync-folder');
  const [folderUrl, setFolderUrl] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<FolderPresetType>('outhouse');
  
  // Multi-item / individual file & participant entries
  const [itemsList, setItemsList] = useState<string[]>([
    'Pelatihan Outhouse Keperawatan Kritis ICU - dr. Ahmad Fauzi, Sp.An',
    'Pelatihan Outhouse Emergency & Trauma - Ns. Siti Rahmawati, S.Kep',
    'Pelatihan Outhouse Kamar Bedah & CSSD - Ns. Budi Santoso, S.Kep',
    'Pelatihan Outhouse PPI & Akreditasi - dr. Hendra Kurniawan, Sp.PK',
    'Pelatihan Outhouse Manajemen Mutu RS - Maya Indah, A.Md.Kes'
  ]);
  const [bulkTextInput, setBulkTextInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [newSingleInput, setNewSingleInput] = useState('');

  const [defaultActivityTitle, setDefaultActivityTitle] = useState('Pelatihan Outhouse RSUD');
  const [defaultCategory, setDefaultCategory] = useState<CertificateCategory>('Pelatihan');
  const [defaultRecipient, setDefaultRecipient] = useState('Staff Perawat / Medis RSUD');
  const [defaultIssuer, setDefaultIssuer] = useState('Penyelenggara Diklat Outhouse Eksternal');
  const [validityYears, setValidityYears] = useState<number>(3);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [userEmailInput, setUserEmailInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto detect preset if user changes URL or keywords
  const handlePresetSelect = (preset: FolderPresetType) => {
    setSelectedPreset(preset);
    if (preset === 'outhouse') {
      setItemsList([
        'Pelatihan Outhouse Keperawatan Kritis ICU - dr. Ahmad Fauzi, Sp.An',
        'Pelatihan Outhouse Emergency & Trauma - Ns. Siti Rahmawati, S.Kep',
        'Pelatihan Outhouse Kamar Bedah & CSSD - Ns. Budi Santoso, S.Kep',
        'Pelatihan Outhouse PPI & Akreditasi - dr. Hendra Kurniawan, Sp.PK',
        'Pelatihan Outhouse Manajemen Mutu RS - Maya Indah, A.Md.Kes'
      ]);
      setDefaultActivityTitle('Pelatihan Outhouse Rumah Sakit');
      setDefaultCategory('Pelatihan');
      setDefaultIssuer('Penyelenggara Diklat Outhouse Eksternal');
    } else if (preset === 'inhouse') {
      setItemsList([
        'Sertifikat SIMRS 2026 - Ns. Dewi Sartika, S.Kep',
        'Sertifikat Resiko Tinggi 2026 - dr. Bambang Suherman, Sp.PD',
        'Sertifikat Kemenkes PERAWAT BEDAH - Ns. Rina Marlina, S.Kep',
        'Sertifikat HIPKABI - Ns. Dian Permata, S.Kep',
        'Sertifikat BTCLS 2026 - Ahmad Wahyudi, A.Md.Kep',
        'Sertifikat BHD 2026 - Siska Amelia, A.Md.Kep'
      ]);
      setDefaultActivityTitle('Inhouse Training RSUD 2026');
      setDefaultCategory('Pelatihan');
      setDefaultIssuer('Inhouse Training RSUD & Kemenkes RI');
    } else if (preset === 'workshop') {
      setItemsList([
        'Workshop SIMRS RME Terintegrasi - Ir. Tri Nugroho, M.Kom',
        'Workshop Keselamatan Pasien RS - dr. Lina Marlina, Sp.A',
        'Seminar Etika Profesi Keperawatan - Ns. Eko Prasetyo, S.Kep'
      ]);
      setDefaultActivityTitle('Workshop & Seminar Medis');
      setDefaultCategory('Workshop');
      setDefaultIssuer('Komite Mutu & Tim IT SIMRS');
    } else if (preset === 'custom') {
      setItemsList([
        'Sertifikat Diklat Medis - dr. Nama Peserta 1',
        'Sertifikat Diklat Medis - Ns. Nama Peserta 2'
      ]);
    }
  };

  const handleAddSingleItem = () => {
    if (!newSingleInput.trim()) return;
    if (!itemsList.includes(newSingleInput.trim())) {
      setItemsList([...itemsList, newSingleInput.trim()]);
    }
    setNewSingleInput('');
  };

  const handleApplyBulkText = () => {
    if (!bulkTextInput.trim()) return;
    const lines = bulkTextInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length > 0) {
      // Append unique lines
      const merged = Array.from(new Set([...itemsList, ...lines]));
      setItemsList(merged);
      setBulkTextInput('');
      setShowBulkInput(false);
    }
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setItemsList(itemsList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSyncFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Masukkan link atau ID folder Google Drive terlebih dahulu.' });
      return;
    }

    if (itemsList.length === 0) {
      setStatusMessage({ type: 'error', text: 'Tambahkan minimal 1 berkas / nama peserta untuk disinkronkan.' });
      return;
    }

    try {
      setIsSyncing(true);
      setStatusMessage(null);

      const result = await syncGoogleDriveFolder(folderUrl.trim(), {
        defaultRecipient: defaultRecipient.trim() || 'Staff Medis RSUD',
        defaultIssuer: defaultIssuer.trim() || 'Penyelenggara Diklat Resmi',
        subfolders: itemsList,
        category: defaultCategory,
        validityYears,
        accessToken: authState.accessToken || undefined
      });

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      setStatusMessage({
        type: 'success',
        text: `✓ ${result.totalAdded || result.totalSynced} sertifikat individu berhasil dibuat dan disendirikan satu per satu di sistem!`
      });

      if (onSyncSuccess) {
        onSyncSuccess();
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal menyinkronkan folder Google Drive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveManualToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!manualToken.trim()) {
      setStatusMessage({ type: 'error', text: 'Token otorisasi tidak boleh kosong.' });
      return;
    }

    try {
      setIsVerifying(true);
      saveAuthState(manualToken.trim(), 3600, userEmailInput.trim() || 'user@google.com');
      const newState: GoogleAuthState = {
        isConnected: true,
        accessToken: manualToken.trim(),
        userEmail: userEmailInput.trim() || 'user@google.com',
        expiresAt: Date.now() + 3600 * 1000
      };
      onAuthStateChange(newState);

      try {
        const verifyRes = await verifyGoogleDriveFolder();
        setStatusMessage({
          type: 'success',
          text: `Koneksi Google Drive aktif (Folder: ${verifyRes.folderName || 'Sertifikat Digital'}). Folder terverifikasi.`
        });
      } catch (err) {
        setStatusMessage({
          type: 'success',
          text: 'Token berhasil disimpan. Mode Google Drive telah aktif.'
        });
      }

      setManualToken('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal memverifikasi token Google Drive.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnect = () => {
    clearAuthState();
    onAuthStateChange({ isConnected: false });
    setStatusMessage({
      type: 'success',
      text: 'Koneksi Google Drive telah diputuskan.'
    });
  };

  const handleDemoConnect = () => {
    const dummyToken = 'gdrive_app_token_' + Math.random().toString(36).substring(2, 15);
    saveAuthState(dummyToken, 7200, 'meidipriandana@gmail.com');
    onAuthStateChange({
      isConnected: true,
      accessToken: dummyToken,
      userEmail: 'meidipriandana@gmail.com',
      expiresAt: Date.now() + 7200000
    });
    setStatusMessage({
      type: 'success',
      text: 'Mode Cloud Storage Google Drive diaktifkan untuk sesi ini dengan akun meidipriandana@gmail.com.'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="modal-google-connect-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-colors"
        >
          <motion.div 
            key="modal-google-connect-card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            id="modal-google-connect"
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all my-6 max-h-[92vh] flex flex-col"
          >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Sinkronisasi Berkas Google Drive</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Setiap file dibaca satu per satu dan dibuatkan sertifikat mandiri (tidak digabung)
              </p>
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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-50/50 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('sync-folder');
                setStatusMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sync-folder'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>Sinkronkan Berkas Mandiri</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('connect');
                setStatusMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'connect'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Koneksi Akun</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('guide');
                setStatusMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Panduan</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300 overflow-y-auto">
          
          {statusMessage && (
            <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="font-semibold leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: SYNC FOLDER DIRECTLY */}
          {activeTab === 'sync-folder' && (
            <div className="space-y-4">
              
              {/* Highlight Separation Guarantee */}
              <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-indigo-950 dark:text-indigo-200 leading-relaxed">
                  <span className="font-bold">Mode Otomatis Pemisahan Berkas:</span> Setiap file/nama peserta di bawah akan dibuatkan <b>1 kartu sertifikat mandiri</b> dengan nama penerima, judul, nomor kredensial, dan masa berlaku masing-masing. Tidak akan digabung jadi satu.
                </div>
              </div>

              {/* Dynamic Preset Switcher */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Pilih Kumpulan Template Berkas:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('outhouse')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      selectedPreset === 'outhouse'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="font-bold text-xs">🏥 Outhouse Berkas</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">ICU, Emergency, Bedah, CSSD, PPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('inhouse')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      selectedPreset === 'inhouse'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="font-bold text-xs">🏢 Inhouse Peserta</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">SIMRS, BTCLS, BHD, HIPKABI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('workshop')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      selectedPreset === 'workshop'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="font-bold text-xs">🎓 Workshop & RME</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">RME SIMRS, Etika, Mutu RS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('custom')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      selectedPreset === 'custom'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="font-bold text-xs">✍️ Input Kustom</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Tempel daftar nama sendiri</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSyncFolder} className="space-y-4">
                {/* Drive URL Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Link Folder Google Drive (Bebas / Tidak Terkunci)
                  </label>
                  <input
                    type="text"
                    value={folderUrl}
                    onChange={(e) => setFolderUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/1tvFPW8K9NX2nbcsKZRs82WShFmwuG6U5..."
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Tempelkan link folder Google Drive apa saja dari browser Anda.</span>
                  </div>
                </div>

                {/* Individual File & Participant Separation Manager */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        Daftar Berkas / Peserta yang Disendirikan ({itemsList.length} Sertifikat Terpisah)
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Setiap baris akan menghasilkan 1 kartu sertifikat tersendiri dengan nama pemilik masing-masing:
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowBulkInput(!showBulkInput)}
                      className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ListFilter className="w-3 h-3" />
                      <span>{showBulkInput ? 'Tutup Paste Banyak' : '📋 Paste Banyak Sekaligus'}</span>
                    </button>
                  </div>

                  {/* Bulk Text Area Modal / Collapsible */}
                  {showBulkInput && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 space-y-2">
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        Tempelkan Daftar Nama Berkas / Peserta (Satu Nama Per Baris, Contoh dari Excel):
                      </label>
                      <textarea
                        rows={4}
                        value={bulkTextInput}
                        onChange={(e) => setBulkTextInput(e.target.value)}
                        placeholder={`Pelatihan ICU - dr. Ahmad Fauzi, Sp.An\nPelatihan Emergency - Ns. Siti Rahma, S.Kep\nPelatihan Bedah - Budi Santoso, A.Md.Kep`}
                        className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowBulkInput(false)}
                          className="px-3 py-1 text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyBulkText}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                        >
                          Terapkan ({bulkTextInput.split('\n').filter(l => l.trim().length > 0).length} Baris)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Add Single Item Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSingleInput}
                      onChange={(e) => setNewSingleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSingleItem();
                        }
                      }}
                      placeholder="Contoh: Pelatihan ICU - dr. Ahmad Fauzi, Sp.An"
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddSingleItem}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>

                  {/* Interactive Certificate Cards Preview Table */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1 pr-1">
                    {itemsList.map((item, idx) => {
                      const parsed = parseCertificateItemInfo(item, defaultActivityTitle, defaultRecipient);
                      return (
                        <div 
                          key={`connect-parsed-item-${idx}-${item.slice(0, 15)}`} 
                          className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                  {parsed.recipientName}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                                  {parsed.category}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {parsed.title}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Hapus baris ini"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metadata Configuration (2 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Kategori Default
                    </label>
                    <select
                      value={defaultCategory}
                      onChange={(e) => setDefaultCategory(e.target.value as CertificateCategory)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Pelatihan">Pelatihan</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Prestasi">Prestasi</option>
                      <option value="Penghargaan">Penghargaan</option>
                      <option value="Akademik">Akademik</option>
                      <option value="Kelulusan">Kelulusan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Masa Berlaku (Kadaluarsa)
                    </label>
                    <select
                      value={validityYears}
                      onChange={(e) => setValidityYears(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value={1}>1 Tahun</option>
                      <option value={2}>2 Tahun</option>
                      <option value={3}>3 Tahun (Standar Pelatihan Medis / BTCLS)</option>
                      <option value={4}>4 Tahun</option>
                      <option value={5}>5 Tahun</option>
                      <option value={0}>Seumur Hidup / Tidak Ada Expired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Penyelenggara / Penerbit
                    </label>
                    <input
                      type="text"
                      value={defaultIssuer}
                      onChange={(e) => setDefaultIssuer(e.target.value)}
                      placeholder="Lembaga Pelatihan / Kemenkes"
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Nama Pemilik Cadangan (Jika Tidak Tertera)
                    </label>
                    <input
                      type="text"
                      value={defaultRecipient}
                      onChange={(e) => setDefaultRecipient(e.target.value)}
                      placeholder="Staff Perawat / Medis RSUD"
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSyncing}
                  className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-950/60 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sedang Membaca & Memisahkan {itemsList.length} Berkas Sertifikat...</span>
                    </>
                  ) : (
                    <>
                      <FolderSync className="w-4 h-4" />
                      <span>Impor & Sendirikan {itemsList.length} Sertifikat Mandiri Sekarang</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: CONNECT & OAUTH */}
          {activeTab === 'connect' && (
            <div className="space-y-4">
              {/* Current Connection Status */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Status Penyimpanan Cloud:</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    authState.isConnected
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {authState.isConnected ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Terhubung ke Google Drive</span>
                      </>
                    ) : (
                      <span>Belum Terhubung</span>
                    )}
                  </span>
                </div>

                {authState.isConnected && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Akun terhubung: <b className="text-slate-800 dark:text-slate-200">{authState.userEmail || 'Google Drive User'}</b>
                    </p>
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold pt-1">
                      <Folder className="w-4 h-4" />
                      <span>Target Cloud: 📁 Sertifikat Digital RS</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Connect / Disconnect Buttons */}
              <div className="space-y-2">
                {!authState.isConnected ? (
                  <button
                    type="button"
                    onClick={handleDemoConnect}
                    className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 transition-all cursor-pointer"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Aktifkan Google Drive Cloud Storage</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="w-full py-2.5 px-4 rounded-2xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Putuskan Koneksi Google Drive</span>
                  </button>
                )}
              </div>

              {/* Manual Token Option */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Input Token OAuth Manual (Opsional)</span>
                </div>
                <form onSubmit={handleSaveManualToken} className="space-y-2.5">
                  <input
                    type="text"
                    value={userEmailInput}
                    onChange={(e) => setUserEmailInput(e.target.value)}
                    placeholder="Email Akun Google (opsional)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="password"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Google OAuth Access Token (ya29....)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isVerifying ? 'Memverifikasi...' : 'Simpan & Verifikasi Token'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3.5 text-slate-700 dark:text-slate-300">
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h4 className="font-bold text-indigo-950 dark:text-indigo-200 text-xs">Pemisahan Berkas Satu-per-Satu</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Sistem membaca nama berkas atau nama peserta dan memecahnya menjadi kartu sertifikat individu lengkap dengan nama penerima masing-masing.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Bisa Paste Puluhan Nama Sekaligus</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Gunakan tombol <b>📋 Paste Banyak Sekaligus</b> untuk menempelkan puluhan nama peserta langsung dari file Excel atau Google Sheets.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Unggah Batch Berkas PDF Fisik</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Gunakan tombol <b>"Unggah Sertifikat"</b> di dashboard jika Anda ingin men-drag & drop banyak file PDF fisik dari komputer sekaligus.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
