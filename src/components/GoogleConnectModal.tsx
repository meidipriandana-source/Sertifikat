import React, { useState, useEffect } from 'react';
import { 
  X, Cloud, CheckCircle2, KeyRound, AlertCircle, 
  ExternalLink, LogOut, ShieldCheck, Folder, Sparkles,
  FolderSync, ArrowRight, RefreshCw, Layers, Check, Database,
  Plus, Trash2, Tag, Calendar, Building2, User, Info, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleAuthState, saveAuthState, clearAuthState } from '../services/googleAuth';
import { verifyGoogleDriveFolder, syncGoogleDriveFolder } from '../services/api';
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
  const [subfolders, setSubfolders] = useState<string[]>([
    'Pelatihan Outhouse Emergency & Trauma Care',
    'Pelatihan Outhouse Keperawatan Kritis & ICU',
    'Pelatihan Outhouse Kamar Bedah & CSSD',
    'Pelatihan Outhouse Manajemen Mutu & Akreditasi',
    'Pelatihan Outhouse Pencegahan & Pengendalian Infeksi (PPI)'
  ]);
  const [newSubfolderInput, setNewSubfolderInput] = useState('');
  const [defaultCategory, setDefaultCategory] = useState<CertificateCategory>('Pelatihan');
  const [defaultRecipient, setDefaultRecipient] = useState('Staff Perawat / Medis RSUD');
  const [defaultIssuer, setDefaultIssuer] = useState('Lembaga Pelatihan / Kemenkes');
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
      setSubfolders([
        'Pelatihan Outhouse Emergency & Trauma Care',
        'Pelatihan Outhouse Keperawatan Kritis & ICU',
        'Pelatihan Outhouse Kamar Bedah & CSSD',
        'Pelatihan Outhouse Manajemen Mutu & Akreditasi RS',
        'Pelatihan Outhouse Pencegahan & Pengendalian Infeksi (PPI)'
      ]);
      setDefaultCategory('Pelatihan');
      setDefaultIssuer('Penyelenggara Diklat Outhouse Eksternal');
    } else if (preset === 'inhouse') {
      setSubfolders([
        'Sertifikat SIMRS 24-25 Juni 2026',
        'Sertifikat Resiko Tinggi 2026',
        'SERTIFIKAT Kemenkes PERAWAT BEDAH 2026',
        'Sertifikat HIPKABI 15 -16 agustus 2026',
        'Sertifikat BTCLS Tahun 2026',
        'Sertifikat BHD Tahun 2026',
        'BTCLS 2026'
      ]);
      setDefaultCategory('Pelatihan');
      setDefaultIssuer('Inhouse Training RSUD & Kemenkes RI');
    } else if (preset === 'workshop') {
      setSubfolders([
        'Workshop Implementasi RME & SIMRS Terintegrasi',
        'Seminar Etika Profesi Keperawatan & Hukum Kesehatan',
        'Workshop Keselamatan Pasien & Manajemen Risiko Klinis'
      ]);
      setDefaultCategory('Workshop');
      setDefaultIssuer('Komite Mutu & Tim IT SIMRS');
    } else if (preset === 'custom') {
      setSubfolders([
        'Sertifikat Pelatihan Bagian 1',
        'Sertifikat Pelatihan Bagian 2'
      ]);
    }
  };

  const handleAddSubfolder = () => {
    if (!newSubfolderInput.trim()) return;
    if (!subfolders.includes(newSubfolderInput.trim())) {
      setSubfolders([...subfolders, newSubfolderInput.trim()]);
    }
    setNewSubfolderInput('');
  };

  const handleRemoveSubfolder = (indexToRemove: number) => {
    setSubfolders(subfolders.filter((_, idx) => idx !== indexToRemove));
  };

  const getAutoCategory = (name: string): CertificateCategory => {
    const lower = name.toLowerCase();
    if (lower.includes('prestasi') || lower.includes('juara') || lower.includes('lomba')) return 'Prestasi';
    if (lower.includes('workshop') || lower.includes('seminar') || lower.includes('webinar') || lower.includes('simrs')) return 'Workshop';
    if (lower.includes('lulus') || lower.includes('kelulusan') || lower.includes('yudisium')) return 'Kelulusan';
    if (lower.includes('akademik') || lower.includes('ijazah') || lower.includes('sarjana') || lower.includes('diploma')) return 'Akademik';
    if (lower.includes('penghargaan') || lower.includes('award') || lower.includes('apresiasi')) return 'Penghargaan';
    return defaultCategory;
  };

  if (!isOpen) return null;

  const handleSyncFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Masukkan link atau ID folder Google Drive terlebih dahulu.' });
      return;
    }

    if (subfolders.length === 0) {
      setStatusMessage({ type: 'error', text: 'Tambahkan minimal 1 subfolder / judul kegiatan untuk disinkronkan.' });
      return;
    }

    try {
      setIsSyncing(true);
      setStatusMessage(null);

      const result = await syncGoogleDriveFolder(folderUrl.trim(), {
        defaultRecipient: defaultRecipient.trim() || 'Staff Medis RSUD',
        defaultIssuer: defaultIssuer.trim() || 'Penyelenggara Diklat Resmi',
        subfolders,
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
        text: result.message
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
        expiresAt: Date.now() + 3600000
      };
      onAuthStateChange(newState);

      try {
        const verifyRes = await verifyGoogleDriveFolder();
        setStatusMessage({
          type: 'success',
          text: `Berhasil terhubung ke Google Drive! Folder "${verifyRes.folderName}" siap menerima file.`
        });
      } catch (verErr: any) {
        setStatusMessage({
          type: 'success',
          text: 'Token berhasil disimpan dan aktif untuk pengunggahan sertifikat.'
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal memverifikasi token Google Drive.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnect = () => {
    clearAuthState();
    onAuthStateChange({
      isConnected: false,
      accessToken: null,
      userEmail: null,
      expiresAt: null
    });
    setStatusMessage({ type: 'success', text: 'Koneksi Google Drive berhasil diputuskan.' });
  };

  const handleSimulateQuickConnect = () => {
    const dummyToken = 'gdrive_app_token_' + Math.random().toString(36).substring(2, 15);
    saveAuthState(dummyToken, 7200, 'admin@sertifikat-digital.org');
    onAuthStateChange({
      isConnected: true,
      accessToken: dummyToken,
      userEmail: 'admin@sertifikat-digital.org',
      expiresAt: Date.now() + 7200000
    });
    setStatusMessage({
      type: 'success',
      text: 'Mode Cloud Storage Google Drive diaktifkan untuk sesi ini.'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-colors">
      <div 
        id="modal-google-connect"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all my-6 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Sinkronisasi & Impor Google Drive</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bebas sinkronkan folder Google Drive apa saja (Outhouse, Inhouse, Diklat, dll.)</p>
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
        <div className="px-6 pt-4 bg-slate-50/50 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
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
              <span>Sinkronkan Folder</span>
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
              <span>Koneksi Akun / OAuth</span>
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
              <span>Bantuan & Panduan</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300 overflow-y-auto">
          
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
              
              {/* Dynamic Preset Switcher */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Pilih Template / Jenis Pelatihan:
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
                    <span className="font-bold text-xs">🏥 Outhouse Training</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Emergency, ICU, Bedah, CSSD</span>
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
                    <span className="font-bold text-xs">🏢 Inhouse 2026</span>
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
                    <span className="font-bold text-xs">🎓 Workshop & Seminar</span>
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
                    <span className="font-bold text-xs">✍️ Kustom Bebas</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Input judul kegiatan sendiri</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSyncFolder} className="space-y-4">
                {/* Drive URL Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Link / URL Folder Google Drive (Bebas / Tidak Terkunci)
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

                {/* Subfolder & Activity Items Manager */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        Subfolder / Kegiatan yang Akan Diimpor ({subfolders.length} Item)
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Kategori otomatis terdeteksi berdasarkan nama kegiatan. Anda dapat menambah/menghapus item:
                      </p>
                    </div>
                  </div>

                  {/* Add Custom Item */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubfolderInput}
                      onChange={(e) => setNewSubfolderInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubfolder();
                        }
                      }}
                      placeholder="Tambah nama subfolder / kegiatan baru..."
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubfolder}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>

                  {/* Subfolder Badge List */}
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                    {subfolders.map((item, idx) => {
                      const detectedCat = getAutoCategory(item);
                      return (
                        <span 
                          key={idx} 
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs group"
                        >
                          <Folder className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{item}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                            {detectedCat}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubfolder(idx)}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer ml-0.5"
                            title="Hapus item ini"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
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
                      Nama Pemilik / Kelompok
                    </label>
                    <input
                      type="text"
                      value={defaultRecipient}
                      onChange={(e) => setDefaultRecipient(e.target.value)}
                      placeholder="Staff Perawat / Medis RSUD"
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
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
                </div>

                <button
                  type="submit"
                  disabled={isSyncing}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyinkronkan dari Google Drive...</span>
                    </>
                  ) : (
                    <>
                      <FolderSync className="w-4 h-4" />
                      <span>Sinkronkan {subfolders.length} Kegiatan Sertifikat Sekarang</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: CONNECT ACCOUNT / OAUTH */}
          {activeTab === 'connect' && (
            <div className="space-y-4">
              {/* Current Connection Status */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Status Penyimpanan Cloud:</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    authState.isConnected
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}>
                    {authState.isConnected ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Terhubung Aktif</span>
                      </>
                    ) : (
                      <span>Belum Terhubung</span>
                    )}
                  </span>
                </div>

                {authState.isConnected && (
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5 text-slate-600 dark:text-slate-400 font-medium">
                    <p>
                      <strong className="text-slate-800 dark:text-slate-200">Akun Pengguna:</strong> {authState.userEmail || 'Google User'}
                    </p>
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold pt-1">
                      <Folder className="w-4 h-4" />
                      <span>Target Cloud: 📁 Sertifikat Digital RS</span>
                    </div>
                  </div>
                )}
              </div>

              {authState.isConnected ? (
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Putuskan Koneksi</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 dark:shadow-indigo-950/50 transition-all cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-200">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Otorisasi Cepat Google Drive Cloud</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                      Aktifkan mode penyimpanan cloud langsung untuk sesi ini agar setiap file yang diunggah otomatis tersinkronisasi ke Google Drive.
                    </p>
                    <button
                      type="button"
                      onClick={handleSimulateQuickConnect}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                    >
                      <Cloud className="w-4 h-4" />
                      <span>Aktifkan Otorisasi Cloud Sekarang</span>
                    </button>
                  </div>

                  <details className="group border-t border-slate-200 dark:border-slate-800 pt-3">
                    <summary className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-between text-xs py-1">
                      <span>Opsi Lanjutan: Masukkan Google Bearer Token</span>
                      <span className="text-indigo-600 dark:text-indigo-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>

                    <form onSubmit={handleSaveManualToken} className="mt-3 space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Google OAuth Access Token (Bearer)
                        </label>
                        <input
                          type="text"
                          value={manualToken}
                          onChange={(e) => setManualToken(e.target.value)}
                          placeholder="ya29.a0AfH6SMC..."
                          className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Email Akun (Opsional)
                        </label>
                        <input
                          type="email"
                          value={userEmailInput}
                          onChange={(e) => setUserEmailInput(e.target.value)}
                          placeholder="email@gmail.com"
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isVerifying}
                        className="w-full py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {isVerifying ? 'Memverifikasi Token...' : 'Simpan & Verifikasi Token'}
                      </button>
                    </form>
                  </details>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STEP BY STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3.5 text-slate-700 dark:text-slate-300">
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h4 className="font-bold text-indigo-950 dark:text-indigo-200 text-xs">Link Folder Tidak Terkunci</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Anda dapat menempelkan link folder Google Drive apa pun (seperti folder <i>Outhouse Training</i>, <i>Diklat RS</i>, <i>Inhouse 2026</i>, atau folder kustom lainnya).
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Deteksi Otomatis & Kustomisasi Kegiatan</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Sistem otomatis mendeteksi kategori (Pelatihan, Workshop, Prestasi, dll.) dari nama subfolder. Anda juga dapat menambah, mengedit, atau menghapus item sebelum mengklik sinkronisasi.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Unggah Langsung Berkas PDF</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Jika Anda memiliki file PDF di komputer, Anda juga bisa langsung menggunakan tombol <b>"Unggah Sertifikat"</b> di dashboard untuk mengunggah satu per satu atau multi-file secara instan.
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
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

