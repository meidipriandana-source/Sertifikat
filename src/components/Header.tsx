import React from 'react';
import { Cloud, HardDrive, Plus, BookOpen, Download, RefreshCw, CheckCircle2, ShieldCheck, Moon, Sun, RotateCcw, Bell, FolderTree, Wifi, WifiOff, Database } from 'lucide-react';
import { GoogleAuthState } from '../services/googleAuth';

interface HeaderProps {
  authState: GoogleAuthState;
  onOpenUpload: () => void;
  onOpenGuide: () => void;
  onOpenGoogleConnect: () => void;
  onOpenExport: () => void;
  onOpenRestore: () => void;
  onOpenExpiryMonitor: () => void;
  onOpenCategoryManager?: () => void;
  urgentExpiryCount: number;
  onRefresh: () => void;
  isLoading: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isOnline?: boolean;
  lastCacheTime?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  authState,
  onOpenUpload,
  onOpenGuide,
  onOpenGoogleConnect,
  onOpenExport,
  onOpenRestore,
  onOpenExpiryMonitor,
  onOpenCategoryManager,
  urgentExpiryCount,
  onRefresh,
  isLoading,
  isDarkMode,
  onToggleDarkMode,
  isOnline = true,
  lastCacheTime
}) => {

  return (
    <header id="app-header" className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 shadow-2xs transition-colors">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          
          {/* Title & System Info */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Sertifikat Diklat RSUD dr.H.Jusuf.SK
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span>Sistem Manajemen Sertifikat Digital</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-600 dark:text-slate-300 font-semibold">Cloud Auto-Sync</span>
            </p>
          </div>

          {/* Action Bar & User Profile / Status */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            
            {/* Connection / LocalStorage Cache Status Indicator */}
            {!isOnline ? (
              <div 
                id="badge-offline-cache"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 shadow-2xs"
                title="Koneksi internet terputus. Metadata sertifikat dibaca langsung dari cache localStorage."
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Mode Offline (Cache)</span>
              </div>
            ) : (
              <div 
                id="badge-online-cache"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                title={lastCacheTime ? `Cache metadata lokal tersinkronisasi (${new Date(lastCacheTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})` : 'Cache metadata lokal aktif'}
              >
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Cache Tersinkron</span>
              </div>
            )}

            {/* Google Drive Status Button */}
            <button
              id="btn-google-drive-status"
              onClick={onOpenGoogleConnect}
              type="button"
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all shadow-2xs cursor-pointer ${
                authState.isConnected
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                  : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
              }`}
              title="Kelola Koneksi Google Drive"
            >
              {authState.isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="truncate max-w-[140px] sm:max-w-none">
                    ● Google Drive Connected
                  </span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Hubungkan Google Drive</span>
                </>
              )}
            </button>

            {/* Expiry Monitoring & Notification Bell Button */}
            <button
              id="btn-expiry-notifications"
              type="button"
              onClick={onOpenExpiryMonitor}
              className={`relative p-2.5 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                urgentExpiryCount > 0
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700/80 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
              title={urgentExpiryCount > 0 ? `${urgentExpiryCount} sertifikat mendekati kadaluarsa atau telah kadaluarsa` : 'Pusat Pemantauan Masa Berlaku'}
              aria-label="Peringatan Masa Berlaku"
            >
              <Bell className="w-4 h-4" />
              {urgentExpiryCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {urgentExpiryCount}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle Button */}
            <button
              id="btn-toggle-dark-mode"
              type="button"
              onClick={onToggleDarkMode}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs cursor-pointer"
              title={isDarkMode ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 transition-transform rotate-0 hover:-rotate-12" />
              )}
            </button>

            {/* Refresh Button */}
            <button
              id="btn-refresh-data"
              onClick={onRefresh}
              disabled={isLoading}
              type="button"
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Export Button */}
            <button
              id="btn-open-export"
              onClick={onOpenExport}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
              title="Ekspor data ke JSON atau CSV"
            >
              <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="hidden lg:inline">Ekspor</span>
            </button>

            {/* Restore Button */}
            <button
              id="btn-open-restore"
              onClick={onOpenRestore}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-indigo-200 dark:border-indigo-800/70 text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-2xs cursor-pointer"
              title="Pulihkan data dari file cadangan atau reset ke contoh"
            >
              <RotateCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Pulihkan Data</span>
            </button>

            {/* Category Management Button */}
            {onOpenCategoryManager && (
              <button
                id="btn-open-category-manager"
                onClick={onOpenCategoryManager}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
                title="Kelola Kategori Sertifikat (Tambah, Edit, Hapus)"
              >
                <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden md:inline">Kategori</span>
              </button>
            )}

            {/* Developer Guide Button */}
            <button
              id="btn-open-guide"
              onClick={onOpenGuide}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Panduan API</span>
            </button>

            {/* Primary Upload Button */}
            <button
              id="btn-open-upload-modal"
              onClick={onOpenUpload}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 transition-all shadow-md shadow-indigo-100 dark:shadow-indigo-950/50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Unggah File</span>
            </button>

            {/* User Avatar Badge */}
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 shadow-xs overflow-hidden shrink-0 hidden sm:block" title="Admin Account">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover" />
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

