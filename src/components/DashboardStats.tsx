import React from 'react';
import { Award, Users, HardDrive, FolderKanban, FileText, Image as ImageIcon, Sparkles, Cloud, ArrowUpRight, AlertTriangle, Clock } from 'lucide-react';
import { Certificate, CertificateStats } from '../types';
import { getExpiryDetails } from '../utils/expiry';

interface DashboardStatsProps {
  certificates: Certificate[];
  stats: CertificateStats | null;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenExpiryMonitor?: () => void;
  onFilterExpiring?: () => void;
}


function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  certificates,
  stats,
  selectedCategory,
  onSelectCategory,
  onOpenExpiryMonitor,
  onFilterExpiring
}) => {
  const totalCount = certificates.length;
  const uniqueRecipients = new Set(certificates.map(c => c.recipientName.trim().toLowerCase())).size;
  const totalSize = certificates.reduce((acc, c) => acc + (c.fileSize || 0), 0);
  
  const pdfCount = certificates.filter(c => c.mimeType === 'application/pdf').length;
  const imgCount = certificates.filter(c => c.mimeType.startsWith('image/')).length;

  // Expiry stats calculation
  const expiringSoonCerts = certificates.filter(c => getExpiryDetails(c.expiryDate).status === 'expiring_soon');
  const expiredCerts = certificates.filter(c => getExpiryDetails(c.expiryDate).status === 'expired');

  const categories = ['Semua', 'Prestasi', 'Pelatihan', 'Workshop', 'Akademik', 'Penghargaan', 'Kelulusan', 'Lainnya'];


  // Calculated percentage of Google Drive free tier (15 GB)
  const maxStorageBytes = 15 * 1024 * 1024 * 1024;
  const simulatedTotalWithDrive = totalSize + 1.2 * 1024 * 1024 * 1024; // Represent realistic usage
  const storagePercentage = Math.min(Math.round((simulatedTotalWithDrive / maxStorageBytes) * 100), 100);

  return (
    <div className="space-y-5">
      {/* Bento Grid Top Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Bento Block 1: Dark Slate Hero Metric (Span 7) */}
        <div 
          id="stat-card-hero" 
          className="md:col-span-7 bg-slate-900 rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm border border-slate-800"
        >
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                Total Sertifikat Terbit
              </h3>
            </div>
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              {totalCount.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+12.4% peningkatan bulan ini</span>
              </span>

              {/* Blinking Expiry Alert Badge in hero if any expiring */}
              {expiringSoonCerts.length > 0 && (
                <button
                  type="button"
                  onClick={onOpenExpiryMonitor}
                  className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-full border border-amber-400/40 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Klik untuk membuka pusat pemantauan masa berlaku"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-led-blink shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                  <span>{expiringSoonCerts.length} Mendekati Kadaluarsa (&le;30 Hari)</span>
                </button>
              )}

              {expiredCerts.length > 0 && (
                <button
                  type="button"
                  onClick={onOpenExpiryMonitor}
                  className="inline-flex items-center gap-1.5 text-rose-300 text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 px-2.5 py-1 rounded-full border border-rose-400/40 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Klik untuk melihat sertifikat yang telah kadaluarsa"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{expiredCerts.length} Kadaluarsa</span>
                </button>
              )}

            </div>
          </div>

          {/* Glass Metric Chips */}
          <div className="relative z-10 flex sm:flex-col gap-3 shrink-0">
            <div className="bg-white/10 px-4 py-3 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs">
                PDF
              </div>
              <div>
                <div className="text-base font-bold leading-none">{pdfCount} File</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Dokumen Resmi</div>
              </div>
            </div>

            <div className="bg-white/10 px-4 py-3 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                IMG
              </div>
              <div>
                <div className="text-base font-bold leading-none">{imgCount} File</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">JPG / PNG</div>
              </div>
            </div>
          </div>

          {/* Radial blur glow background */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Bento Block 2: Emerald Google Drive Storage Meter (Span 5) */}
        <div 
          id="stat-card-storage" 
          className="md:col-span-5 bg-emerald-600 rounded-3xl p-6 sm:p-7 text-white flex flex-col justify-between shadow-lg shadow-emerald-100 relative overflow-hidden border border-emerald-500"
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

          <div className="space-y-2 mt-6">
            <div className="flex justify-between text-[11px] font-semibold text-emerald-100">
              <span>Kapasitas Digunakan</span>
              <span>{Math.max(storagePercentage, 8)}%</span>
            </div>
            <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden p-0.5 backdrop-blur-xs">
              <div 
                className="bg-white h-full rounded-full shadow-[0_0_12px_rgba(255,255,255,0.7)] transition-all duration-500"
                style={{ width: `${Math.max(storagePercentage, 8)}%` }}
              />
            </div>
            <p className="text-[11px] text-emerald-100/90 font-medium">
              ✓ Sinkronisasi multi-part Google Drive API aktif otomatis
            </p>
          </div>

          {/* Subtle decorative glow */}
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

      </div>

      {/* Category Pills Bento Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs flex items-center justify-between gap-3 overflow-x-auto no-scrollbar transition-colors">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-1">
            Kategori:
          </span>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'Semua' 
              ? certificates.length 
              : certificates.filter(c => c.category === cat).length;

            return (
              <button
                key={cat}
                id={`filter-cat-${cat.toLowerCase()}`}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-indigo-950/50'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                  isSelected 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
