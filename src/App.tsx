import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchCertificates, fetchStats, deleteCertificate, deleteMultipleCertificates, fetchCategories, getLastCacheTimestamp 
} from './services/api';
import { 
  getStoredAuthState, GoogleAuthState 
} from './services/googleAuth';
import { Certificate, CertificateStats, CategoryItem, ThemeMode } from './types';
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
import { BulkDeleteConfirmModal } from './components/BulkDeleteConfirmModal';
import { ExpiryAlertBanner } from './components/ExpiryAlertBanner';
import { ExpiryMonitorModal } from './components/ExpiryMonitorModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import { RecentlyUploadedWidget } from './components/RecentlyUploadedWidget';
import { getExpirySummary } from './utils/expiry';
import { Cloud, CheckCircle2, AlertCircle, Sparkles, Folder, ExternalLink, BellRing, WifiOff, RefreshCw, Database, Plus, X, ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function App() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isUsingCache, setIsUsingCache] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => getLastCacheTimestamp());

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
  const [lightboxCertificate, setLightboxCertificate] = useState<Certificate | null>(null);
  const [certificateToDelete, setCertificateToDelete] = useState<Certificate | null>(null);
  const [certificatesToDelete, setCertificatesToDelete] = useState<Certificate[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isGoogleConnectOpen, setIsGoogleConnectOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isExpiryMonitorOpen, setIsExpiryMonitorOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [hasNotifiedExpiry, setHasNotifiedExpiry] = useState(false);
  const [isCloudBannerDismissed, setIsCloudBannerDismissed] = useState<boolean>(() => {
    return localStorage.getItem('certify_drive_cloud_banner_dismissed') === 'true';
  });
  const [isCloudBannerExpanded, setIsCloudBannerExpanded] = useState<boolean>(() => {
    return localStorage.getItem('certify_drive_cloud_banner_expanded') === 'true';
  });

  const handleToggleExpandCloudBanner = () => {
    setIsCloudBannerExpanded(prev => {
      const next = !prev;
      localStorage.setItem('certify_drive_cloud_banner_expanded', String(next));
      return next;
    });
  };

  const handleDismissCloudBanner = () => {
    setIsCloudBannerDismissed(true);
    localStorage.setItem('certify_drive_cloud_banner_dismissed', 'true');
  };

  const handleRestoreCloudBanner = () => {
    setIsCloudBannerDismissed(false);
    localStorage.removeItem('certify_drive_cloud_banner_dismissed');
  };

  // Auth & Notifications
  const [authState, setAuthState] = useState<GoogleAuthState>(getStoredAuthState());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Theme Mode ('light' | 'dark' | 'auto')
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('certify_drive_theme_mode');
    if (saved === 'light' || saved === 'dark' || saved === 'auto') {
      return saved;
    }
    // Backward compatibility for old boolean dark mode storage
    const legacySavedDark = localStorage.getItem('certify_drive_dark_mode');
    if (legacySavedDark !== null) {
      return legacySavedDark === 'true' ? 'dark' : 'light';
    }
    return 'auto';
  });

  // Track system preference
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  });

  // Listen to OS system theme changes in real-time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    // Modern and fallback event listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Compute effective dark mode state
  const isDarkMode = themeMode === 'auto' ? systemPrefersDark : themeMode === 'dark';

  // Apply dark class to document root & persist choice
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('certify_drive_theme_mode', themeMode);
    localStorage.setItem('certify_drive_dark_mode', String(isDarkMode));
  }, [isDarkMode, themeMode]);

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    if (mode === 'auto') {
      const currentOsMode = systemPrefersDark ? 'Gelap' : 'Terang';
      showToast(`Tema Otomatis aktif (Menyesuaikan sistem: Mode ${currentOsMode})`, 'info');
    } else if (mode === 'dark') {
      showToast('Mode Gelap diaktifkan', 'info');
    } else {
      showToast('Mode Terang diaktifkan', 'info');
    }
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories();
      if (Array.isArray(cats)) {
        setCategoriesList(cats);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [certData, statsData, catsData] = await Promise.all([
        fetchCertificates({
          search: searchQuery,
          category: selectedCategory,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          expiryStatus: expiryFilter,
          sortBy,
          sortOrder
        }),
        fetchStats(),
        fetchCategories().catch(() => [])
      ]);
      const validCerts = certData && Array.isArray(certData.data) ? certData.data : [];
      setCertificates(validCerts);
      setIsUsingCache(Boolean(certData?.fromCache));
      setLastSyncedAt(getLastCacheTimestamp());
      setStats(statsData || null);
      if (Array.isArray(catsData) && catsData.length > 0) {
        setCategoriesList(catsData);
      }

      // Check for certificates expiring within 30 days and alert the user once per session
      const summary = getExpirySummary(validCerts);
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
      showToast('Gagal memuat data dari server. Membaca metadata dari cache lokal.', 'info');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, startDate, endDate, expiryFilter, sortBy, sortOrder, hasNotifiedExpiry]);

  // Online / Offline synchronization listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Koneksi internet terhubung kembali. Memperbarui data...', 'success');
      loadData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('Koneksi internet terputus. Mode offline aktif (metadata dibaca dari cache localStorage).', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadData]);

  useEffect(() => {
    loadData();
    loadCategories();
  }, [loadData, loadCategories]);

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
    setCertificatesToDelete([]);
  };

  const handleRequestDeleteMultiple = (certs: Certificate[]) => {
    setCertificatesToDelete(certs);
    setCertificateToDelete(null);
  };

  const handleConfirmDeleteBatch = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    try {
      setIsDeleting(true);
      if (ids.length === 1) {
        await deleteCertificate(ids[0]);
        showToast('Sertifikat berhasil dihapus dari database.', 'info');
      } else {
        const count = await deleteMultipleCertificates(ids);
        showToast(`✓ Berhasil menghapus ${count} sertifikat secara permanen.`, 'info');
      }
      setCertificateToDelete(null);
      setCertificatesToDelete([]);
      if (selectedCertificate && ids.includes(selectedCertificate.id)) {
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
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
        urgentExpiryCount={expirySummary.totalUrgent}
        onRefresh={loadData}
        isLoading={isLoading}
        themeMode={themeMode}
        isDarkMode={isDarkMode}
        onSetThemeMode={handleSetThemeMode}
        isOnline={isOnline}
        lastCacheTime={lastSyncedAt}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        
        {/* Offline Status & LocalStorage Cache Banner */}
        {!isOnline && (
          <div 
            id="banner-offline-mode"
            className="bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/70 rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-xs animate-in fade-in duration-200"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold flex items-center gap-2">
                  <span>Mode Offline Aktif (Cache Metadata Lokal)</span>
                  <span className="text-[10px] font-mono bg-amber-200/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 px-2 py-0.5 rounded-md font-semibold">
                    {certificates.length} Sertifikat Tersedia
                  </span>
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5">
                  Koneksi internet tidak terdeteksi. Seluruh data metadata sertifikat dimuat langsung dari cache localStorage. Anda tetap dapat mencari, memfilter, melihat detail, dan mencetak sertifikat.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 self-end sm:self-auto"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Coba Hubungkan Ulang</span>
            </button>
          </div>
        )}

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

        {/* Banner: Google Drive Cloud Auto-Storage Alert (Compact & Collapsible) */}
        {!isCloudBannerDismissed ? (
          <div 
            id="banner-cloud-storage-info"
            className="bg-gradient-to-r from-[#071f29] via-[#14122b] to-[#071f29] rounded-2xl border border-amber-400/35 dark:border-purple-400/35 text-white shadow-xs overflow-hidden transition-all duration-200"
          >
            {/* Slim Header Bar (Always visible, click to toggle) */}
            <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-gradient-to-r from-amber-500/25 via-purple-500/25 to-teal-500/20 text-amber-200 border border-amber-300/40 shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>Google Drive Sync</span>
                </span>
                <p className="text-xs text-slate-200 truncate">
                  <span className="font-semibold text-white hidden sm:inline">Penyimpanan Terpusat: </span>
                  <span>Folder <strong className="text-white font-bold">📁 Sertifikat Digital</strong> terhubung otomatis</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="hidden md:inline-flex px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors cursor-pointer"
                >
                  Panduan
                </button>
                <button
                  type="button"
                  onClick={handleToggleExpandCloudBanner}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/40 transition-colors cursor-pointer flex items-center gap-1"
                  title={isCloudBannerExpanded ? 'Sembunyikan rincian' : 'Lihat rincian lengkap'}
                >
                  <span>{isCloudBannerExpanded ? 'Ringkas' : 'Rincian'}</span>
                  {isCloudBannerExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDismissCloudBanner}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Sembunyikan banner ini"
                  aria-label="Tutup banner"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Expanded Detailed Content (Collapsible) */}
            {isCloudBannerExpanded && (
              <div className="px-4 pb-3.5 pt-2 border-t border-[#123e4e] bg-[#051820]/90 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-300 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-1 max-w-2xl">
                  <p className="leading-relaxed">
                    Semua berkas fisik (PDF, JPG, PNG) otomatis diunggah dan disimpan ke folder terisolasi <span className="text-white font-bold">"Sertifikat Digital"</span> pada akun Google Drive Anda.
                  </p>
                  <p className="text-[11px] text-teal-200/70">
                    Kredensial dan metadata diindeks secara lokal untuk akses cepat, pencarian instan, dan pratinjau langsung tanpa membebani kuota penyimpanan lokal Anda.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsGuideOpen(true)}
                    className="md:hidden px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  >
                    Panduan Setup
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-black rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Unggah Berkas</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Minimalist Restore Trigger when dismissed */
          <div className="flex justify-end -mb-2">
            <button
              type="button"
              onClick={handleRestoreCloudBanner}
              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Cloud className="w-3 h-3" />
              <span>Tampilkan Info Google Drive</span>
            </button>
          </div>
        )}

        {/* Dashboard Metric Overview */}
        <DashboardStats
          certificates={certificates}
          stats={stats}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenExpiryMonitor={() => setIsExpiryMonitorOpen(true)}
          onFilterExpiring={() => setExpiryFilter('expiring_soon')}
          categoriesList={categoriesList}
          onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Recently Uploaded Horizontal Strip Widget (Last 5 Uploaded Certificates) */}
        <RecentlyUploadedWidget
          certificates={certificates}
          categoriesList={categoriesList}
          onSelectCertificate={setSelectedCertificate}
          onOpenLightbox={(cert) => setLightboxCertificate(cert)}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Certificate List (Grid & Table) */}
        <CertificateList
          certificates={certificates}
          onSelectCertificate={setSelectedCertificate}
          onOpenLightbox={(cert) => setLightboxCertificate(cert)}
          onDeleteCertificate={handleRequestDelete}
          onDeleteMultipleCertificates={handleRequestDeleteMultiple}
          onUpdateCertificate={handleUpdateCertificate}
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
          categoriesList={categoriesList}
          onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onResetAllFilters={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setStartDate('');
            setEndDate('');
            setExpiryFilter('all');
          }}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-xs text-slate-500 dark:text-slate-400 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">Sistem Manajemen Sertifikat</span>
            <span>•</span>
            <span>Google Drive Cloud Storage</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => setIsCategoryManagerOpen(true)}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
            >
              Kelola Kategori
            </button>
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
        categoriesList={categoriesList}
        certificates={certificates}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
      />

      <CertificateDetailModal
        certificate={selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
        onUpdate={handleUpdateCertificate}
        onDelete={handleRequestDelete}
        onOpenLightbox={(cert) => setLightboxCertificate(cert)}
        categoriesList={categoriesList}
        isOnline={isOnline}
      />

      {/* Fullscreen Image Lightbox Modal */}
      <ImageLightboxModal
        certificate={lightboxCertificate}
        onClose={() => setLightboxCertificate(null)}
        certificates={certificates}
        onSelectCertificate={(cert) => setLightboxCertificate(cert)}
      />

      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categoriesList}
        certificates={certificates}
        onCategoriesChange={() => {
          loadCategories();
          loadData();
        }}
        onCategoriesChanged={() => {
          loadCategories();
          loadData();
        }}
      />

      {/* Single Certificate Deletion Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(certificateToDelete) && certificatesToDelete.length === 0}
        onClose={() => setCertificateToDelete(null)}
        certificate={certificateToDelete}
        onConfirmDelete={handleConfirmDeleteBatch}
        isDeleting={isDeleting}
      />

      {/* Dedicated Bulk Deletion Confirmation Modal with Rich Statistics Breakdown */}
      <BulkDeleteConfirmModal
        isOpen={certificatesToDelete.length > 0}
        onClose={() => setCertificatesToDelete([])}
        certificates={certificatesToDelete}
        onConfirmDelete={handleConfirmDeleteBatch}
        isDeleting={isDeleting}
        categoriesList={categoriesList}
        onRemoveFromQueue={(certId) => {
          setCertificatesToDelete(prev => prev.filter(c => c.id !== certId));
        }}
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
