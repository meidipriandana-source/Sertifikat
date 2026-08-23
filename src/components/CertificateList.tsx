import React, { useState } from 'react';
import { 
  Search, ExternalLink, Download, Eye, Trash2, Calendar, User, 
  Building2, FileText, Image as ImageIcon, LayoutGrid, Table, 
  ArrowUpDown, ShieldCheck, Sparkles, Folder, CalendarRange, RotateCcw, X, Clock, AlertTriangle, BellRing, Plus,
  CheckSquare, Square, Check, Layers
} from 'lucide-react';
import { Certificate, CategoryItem } from '../types';
import { ExpiryIndicatorBadge } from './ExpiryIndicatorBadge';
import { CertificateThumbnail } from './CertificateThumbnail';
import { getExpiryDetails } from '../utils/expiry';
import { getCategoryTheme } from '../utils/categoryColors';

interface CertificateListProps {
  certificates: Certificate[];
  onSelectCertificate: (cert: Certificate) => void;
  onDeleteCertificate: (cert: Certificate) => void;
  onDeleteMultipleCertificates?: (certs: Certificate[]) => void;
  categoriesList?: CategoryItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  onToggleSortOrder: () => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClearDateRange: () => void;
  onOpenUpload: () => void;
  expiryFilter: 'all' | 'expiring_soon' | 'expired' | 'valid' | 'lifetime';
  onExpiryFilterChange: (filter: 'all' | 'expiring_soon' | 'expired' | 'valid' | 'lifetime') => void;
  onOpenExpiryMonitor: () => void;
  onOpenCategoryManager?: () => void;
}


const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Prestasi: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  Pelatihan: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  Workshop: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  Akademik: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  Penghargaan: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  Kelulusan: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  Lainnya: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const CertificateList: React.FC<CertificateListProps> = ({
  certificates = [],
  onSelectCertificate,
  onDeleteCertificate,
  onDeleteMultipleCertificates,
  categoriesList = [],
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onToggleSortOrder,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearDateRange,
  onOpenUpload,
  expiryFilter = 'all',
  onExpiryFilterChange,
  onOpenExpiryMonitor,
  onOpenCategoryManager
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const hasActiveDateFilter = Boolean(startDate || endDate);
  const safeCertificates = Array.isArray(certificates) ? certificates : [];

  // Compute expiry stats for badges
  const expiryCounts = safeCertificates.reduce(
    (acc, cert) => {
      const d = getExpiryDetails(cert?.expiryDate);
      if (d.status === 'expiring_soon') acc.expiringSoon++;
      else if (d.status === 'expired') acc.expired++;
      else if (d.status === 'valid') acc.valid++;
      else if (d.status === 'lifetime') acc.lifetime++;
      return acc;
    },
    { expiringSoon: 0, expired: 0, valid: 0, lifetime: 0 }
  );

  // Filter certificates by expiry status if selected
  const displayedCertificates = safeCertificates.filter(cert => {
    if (!cert) return false;
    if (expiryFilter === 'all') return true;
    const d = getExpiryDetails(cert.expiryDate);
    if (expiryFilter === 'expiring_soon') return d.status === 'expiring_soon';
    if (expiryFilter === 'expired') return d.status === 'expired';
    if (expiryFilter === 'valid') return d.status === 'valid';
    if (expiryFilter === 'lifetime') return d.status === 'lifetime';
    return true;
  });

  // Selection helpers
  const isAllDisplayedSelected = displayedCertificates.length > 0 && displayedCertificates.every(c => selectedIds.has(c.id));
  const isSomeDisplayedSelected = displayedCertificates.some(c => selectedIds.has(c.id)) && !isAllDisplayedSelected;

  const toggleSelectOne = (id: string, e?: React.MouseEvent | React.ChangeEvent) => {
    e?.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllDisplayed = () => {
    if (isAllDisplayedSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        displayedCertificates.forEach(c => {
          if (c?.id) next.delete(c.id);
        });
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        displayedCertificates.forEach(c => {
          if (c?.id) next.add(c.id);
        });
        return next;
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleTriggerBulkDelete = () => {
    const selectedCerts = certificates.filter(c => selectedIds.has(c.id));
    if (selectedCerts.length > 0) {
      if (onDeleteMultipleCertificates) {
        onDeleteMultipleCertificates(selectedCerts);
      } else if (selectedCerts.length === 1) {
        onDeleteCertificate(selectedCerts[0]);
      }
    }
  };

  const handleQuickPreset = (preset: 'all' | 'this_month' | 'this_year' | 'last_30_days' | 'last_year') => {

    const now = new Date();
    if (preset === 'all') {
      onClearDateRange();
      return;
    }
    if (preset === 'this_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      onStartDateChange(`${year}-${month}-01`);
      onEndDateChange(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'this_year') {
      const year = now.getFullYear();
      onStartDateChange(`${year}-01-01`);
      onEndDateChange(`${year}-12-31`);
    } else if (preset === 'last_year') {
      const year = now.getFullYear() - 1;
      onStartDateChange(`${year}-01-01`);
      onEndDateChange(`${year}-12-31`);
    } else if (preset === 'last_30_days') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      const format = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      onStartDateChange(format(past));
      onEndDateChange(format(now));
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col shadow-sm transition-colors">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Riwayat Sertifikat Terbit
            </h2>
            <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60">
              {certificates.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Menampilkan data tersinkronisasi dengan Google Drive
          </p>
        </div>

        {/* Search & Layout Actions */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <input
              id="input-search-certificates"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama, penerima, ID sertifikat..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
            <span className="text-slate-400 dark:text-slate-500 font-semibold text-[10px] uppercase tracking-wider hidden sm:inline">Urut:</span>
            <select
              id="select-sort-by"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
            >
              <option value="createdAt" className="dark:bg-slate-800">Tanggal Unggah</option>
              <option value="issueDate" className="dark:bg-slate-800">Tanggal Terbit</option>
              <option value="expiryDate" className="dark:bg-slate-800">Masa Berlaku / Kadaluarsa</option>
              <option value="recipientName" className="dark:bg-slate-800">Nama Pemilik</option>
              <option value="title" className="dark:bg-slate-800">Nama Sertifikat</option>
            </select>
            <button
              type="button"
              onClick={onToggleSortOrder}
              className="p-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title={`Urutan: ${sortOrder === 'asc' ? 'A-Z / Lama ke Baru' : 'Z-A / Baru ke Lama'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Toggle (Grid / Table) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <button
              id="btn-view-grid"
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Tampilan Grid Bento"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              id="btn-view-table"
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Tampilan Tabel Rinci"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Primary Upload CTA */}
          <button
            type="button"
            id="btn-list-header-upload"
            onClick={onOpenUpload}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Unggah Sertifikat</span>
          </button>

        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="pt-4 pb-2">
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 transition-colors">
          
          {/* Inputs */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 shrink-0">
              <CalendarRange className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Rentang Tanggal Terbit:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Start Date */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Dari:</span>
                <input
                  id="input-filter-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="text-xs font-medium text-slate-800 dark:text-slate-200 outline-none bg-transparent cursor-pointer"
                />
              </div>

              <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">s/d</span>

              {/* End Date */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Sampai:</span>
                <input
                  id="input-filter-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="text-xs font-medium text-slate-800 dark:text-slate-200 outline-none bg-transparent cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets & Reset */}
          <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">
              Preset Cepat:
            </span>

            <button
              type="button"
              onClick={() => handleQuickPreset('this_month')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Bulan Ini
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('last_30_days')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              30 Hari Terakhir
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('this_year')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Tahun Ini
            </button>

            {hasActiveDateFilter && (
              <button
                id="btn-clear-date-filter"
                type="button"
                onClick={onClearDateRange}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer shadow-2xs ml-1"
                title="Hapus Filter Tanggal"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Tanggal</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Expiry Status Filter Tabs Ribbon */}
      <div className="pt-3 pb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Masa Berlaku:</span>
          </span>

          {/* All */}
          <button
            type="button"
            onClick={() => onExpiryFilterChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              expiryFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Semua</span>
            <span className="text-[10px] opacity-80 font-mono">({certificates.length})</span>
          </button>

          {/* Expiring Soon (<= 30 Hari) */}
          <button
            type="button"
            onClick={() => onExpiryFilterChange('expiring_soon')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              expiryFilter === 'expiring_soon'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Segera Berakhir (&le; 30 Hari)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              expiryFilter === 'expiring_soon' ? 'bg-amber-700 text-white' : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
            }`}>
              {expiryCounts.expiringSoon}
            </span>
          </button>

          {/* Expired */}
          <button
            type="button"
            onClick={() => onExpiryFilterChange('expired')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              expiryFilter === 'expired'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Kadaluarsa</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              expiryFilter === 'expired' ? 'bg-rose-800 text-white' : 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
            }`}>
              {expiryCounts.expired}
            </span>
          </button>

          {/* Valid */}
          <button
            type="button"
            onClick={() => onExpiryFilterChange('valid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              expiryFilter === 'valid'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100'
            }`}
          >
            <span>Aktif (&gt; 30 Hari)</span>
            <span className="text-[10px] opacity-80 font-mono">({expiryCounts.valid})</span>
          </button>

          {/* Lifetime */}
          <button
            type="button"
            onClick={() => onExpiryFilterChange('lifetime')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              expiryFilter === 'lifetime'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100'
            }`}
          >
            <span>Seumur Hidup</span>
            <span className="text-[10px] opacity-80 font-mono">({expiryCounts.lifetime})</span>
          </button>
        </div>

        {/* Action to open monitor modal */}
        <button
          type="button"
          onClick={onOpenExpiryMonitor}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 hover:underline cursor-pointer self-end sm:self-center"
        >
          <BellRing className="w-3.5 h-3.5 text-amber-500" />
          <span>Buka Pusat Pemantauan</span>
        </button>
      </div>

      {/* CONTRENG / BULK ACTION TOOLBAR (When 1 or more items selected) */}
      {selectedIds.size > 0 && (
        <div 
          id="bar-bulk-actions"
          className="mt-4 p-3.5 sm:p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl shadow-xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-indigo-600/30 border border-indigo-400/40 text-indigo-200 px-3 py-1.5 rounded-xl font-bold text-xs">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span>{selectedIds.size} Sertifikat Dicontreng / Dipilih</span>
            </div>
            <button
              type="button"
              id="btn-select-all-toggle"
              onClick={toggleSelectAllDisplayed}
              className="text-xs text-slate-300 hover:text-white font-semibold underline underline-offset-2 cursor-pointer transition-colors"
            >
              {isAllDisplayedSelected ? 'Batalkan Semua' : `Pilih Semua (${displayedCertificates.length})`}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              id="btn-cancel-selection"
              onClick={handleClearSelection}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-bulk-delete"
              type="button"
              onClick={handleTriggerBulkDelete}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
              <span>Hapus {selectedIds.size} Pilihan</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {displayedCertificates.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-slate-700">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Belum Ada Sertifikat Ditemukan</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            {expiryFilter !== 'all'
              ? `Tidak ada sertifikat dengan status masa berlaku "${expiryFilter === 'expiring_soon' ? 'Segera Berakhir (≤30 Hari)' : expiryFilter === 'expired' ? 'Kadaluarsa' : expiryFilter}".`
              : hasActiveDateFilter
              ? `Tidak ada sertifikat dalam periode ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}.`
              : searchQuery
              ? 'Tidak ada sertifikat yang sesuai dengan kata kunci Anda.'
              : 'Mulai unggah sertifikat pertama Anda untuk langsung disimpan di Google Drive.'}
          </p>
          <div className="flex items-center justify-center gap-2.5">
            {expiryFilter !== 'all' && (
              <button
                type="button"
                onClick={() => onExpiryFilterChange('all')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tampilkan Semua Status</span>
              </button>
            )}
            {hasActiveDateFilter && (
              <button
                type="button"
                onClick={onClearDateRange}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Hapus Filter Periode</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-950/50 active:scale-95 transition-all cursor-pointer"
            >
              Unggah File Sekarang
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5">
          {displayedCertificates.map((cert) => {
            const catStyle = getCategoryTheme(cert.category, categoriesList);
            const isPdf = cert.mimeType === 'application/pdf';
            const isSelected = selectedIds.has(cert.id);

            return (
              <div
                key={cert.id}
                id={`cert-card-${cert.id}`}
                className={`bg-white dark:bg-slate-850 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group ${
                  isSelected 
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50 dark:ring-indigo-400/50 shadow-md shadow-indigo-500/10' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md dark:hover:shadow-indigo-950/30'
                }`}
              >
                {/* Visual Thumbnail Preview Header Banner */}
                <div className="relative">
                  {/* Selection Checkbox for Grid Card */}
                  <button
                    type="button"
                    id={`checkbox-cert-grid-${cert.id}`}
                    onClick={(e) => toggleSelectOne(cert.id, e)}
                    className={`absolute top-2.5 left-2.5 z-20 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-md ${
                      isSelected
                        ? 'bg-indigo-600 text-white ring-2 ring-white dark:ring-slate-900 scale-105'
                        : 'bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-700 hover:scale-105'
                    }`}
                    title={isSelected ? 'Batalkan contreng sertifikat ini' : 'Contreng untuk hapus / pilih sertifikat ini'}
                    aria-label="Pilih sertifikat untuk dihapus"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Square className="w-4 h-4 stroke-[1.5]" />
                    )}
                  </button>

                  <CertificateThumbnail 
                    certificate={cert} 
                    size="grid" 
                    onClick={() => onSelectCertificate(cert)} 
                    showHoverZoom={false}
                    className="w-full cursor-pointer"
                  />
                  
                  {/* Top Floating Badge Bar */}
                  <div className="absolute top-2.5 left-11 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-xs ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                      {cert.category}
                    </span>
                    <span className="text-[10px] text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs font-semibold px-2 py-0.5 rounded-md shadow-xs border border-slate-200/50 dark:border-slate-800">
                      {formatBytes(cert.fileSize)}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono mb-1">
                      <span>ID: {cert.credentialId || 'Auto'}</span>
                      <span className="uppercase font-bold">{isPdf ? 'PDF Dokumen' : 'Image'}</span>
                    </div>

                    <h3 
                      onClick={() => onSelectCertificate(cert)}
                      className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 cursor-pointer leading-snug"
                    >
                      {cert.title}
                    </h3>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{cert.recipientName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate text-slate-600 dark:text-slate-400">{cert.issuer}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>Terbit: {cert.issueDate}</span>
                      </div>
                    </div>

                    {/* Expiry Indicator Badge with blinking LED */}
                    <div className="mt-2.5">
                      <ExpiryIndicatorBadge expiryDate={cert.expiryDate} variant="compact" />
                    </div>

                    {cert.tags && cert.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3.5">
                        {cert.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                        {cert.tags.length > 3 && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center font-medium">
                            +{cert.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    
                    {/* Primary Button: Lihat di Google Drive */}
                    <a
                      href={cert.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Lihat Drive</span>
                    </a>

                    {/* View Details Modal */}
                    <button
                      type="button"
                      onClick={() => onSelectCertificate(cert)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="Lihat Detail & Verifikasi"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Direct Download */}
                    {cert.webContentLink && (
                      <a
                        href={cert.webContentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="Unduh File"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}

                    {/* Delete */}
                    <button
                      id={`btn-delete-cert-grid-${cert.id}`}
                      type="button"
                      onClick={() => onDeleteCertificate(cert)}
                      className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                      title="Hapus Sertifikat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="pt-4 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <table className="w-full min-w-[1220px] text-left text-xs text-slate-600 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200/80 dark:border-slate-800">
              <tr className="text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider font-bold">
                {/* Contreng Column Header */}
                <th className="py-3.5 px-3 w-[46px] text-center">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      id="checkbox-select-all-table"
                      checked={isAllDisplayedSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeDisplayedSelected;
                      }}
                      onChange={toggleSelectAllDisplayed}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer accent-indigo-600"
                      title="Contreng / Pilih Semua Sertifikat"
                    />
                  </div>
                </th>
                <th className="py-3.5 px-3 w-[85px] text-center">Pratinjau</th>
                <th className="py-3.5 px-4 min-w-[250px]">Nama Sertifikat</th>
                <th className="py-3.5 px-4 min-w-[175px]">Pemilik / Peserta</th>
                <th className="py-3.5 px-3 min-w-[110px]">Kategori</th>
                <th className="py-3.5 px-4 min-w-[180px]">Lembaga Penerbit</th>
                <th className="py-3.5 px-3 min-w-[115px] text-center">Tanggal Terbit</th>
                <th className="py-3.5 px-4 min-w-[155px]">Masa Berlaku</th>
                <th className="py-3.5 px-3 min-w-[125px] whitespace-nowrap">Format / Ukuran</th>
                <th className="py-3.5 px-4 min-w-[170px] text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedCertificates.map((cert) => {
                const catStyle = getCategoryTheme(cert.category, categoriesList);
                const isPdf = cert.mimeType === 'application/pdf';
                const isSelected = selectedIds.has(cert.id);

                return (
                  <tr 
                    key={cert.id} 
                    className={`transition-colors ${
                      isSelected 
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 font-medium border-l-4 border-indigo-600 dark:border-indigo-400' 
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Contreng Checkbox Column */}
                    <td className="py-3 px-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          id={`checkbox-row-${cert.id}`}
                          checked={isSelected}
                          onChange={(e) => toggleSelectOne(cert.id, e)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer accent-indigo-600"
                          title="Contreng untuk hapus / pilih sertifikat ini"
                        />
                      </div>
                    </td>

                    {/* Thumbnail Preview Column with Hover Zoom */}
                    <td className="py-3 px-3 text-center align-middle">
                      <div className="flex items-center justify-center">
                        <CertificateThumbnail 
                          certificate={cert}
                          size="table"
                          onClick={() => onSelectCertificate(cert)}
                          showHoverZoom={true}
                        />
                      </div>
                    </td>

                    {/* Certificate Title Column */}
                    <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="min-w-0">
                        <p 
                          onClick={() => onSelectCertificate(cert)}
                          className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-slate-900 dark:text-slate-100 transition-colors leading-tight text-sm line-clamp-2"
                          title={cert.title}
                        >
                          {cert.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {cert.credentialId || 'Tanpa ID'}
                          </span>
                          {cert.tags && cert.tags.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-medium">
                              #{cert.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{cert.recipientName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                        {cert.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[170px]">{cert.issuer}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {cert.issueDate}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <ExpiryIndicatorBadge expiryDate={cert.expiryDate} variant="pill" />
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold mr-1.5">
                        {isPdf ? 'PDF' : 'IMG'}
                      </span>
                      {formatBytes(cert.fileSize)}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={cert.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs border border-indigo-200/60 dark:border-indigo-800/60"
                          title="Buka Dokumen di Google Drive"
                        >
                          <span>Lihat Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => onSelectCertificate(cert)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail & QR Code"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-delete-cert-table-${cert.id}`}
                          type="button"
                          onClick={() => onDeleteCertificate(cert)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Sertifikat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div>
          <span>Menampilkan <strong className="text-slate-800 dark:text-slate-200">{displayedCertificates.length}</strong> dari <strong className="text-slate-800 dark:text-slate-200">{certificates.length}</strong> total sertifikat</span>
          {selectedIds.size > 0 && (
            <span className="ml-2 font-bold text-indigo-600 dark:text-indigo-400">({selectedIds.size} dicontreng untuk dihapus)</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
            >
              Hapus Semua Centang ({selectedIds.size})
            </button>
          )}
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Tersinkronisasi dengan Google Drive Cloud Storage</span>
          </div>
        </div>
      </div>

    </section>
  );
};
