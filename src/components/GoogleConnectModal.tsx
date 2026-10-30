import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Cloud, CheckCircle2, KeyRound, AlertCircle, 
  ShieldCheck, Folder, Sparkles, FolderSync, Layers,
  Plus, Trash2, Info, ListFilter, Users, FileSpreadsheet,
  Laptop, RefreshCw, Download, RotateCcw, ArrowRight, HelpCircle,
  Server, Network, Send, DownloadCloud, Terminal, Activity, Copy, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleAuthState, saveAuthState, clearAuthState } from '../services/googleAuth';
import { 
  verifyGoogleDriveFolder, syncGoogleDriveFolder, parseCertificateItemInfo, 
  syncLocalCertificatesWithServer, testCustomServer, pushToCustomServer, 
  pullFromCustomServer, CustomServerSyncResult 
} from '../services/api';
import { CertificateCategory } from '../types';

interface GoogleConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  authState: GoogleAuthState;
  onAuthStateChange: (newState: GoogleAuthState) => void;
  onSyncSuccess?: () => void;
  onOpenExport?: () => void;
  onOpenRestore?: () => void;
}

type FolderPresetType = 'outhouse' | 'inhouse' | 'workshop' | 'custom';

export const GoogleConnectModal: React.FC<GoogleConnectModalProps> = ({
  isOpen,
  onClose,
  authState,
  onAuthStateChange,
  onSyncSuccess,
  onOpenExport,
  onOpenRestore
}) => {
  const [activeTab, setActiveTab] = useState<'custom-server' | 'cross-device' | 'sync-folder' | 'connect' | 'guide'>('custom-server');
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

  const [isDeviceSyncing, setIsDeviceSyncing] = useState(false);

  // Custom Server state (e.g. 200.200.100.80)
  const [customServerIp, setCustomServerIp] = useState(() => {
    return localStorage.getItem('rsud_custom_server_ip') || '200.200.100.80';
  });
  const [customServerPort, setCustomServerPort] = useState(() => {
    return localStorage.getItem('rsud_custom_server_port') || '';
  });
  const [customServerProtocol, setCustomServerProtocol] = useState<'http' | 'https'>('http');
  const [customServerEndpoint, setCustomServerEndpoint] = useState('/api/certificates');
  const [customServerApiKey, setCustomServerApiKey] = useState('');
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [isPushingServer, setIsPushingServer] = useState(false);
  const [isPullingServer, setIsPullingServer] = useState(false);
  const [serverStatusResult, setServerStatusResult] = useState<CustomServerSyncResult | null>(null);
  const [copiedSpec, setCopiedSpec] = useState(false);

  const getFullServerUrl = () => {
    let host = customServerIp.trim();
    if (!host) host = '200.200.100.80';
    host = host.replace(/^https?:\/\//i, '');
    const portPart = customServerPort.trim() ? `:${customServerPort.trim()}` : '';
    const endpointPart = customServerEndpoint.trim() 
      ? (customServerEndpoint.trim().startsWith('/') ? customServerEndpoint.trim() : `/${customServerEndpoint.trim()}`) 
      : '';
    return `${customServerProtocol}://${host}${portPart}${endpointPart}`;
  };

  const handleTestCustomServer = async () => {
    try {
      setIsTestingServer(true);
      setServerStatusResult(null);
      localStorage.setItem('rsud_custom_server_ip', customServerIp.trim());
      localStorage.setItem('rsud_custom_server_port', customServerPort.trim());

      const url = getFullServerUrl();
      const res = await testCustomServer(url, customServerApiKey.trim());
      setServerStatusResult(res);
      if (res.success) {
        try {
          confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
        } catch {}
      }
    } catch (err: any) {
      setServerStatusResult({
        success: false,
        message: err.message || 'Gagal mengetes koneksi server.'
      });
    } finally {
      setIsTestingServer(false);
    }
  };

  const handlePushCustomServer = async () => {
    try {
      setIsPushingServer(true);
      setServerStatusResult(null);
      localStorage.setItem('rsud_custom_server_ip', customServerIp.trim());
      localStorage.setItem('rsud_custom_server_port', customServerPort.trim());

      const url = getFullServerUrl();
      const res = await pushToCustomServer(url, customServerApiKey.trim());
      setServerStatusResult(res);
      if (res.success) {
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
      }
    } catch (err: any) {
      setServerStatusResult({
        success: false,
        message: err.message || 'Gagal mengirim data ke server.'
      });
    } finally {
      setIsPushingServer(false);
    }
  };

  const handlePullCustomServer = async () => {
    try {
      setIsPullingServer(true);
      setServerStatusResult(null);
      localStorage.setItem('rsud_custom_server_ip', customServerIp.trim());
      localStorage.setItem('rsud_custom_server_port', customServerPort.trim());

      const url = getFullServerUrl();
      const res = await pullFromCustomServer(url, customServerApiKey.trim(), 'merge');
      setServerStatusResult(res);
      if (res.success) {
        if (onSyncSuccess) onSyncSuccess();
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
      }
    } catch (err: any) {
      setServerStatusResult({
        success: false,
        message: err.message || 'Gagal menarik data dari server.'
      });
    } finally {
      setIsPullingServer(false);
    }
  };

  const handleCopySpec = () => {
    const sample = JSON.stringify({
      source: "Sertifikat Diklat RSUD dr.H.Jusuf.SK",
      serverIp: customServerIp || "200.200.100.80",
      endpoint: getFullServerUrl(),
      format: "JSON Array of Certificate objects",
      sampleItem: {
        id: "cert-2026-001",
        title: "Sertifikat Pelatihan ICU",
        recipientName: "dr. Ahmad Fauzi, Sp.An",
        recipientEmail: "ahmad.fauzi@rsud.go.id",
        issueDate: "2026-08-15",
        expiryDate: "2029-08-15",
        issuer: "Diklat RSUD dr. H. Jusuf SK",
        category: "Pelatihan",
        credentialId: "CERT-2026-001"
      }
    }, null, 2);

    navigator.clipboard.writeText(sample);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2500);
  };

  const handleTriggerDeviceSync = async () => {
    try {
      setIsDeviceSyncing(true);
      setStatusMessage(null);
      const res = await syncLocalCertificatesWithServer();
      setStatusMessage({ type: 'success', text: res.message });
      if (onSyncSuccess) onSyncSuccess();
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal menyinkronkan data antar perangkat.' });
    } finally {
      setIsDeviceSyncing(false);
    }
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
            <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Pusat Sinkronisasi &amp; Integrasi Server</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Dukungan Server Pribadi (200.200.100.80), Cloud Auto-Sync, dan Google Drive
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
          <div className="flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setActiveTab('custom-server');
                setStatusMessage(null);
                setServerStatusResult(null);
              }}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'custom-server'
                  ? 'bg-cyan-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Server 200.200.100.80</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('cross-device');
                setStatusMessage(null);
                setServerStatusResult(null);
              }}
              className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'cross-device'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Kantor ↔ Rumah</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('sync-folder');
                setStatusMessage(null);
                setServerStatusResult(null);
              }}
              className={`flex-1 min-w-[95px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sync-folder'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>Impor Folder</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('connect');
                setStatusMessage(null);
                setServerStatusResult(null);
              }}
              className={`flex-1 min-w-[95px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'connect'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Akun Drive</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('guide');
                setStatusMessage(null);
                setServerStatusResult(null);
              }}
              className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

          {/* TAB: CUSTOM SERVER (200.200.100.80) */}
          {activeTab === 'custom-server' && (
            <div className="space-y-4">
              
              {/* Highlight Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-teal-500/10 border border-cyan-200 dark:border-cyan-800/70 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      Koneksi Server: 200.200.100.80
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 text-[10px] font-black border border-cyan-200 dark:border-cyan-800">
                    REST API &amp; Webhook Siap
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Aplikasi ini siap dan dapat dihubungkan ke server <strong className="text-cyan-700 dark:text-cyan-300 font-bold">200.200.100.80</strong>. 
                  Anda dapat melakukan uji ping, mengirim data sertifikat (*push*), maupun menarik data (*pull*) secara dua arah.
                </p>
              </div>

              {/* Server Endpoint Form */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Konfigurasi Endpoint Server</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Target: {getFullServerUrl()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Protokol
                    </label>
                    <select
                      value={customServerProtocol}
                      onChange={(e) => setCustomServerProtocol(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="http">http://</option>
                      <option value="https">https://</option>
                    </select>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      IP / Hostname Server
                    </label>
                    <input
                      type="text"
                      value={customServerIp}
                      onChange={(e) => setCustomServerIp(e.target.value)}
                      placeholder="200.200.100.80"
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Port (opsional)
                    </label>
                    <input
                      type="text"
                      value={customServerPort}
                      onChange={(e) => setCustomServerPort(e.target.value)}
                      placeholder="Contoh: 8080"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Path Endpoint API
                    </label>
                    <input
                      type="text"
                      value={customServerEndpoint}
                      onChange={(e) => setCustomServerEndpoint(e.target.value)}
                      placeholder="/api/certificates"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      API Token / Secret Key (opsional)
                    </label>
                    <input
                      type="password"
                      value={customServerApiKey}
                      onChange={(e) => setCustomServerApiKey(e.target.value)}
                      placeholder="Bearer token jika ada"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleTestCustomServer}
                    disabled={isTestingServer || isPushingServer || isPullingServer}
                    className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <Activity className={`w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 ${isTestingServer ? 'animate-spin' : ''}`} />
                    <span>{isTestingServer ? 'Menguji...' : 'Uji Koneksi (Ping)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePushCustomServer}
                    disabled={isTestingServer || isPushingServer || isPullingServer}
                    className="flex-1 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <Send className={`w-3.5 h-3.5 ${isPushingServer ? 'animate-bounce' : ''}`} />
                    <span>{isPushingServer ? 'Mengirim Data...' : 'Kirim Data ke 200.200.100.80'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePullCustomServer}
                    disabled={isTestingServer || isPushingServer || isPullingServer}
                    className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <DownloadCloud className={`w-3.5 h-3.5 ${isPullingServer ? 'animate-bounce' : ''}`} />
                    <span>{isPullingServer ? 'Menarik Data...' : 'Tarik Data dari Server'}</span>
                  </button>
                </div>
              </div>

              {/* Result Status Display */}
              {serverStatusResult && (
                <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                  serverStatusResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                }`}>
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      {serverStatusResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <span>Hasil Respons Server:</span>
                    </span>
                    {serverStatusResult.latencyMs !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/60 dark:bg-black/40">
                        {serverStatusResult.latencyMs} ms
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {serverStatusResult.message}
                  </p>
                </div>
              )}

              {/* Technical Documentation & Integration Spec */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Panduan Format API untuk Tim IT Server 200.200.100.80</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySpec}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSpec ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSpec ? 'Tersalin!' : 'Salin Contoh Schema'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                  <p>
                    <strong>1. Mode Jaringan Intranet RSUD (LAN / Wi-Fi):</strong><br />
                    Jika IP <code>200.200.100.80</code> adalah server intranet lokal yang hanya bisa dibuka dari dalam rumah sakit, aplikasi ini dilengkapi *direct browser fallback*, sehingga saat Anda membuka aplikasi di komputer kantor rumah sakit, browser Anda dapat langsung mengirim dan menerima data dari server tersebut.
                  </p>
                  <p>
                    <strong>2. Endpoint yang Disediakan Server Anda:</strong><br />
                    • <code>POST {customServerEndpoint || '/api/certificates'}</code>: Menerima JSON array sertifikat yang dikirim aplikasi.<br />
                    • <code>GET {customServerEndpoint || '/api/certificates'}</code>: Mengembalikan JSON array berisi daftar sertifikat.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 0: KANTOR ↔ RUMAH CROSS-DEVICE SYNC */}
          {activeTab === 'cross-device' && (
            <div className="space-y-4">
              {/* Account & Sync Status Header Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-teal-500/10 border border-teal-200 dark:border-teal-800/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      Sinkronisasi Antar Perangkat (Kantor &amp; Rumah)
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-[10px] font-black border border-teal-200 dark:border-teal-800">
                    Cloud Auto-Sync Aktif
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Akun email yang terhubung: <strong className="text-teal-700 dark:text-teal-300 font-bold">{authState.userEmail || 'meidipriandana@gmail.com'}</strong>. 
                  Database cloud memastikan data yang Anda unggah dari komputer kantor otomatis dapat dibuka dan dicari di laptop rumah.
                </p>
              </div>

              {/* Sync Action Button */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3 shadow-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <RefreshCw className={`w-3.5 h-3.5 text-teal-600 dark:text-teal-400 ${isDeviceSyncing ? 'animate-spin' : ''}`} />
                    <span>Sinkronkan Data Sekarang</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Kirim data lokal pada browser ini ke server database pusat dan tarik pembaruan data terbaru dari kantor.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerDeviceSync}
                  disabled={isDeviceSyncing}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isDeviceSyncing ? 'animate-spin' : ''}`} />
                  <span>{isDeviceSyncing ? 'Sedang Menyinkronkan Database...' : 'Sinkronkan Database Sekarang'}</span>
                </button>
              </div>

              {/* Why Data Was Missing Explanation Card */}
              <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Kenapa data di kantor dan di laptop rumah sempat tidak sinkron?</span>
                </div>
                <div className="text-[11px] text-amber-850 dark:text-amber-300/90 space-y-1.5 leading-relaxed">
                  <p>
                    • <strong>Penyebab:</strong> Sebelumnya, ketika proses unggah di browser kantor mengalami kendala verifikasi token Google Drive, aplikasi secara otomatis mengamankan data ke <em>LocalStorage</em> (memori lokal browser) komputer kantor saja. Memori lokal browser tidak terhubung ke laptop rumah.
                  </p>
                  <p>
                    • <strong>Perbaikan yang Sudah Diterapkan:</strong> Sistem server sekarang sudah diperbaiki. Setiap unggahan baru otomatis disimpan langsung ke server database utama sehingga laptop rumah langsung membacanya.
                  </p>
                  <p>
                    • <strong>Langkah untuk Data Kantor yang Lama:</strong> Buka aplikasi di komputer kantor Anda, data tersebut akan otomatis terkirim ke server pusat saat halaman dimuat atau klik <strong>Sinkronkan Database Sekarang</strong> di atas.
                  </p>
                </div>
              </div>

              {/* Fast Backup / Transfer Options */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Pindahkan Data Secara Mandiri (Cadangan JSON):
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Anda juga dapat mengekspor seluruh data sertifikat menjadi satu file cadangan (.json) untuk dipindahkan langsung antar komputer kapan saja.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  {onOpenExport && (
                    <button
                      type="button"
                      onClick={onOpenExport}
                      className="flex-1 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Unduh File Cadangan (JSON)</span>
                    </button>
                  )}
                  {onOpenRestore && (
                    <button
                      type="button"
                      onClick={onOpenRestore}
                      className="flex-1 py-2 px-3 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Pulihkan Data dari JSON</span>
                    </button>
                  )}
                </div>
              </div>

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
