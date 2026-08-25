import React from 'react';
import { AlertTriangle, Clock, ArrowRight, ShieldAlert, X, BellRing, Calendar, ChevronRight } from 'lucide-react';
import { Certificate } from '../types';
import { getExpiryDetails } from '../utils/expiry';

interface ExpiryAlertBannerProps {
  certificates: Certificate[];
  onOpenMonitor: () => void;
  onFilterExpiring: () => void;
  onSelectCertificate: (cert: Certificate) => void;
}

export const ExpiryAlertBanner: React.FC<ExpiryAlertBannerProps> = ({
  certificates,
  onOpenMonitor,
  onFilterExpiring,
  onSelectCertificate
}) => {
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Filter certificates expiring in <= 30 days and expired
  const urgentCerts = certificates
    .map(cert => ({
      cert,
      details: getExpiryDetails(cert.expiryDate)
    }))
    .filter(item => item.details.status === 'expiring_soon' || item.details.status === 'expired')
    .sort((a, b) => (a.details.daysRemaining ?? 999) - (b.details.daysRemaining ?? 999));

  const expiringSoonCount = urgentCerts.filter(item => item.details.status === 'expiring_soon').length;
  const expiredCount = urgentCerts.filter(item => item.details.status === 'expired').length;

  if (urgentCerts.length === 0 || isDismissed) {
    return null;
  }

  // Top 3 urgent items for preview
  const previewItems = urgentCerts.slice(0, 3);

  return (
    <div 
      id="expiry-alert-banner"
      className="relative overflow-hidden rounded-2xl border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-slate-900 p-4 sm:p-4.5 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {/* Accent left indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 pl-1.5">
        
        {/* Left: Icon & Headline */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-black">
            <BellRing className="w-5 h-5" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-950 dark:text-amber-50 tracking-tight flex items-center gap-1.5">
                <span>Peringatan Masa Berlaku Sertifikat</span>
              </h3>
              
              {expiringSoonCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-amber-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-2xs">
                  <Clock className="w-3 h-3 stroke-[2.5]" />
                  <span>{expiringSoonCount} Segera Berakhir (&le; 30 Hari)</span>
                </span>
              )}

              {expiredCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-rose-700 text-white dark:bg-rose-500 dark:text-white shadow-2xs">
                  <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                  <span>{expiredCount} Telah Kadaluarsa</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold">
              Ditemukan sertifikat kompetensi/pelatihan yang memerlukan perpanjangan segera sebelum kedaluwarsa.
            </p>
          </div>
        </div>

        {/* Right: Quick Action Buttons & Dismiss */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={onFilterExpiring}
            className="px-3 py-1.5 rounded-xl text-xs font-black text-slate-900 dark:text-white bg-amber-200 dark:bg-slate-800 hover:bg-amber-300 dark:hover:bg-slate-700 border border-amber-400 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-98"
            title="Filter tabel sertifikat ke status kadaluarsa"
          >
            Filter Tabel
          </button>

          <button
            type="button"
            onClick={onOpenMonitor}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-slate-950 hover:bg-slate-850 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
          >
            <span>Buka Pemantau</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-amber-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Sembunyikan notifikasi ini"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

      </div>

      {/* Mini preview tags of closest expiring certificates */}
      <div className="mt-2.5 pt-2.5 border-t border-amber-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2 pl-1.5">
        <span className="text-[10px] font-black text-amber-950 dark:text-amber-300 uppercase tracking-wider bg-amber-200/80 dark:bg-amber-950/80 px-2 py-0.5 rounded">
          MENDESAK:
        </span>
        
        {previewItems.map(({ cert, details }, pIdx) => {
          const isExpired = details.status === 'expired';
          return (
            <button
              key={`banner-expiring-${cert.id || 'c'}-${pIdx}`}
              type="button"
              onClick={() => onSelectCertificate(cert)}
              className="inline-flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-100/60 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 transition-all shadow-2xs cursor-pointer group"
            >
              <span className={`w-2 h-2 rounded-full ${
                isExpired ? 'bg-rose-600 animate-pulse' : 'bg-amber-500 animate-pulse'
              }`} />
              <span className="truncate max-w-[140px] sm:max-w-[200px] font-bold text-slate-950 dark:text-white">
                {cert.title}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                isExpired 
                  ? 'bg-rose-700 text-white' 
                  : 'bg-amber-900 text-white dark:bg-amber-400 dark:text-slate-950'
              }`}>
                {details.badgeSubtext}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}

        {urgentCerts.length > 3 && (
          <button
            type="button"
            onClick={onOpenMonitor}
            className="text-[11px] font-black text-amber-950 dark:text-amber-300 hover:underline cursor-pointer ml-1"
          >
            +{urgentCerts.length - 3} lainnya...
          </button>
        )}
      </div>

    </div>
  );
};
