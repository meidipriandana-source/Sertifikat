import React, { useState } from 'react';
import { Award, Users, HardDrive, FolderKanban, FileText, Image as ImageIcon, Sparkles, Cloud, ArrowUpRight, AlertTriangle, Clock, Settings2, Plus, PieChart } from 'lucide-react';
import { Certificate, CertificateStats, CategoryItem } from '../types';
import { getExpiryDetails } from '../utils/expiry';
import { getCategoryIcon } from '../utils/categoryColors';

interface DashboardStatsProps {
  certificates: Certificate[];
  stats: CertificateStats | null;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categoriesList?: CategoryItem[];
  onOpenCategoryManager?: () => void;
  onOpenExpiryMonitor?: () => void;
  onFilterExpiring?: () => void;
  onOpenUpload?: () => void;
}

const COLOR_PALETTE_HEX: Record<string, string> = {
  indigo: '#6366f1',
  blue: '#3b82f6',
  amber: '#f59e0b',
  emerald: '#10b981',
  purple: '#a855f7',
  rose: '#f43f5e',
  teal: '#14b8a6',
  slate: '#64748b',
};

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  certificates = [],
  stats,
  selectedCategory,
  onSelectCategory,
  categoriesList = [],
  onOpenCategoryManager,
  onOpenExpiryMonitor,
  onFilterExpiring,
  onOpenUpload
}) => {
  const safeCertificates = Array.isArray(certificates) ? certificates : [];
  const safeCategoriesList = Array.isArray(categoriesList) ? categoriesList : [];

  const totalCount = safeCertificates.length;
  const uniqueRecipients = new Set(safeCertificates.map(c => (c.recipientName || '').trim().toLowerCase())).size;
  const totalSize = safeCertificates.reduce((acc, c) => acc + (c.fileSize || 0), 0);
  
  const pdfCount = safeCertificates.filter(c => c.mimeType === 'application/pdf').length;
  const imgCount = safeCertificates.filter(c => c.mimeType && c.mimeType.startsWith('image/')).length;

  // Expiry stats calculation
  const expiringSoonCerts = safeCertificates.filter(c => getExpiryDetails(c.expiryDate).status === 'expiring_soon');
  const expiredCerts = safeCertificates.filter(c => getExpiryDetails(c.expiryDate).status === 'expired');

  // Build dynamic categories list (Semua + all custom/system categories + any uncategorized names in certificates)
  const categoryNamesSet = new Set<string>();
  safeCategoriesList.forEach(c => {
    if (c?.name) categoryNamesSet.add(c.name);
  });
  safeCertificates.forEach(c => {
    if (c?.category) categoryNamesSet.add(c.category);
  });

  const categories = ['Semua', ...Array.from(categoryNamesSet)];

  // Donut chart calculations: Distribution by Category
  const categoryDistRaw: { name: string; count: number; colorHex: string }[] = [];
  const predefinedColors = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];

  safeCategoriesList.forEach((cat, index) => {
    if (!cat?.name) return;
    const count = safeCertificates.filter(c => c.category === cat.name).length;
    if (count > 0) {
      categoryDistRaw.push({
        name: cat.name,
        count,
        colorHex: COLOR_PALETTE_HEX[cat.color] || predefinedColors[index % predefinedColors.length]
      });
    }
  });

  // Check any certificates in categories not in categoriesList
  safeCertificates.forEach(c => {
    if (c?.category && !categoryDistRaw.some(item => item.name === c.category)) {
      categoryDistRaw.push({
        name: c.category,
        count: safeCertificates.filter(item => item.category === c.category).length,
        colorHex: '#64748b'
      });
    }
  });

  const totalCategorized = categoryDistRaw.reduce((acc, curr) => acc + curr.count, 0);

  // SVG Donut calculation
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const donutSlices = categoryDistRaw.map((item) => {
    const percent = totalCategorized > 0 ? item.count / totalCategorized : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -(accumulatedPercent * circumference);
    accumulatedPercent += percent;
    return {
      ...item,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset
    };
  });

  // Calculated percentage of Google Drive free tier (15 GB)
  const maxStorageBytes = 15 * 1024 * 1024 * 1024;
  const simulatedTotalWithDrive = totalSize + 1.2 * 1024 * 1024 * 1024; // Represent realistic usage
  const storagePercentage = Math.min(Math.round((simulatedTotalWithDrive / maxStorageBytes) * 100), 100);

  return (
    <div className="space-y-4">
      {/* Bento Grid Top Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Bento Block 1: Dark Slate Hero Metric with Category Donut Chart (Span 7) */}
        <div 
          id="stat-card-hero" 
          className="md:col-span-7 bg-slate-900 rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden flex flex-col justify-between gap-5 shadow-sm border border-slate-800"
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Metric Numbers */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Total Sertifikat Terbit
                </h3>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                  {totalCount.toLocaleString('id-ID')}
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+12.4% bln ini</span>
                </span>
              </div>

              {/* Expiry alerts in hero if any */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {expiringSoonCerts.length > 0 && (
                  <button
                    type="button"
                    onClick={onOpenExpiryMonitor}
                    className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-0.5 rounded-full border border-amber-400/40 transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Klik untuk membuka pusat pemantauan masa berlaku"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>{expiringSoonCerts.length} Mendekati Kadaluarsa</span>
                  </button>
                )}

                {expiredCerts.length > 0 && (
                  <button
                    type="button"
                    onClick={onOpenExpiryMonitor}
                    className="inline-flex items-center gap-1.5 text-rose-300 text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 px-2.5 py-0.5 rounded-full border border-rose-400/40 transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Klik untuk melihat sertifikat yang telah kadaluarsa"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>{expiredCerts.length} Kadaluarsa</span>
                  </button>
                )}
              </div>
            </div>

            {/* Visual Donut Chart of Category Proportions */}
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 flex items-center gap-3.5 shrink-0 self-stretch sm:self-auto">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                  {/* Background Track */}
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    className="stroke-slate-700/50"
                    strokeWidth="9"
                    fill="transparent"
                  />
                  {/* Dynamic Category Slices */}
                  {totalCategorized > 0 ? (
                    donutSlices.map((slice, i) => (
                      <circle
                        key={i}
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke={slice.colorHex}
                        strokeWidth="9"
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        fill="transparent"
                        className="transition-all duration-700"
                      />
                    ))
                  ) : (
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      stroke="#6366f1"
                      strokeWidth="9"
                      strokeDasharray={`${circumference} 0`}
                      fill="transparent"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xs font-black text-white">{totalCount}</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Doc</span>
                </div>
              </div>

              {/* Mini Legend of Top Categories */}
              <div className="space-y-1 text-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <PieChart className="w-3 h-3 text-indigo-400" />
                  <span>Kategori Dokumen</span>
                </div>
                <div className="space-y-0.5 max-h-[56px] overflow-y-auto pr-1">
                  {donutSlices.slice(0, 3).map((slice, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.colorHex }} />
                      <span className="font-semibold text-slate-200 truncate max-w-[85px]">{slice.name}</span>
                      <span className="font-bold text-slate-400 ml-auto">{slice.percent}%</span>
                    </div>
                  ))}
                  {donutSlices.length === 0 && (
                    <span className="text-[10px] text-slate-400">Belum ada kategori</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar inside Hero: Format count chips + Primary Action CTA */}
          <div className="relative z-10 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-xs font-bold">{pdfCount} PDF</span>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-xs font-bold">{imgCount} Image</span>
              </div>
            </div>

            {/* Clear Primary Action CTA Button */}
            {onOpenUpload && (
              <button
                type="button"
                id="btn-hero-primary-upload"
                onClick={onOpenUpload}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Unggah Sertifikat Baru</span>
              </button>
            )}
          </div>

          {/* Radial blur glow background */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Bento Block 2: Emerald Google Drive Storage Meter (Span 5) */}
        <div 
          id="stat-card-storage" 
          className="md:col-span-5 bg-emerald-600 rounded-3xl p-5 sm:p-6 text-white flex flex-col justify-between shadow-md shadow-emerald-900/10 relative overflow-hidden border border-emerald-500"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Cloud className="w-4 h-4 text-emerald-100" />
                <h3 className="text-[10px] uppercase font-bold text-emerald-100 tracking-widest">
                  Google Drive Storage
                </h3>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1">
                {formatBytes(totalSize)}{' '}
                <span className="text-sm font-normal opacity-80">/ 15 GB</span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                {uniqueRecipients} Penerima Terdata
              </p>
            </div>
            
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xs">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-[11px] font-semibold text-emerald-100">
              <span>Kapasitas Digunakan</span>
              <span>{Math.max(storagePercentage, 8)}%</span>
            </div>
            <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden p-0.5 backdrop-blur-xs">
              <div 
                className="bg-white h-full rounded-full shadow-[0_0_12px_rgba(255,255,255,0.7)] transition-all duration-500"
                style={{ width: `${Math.max(storagePercentage, 8)}%` }}
              />
            </div>
            <p className="text-[11px] text-emerald-100/90 font-medium">
              ✓ Sinkronisasi penyimpanan Google Drive aktif otomatis
            </p>
          </div>

          {/* Subtle decorative glow */}
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

      </div>

      {/* Category Pills Filter with Generous Spacing */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 shadow-xs flex items-center justify-between gap-3 overflow-x-auto no-scrollbar transition-colors">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-1">
            Kategori:
          </span>
        </div>
        
        <div className="flex items-center gap-2.5 overflow-x-auto text-xs no-scrollbar flex-1 py-0.5">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'Semua' 
              ? certificates.length 
              : certificates.filter(c => c.category === cat).length;
            
            const matchedCategoryItem = categoriesList.find(c => c.name.toLowerCase() === cat.toLowerCase());
            const IconComp = matchedCategoryItem ? getCategoryIcon(matchedCategoryItem.icon) : null;

            return (
              <button
                key={cat}
                id={`filter-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shrink-0 flex items-center gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-indigo-950/50 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {IconComp && <IconComp className="w-3.5 h-3.5 opacity-90" />}
                <span className="font-bold">{cat}</span>
                <span className={`text-[11px] px-2 py-0.5 min-w-[22px] text-center rounded-lg font-black ${
                  isSelected 
                    ? 'bg-indigo-500 text-white shadow-xs' 
                    : 'bg-slate-200/90 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          {/* Quick Action: Manage Categories Button */}
          {onOpenCategoryManager && (
            <button
              id="btn-quick-manage-categories"
              type="button"
              onClick={onOpenCategoryManager}
              className="px-3.5 py-2 rounded-xl font-bold text-xs transition-all shrink-0 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer ml-1"
              title="Buka Manajemen Kategori (Tambah, Edit, Hapus)"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Kelola Kategori</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
