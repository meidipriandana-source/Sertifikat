import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchCertificates, fetchStats, deleteCertificate 
} from './services/api';
import { 
  getStoredAuthState, GoogleAuthState 
} from './services/googleAuth';
import { Certificate, CertificateStats } from './types';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { CertificateList } from './components/CertificateList';
import { CertificateUploadModal } from './components/CertificateUploadModal';
import { CertificateDetailModal } from './components/CertificateDetailModal';
import { IntegrationGuideModal } from './components/IntegrationGuideModal';
import { GoogleConnectModal } from './components/GoogleConnectModal';
import { ExportModal } from './components/ExportModal';
import { RestoreModal } from './components/RestoreModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ExpiryAlertBanner } from './components/ExpiryAlertBanner';
import { ExpiryMonitorModal } from './components/ExpiryMonitorModal';
import { getExpirySummary } from './utils/expiry';
import { Cloud, CheckCircle2, AlertCircle, Sparkles, Folder, ExternalLink, BellRing } from 'lucide-react';

export default function App() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expiring_soon' | 'expired' | 'valid' | 'lifetime'>('all');

  // Modals & Selection
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [certificateToDelete, setCertificateToDelete] = useState<Certificate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isGoogleConnectOpen, setIsGoogleConnectOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isExpiryMonitorOpen, setIsExpiryMonitorOpen] = useState(false);
  const [hasNotifiedExpiry, setHasNotifiedExpiry] = useState(false);

  // Auth & Notifications
  const [authState, setAuthState] = useState<GoogleAuthState>(getStoredAuthState());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('certify_drive_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('certify_drive_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [certData, statsData] = await Promise.all([
        fetchCertificates({
          search: searchQuery,
          category: selectedCategory,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          sortBy,
          sortOrder
        }),
        fetchStats()
      ]);
      setCertificates(certData.data);
      setStats(statsData);

      // Check for certificates expiring within 30 days and alert the user once per session
      const summary = getExpirySummary(certData.data);
      if (!hasNotifiedExpiry && (summary.expiringSoonCount > 0 || summary.expiredCount > 0)) {
        setHasNotifiedExpiry(true);
        if (summary.expiringSoonCount > 0 && summary.expiredCount > 0) {
          showToast(`⚠️ Peringatan: Ada ${summary.expiringSoonCount} sertifikat akan kadaluarsa & ${summary.expiredCount} telah kadaluarsa!`, 'info');
        } else if (summary.expiringSoonCount > 0) {
          showToast(`⚠️ Peringatan: Ada ${summary.expiringSoonCount} sertifikat yang akan kedaluwarsa dalam 30 hari ke depan!`, 'info');
        } else if (summary.expiredCount > 0) {
          showToast(`⚠️ Perhatian: Ada ${summary.expiredCount} sertifikat yang telah kadaluarsa!`, 'error');
        }
      }

    } catch (err: any) {
      console.error('Failed to load data:', err);
      showToast('Gagal memuat data dari server.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, startDate, endDate, sortBy, sortOrder, hasNotifiedExpiry]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUploadSuccess = (newCert: Certificate) => {
    showToast(`Sertifikat "${newCert.title}" berhasil disimpan!`, 'success');
    loadData();
  };

  const handleBatchUploadSuccess = (newCerts: Certificate[]) => {
    showToast(`✓ Berhasil mengunggah ${newCerts.length} berkas sertifikat secara mandiri!`, 'success');
    loadData();
  };

  const handleRestoreSuccess = (message: string) => {
    showToast(message, 'success');
    loadData();
  };

  const handleRequestDelete = (cert: Certificate) => {
    setCertificateToDelete(cert);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await deleteCertificate(id);
      showToast('Sertifikat berhasil dihapus dari database.', 'info');
      setCertificateToDelete(null);
      if (selectedCertificate?.id === id) {
        setSelectedCertificate(null);
      }
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus sertifikat', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateCertificate = (updated: Certificate) => {
    setCertificates(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    if (selectedCertificate?.id === updated.id) {
      setSelectedCertificate(updated);
    }
    showToast('Metadata sertifikat berhasil diperbarui!', 'success');
  };

  const handleToggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const expirySummary = getExpirySummary(certificates);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 max-w-md ${
            toast.type === 'success'
              ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-800 dark:border-slate-700'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-amber-600 text-white border-amber-700'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-white shrink-0" />}
            {toast.type === 'info' && <BellRing className="w-4 h-4 text-amber-200 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* App Header */}
      <Header
        authState={authState}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenGoogleConnect={() => setIsGoogleConnectOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenRestore={() => setIsRestoreOpen(true)}
        onOpenExpiryMonitor={() => setIsExpiryMonitorOpen(true)}
        urgentExpiryCount={expirySummary.totalUrgent}
        onRefresh={loadData}
        isLoading={isLoading}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        
        {/* Expiry Warning Notification Banner (Always visible when certificates expire soon or expired) */}
        <ExpiryAlertBanner
          certificates={certificates}
          onOpenMonitor={() => setIsExpiryMonitorOpen(true)}
          onFilterExpiring={() => {
            setExpiryFilter('expiring_soon');
            const element = document.getElementById('input-search-certificates');
            element?.scrollIntoView({ behavior: 'smooth' });
          }}
          onSelectCertificate={setSelectedCertificate}
        />

        {/* Banner: Google Drive Cloud Auto-Storage Alert */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-indigo-800/40 dark:border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all">
          <div className="space-y-2 z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Cloud className="w-3.5 h-3.5" />
              <span>Google Drive API v3 Integrated</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Penyimpanan Sertifikat Digital Terdesentralisasi di Google Drive
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Semua file fisik (PDF/JPG/PNG) diunggah dan ditautkan ke Google Drive ke folder <span className="text-white font-semibold">📁 Sertifikat Digital</span>. Link Web View dan unduhan instan langsung siap diakses kapan saja.
            </p>
          </div>

          <div className="flex items-center gap-2.5 z-10 shrink-0">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
            >
              Lihat Panduan Kode
            </button>
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/40 transition-all cursor-pointer"
            >
              + Unggah File Baru
            </button>
          </div>

          {/* Decorative background glow */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Dashboard Metric Overview */}
        <DashboardStats
          certificates={certificates}
          stats={stats}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenExpiryMonitor={() => setIsExpiryMonitorOpen(true)}
          onFilterExpiring={() => setExpiryFilter('expiring_soon')}
        />

        {/* Certificate List (Grid & Table) */}
        <CertificateList
          certificates={certificates}
          onSelectCertificate={setSelectedCertificate}
          onDeleteCertificate={handleRequestDelete}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onToggleSortOrder={handleToggleSortOrder}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClearDateRange={() => {
            setStartDate('');
            setEndDate('');
          }}
          onOpenUpload={() => setIsUploadOpen(true)}
          expiryFilter={expiryFilter}
          onExpiryFilterChange={setExpiryFilter}
          onOpenExpiryMonitor={() => setIsExpiryMonitorOpen(true)}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-xs text-slate-500 dark:text-slate-400 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">Sistem Manajemen Sertifikat</span>
            <span>•</span>
            <span>Google Drive API v3 &amp; Multer Backend</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => setIsExpiryMonitorOpen(true)}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Pemantauan Masa Berlaku</span>
            </button>
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Panduan Google Cloud Console &amp; Setup
            </button>
            <button
              type="button"
              onClick={() => setIsGoogleConnectOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
            >
              Pengaturan Akun Drive
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <CertificateUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
        onBatchSuccess={handleBatchUploadSuccess}
        authState={authState}
        onOpenGoogleConnect={() => setIsGoogleConnectOpen(true)}
      />

      <CertificateDetailModal
        certificate={selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
        onUpdate={handleUpdateCertificate}
        onDelete={handleRequestDelete}
      />

      <DeleteConfirmModal
        isOpen={Boolean(certificateToDelete)}
        onClose={() => setCertificateToDelete(null)}
        certificate={certificateToDelete}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <IntegrationGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <GoogleConnectModal
        isOpen={isGoogleConnectOpen}
        onClose={() => setIsGoogleConnectOpen(false)}
        authState={authState}
        onAuthStateChange={setAuthState}
        onSyncSuccess={() => {
          showToast('Data sertifikat dari Google Drive berhasil disinkronkan!', 'success');
          loadData();
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        certificates={certificates}
        onOpenRestore={() => setIsRestoreOpen(true)}
      />

      <RestoreModal
        isOpen={isRestoreOpen}
        onClose={() => setIsRestoreOpen(false)}
        onSuccess={handleRestoreSuccess}
        currentCertificates={certificates}
      />

      {/* Expiry Monitoring & Warning Notification Center Modal */}
      <ExpiryMonitorModal
        isOpen={isExpiryMonitorOpen}
        onClose={() => setIsExpiryMonitorOpen(false)}
        certificates={certificates}
        onSelectCertificate={(cert) => {
          setIsExpiryMonitorOpen(false);
          setSelectedCertificate(cert);
        }}
      />

    </div>
  );
}
