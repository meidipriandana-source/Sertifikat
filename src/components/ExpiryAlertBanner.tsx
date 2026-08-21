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
      className="relative overflow-hidden rounded-3xl border border-amber-300/80 dark:border-amber-700/60 bg-gradient-to-r from-amber-50/95 via-amber-100/70 to-orange-50/90 dark:from-amber-950/50 dark:via-amber-900/40 dark:to-orange-950/40 p-4 sm:p-5 shadow-md shadow-amber-500/5 transition-all animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Icon & Headline */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 border border-amber-400/30">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Peringatan Masa Berlaku Sertifikat</span>
              </h3>
              
              {expiringSoonCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  <Clock className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                  <span>{expiringSoonCount} Segera Berakhir (&le; 30 Hari)</span>
                </span>
              )}

              {expiredCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900/70 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                  <AlertTriangle className="w-3 h-3 text-rose-700 dark:text-rose-300" />
                  <span>{expiredCount} Telah Kadaluarsa</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Ditemukan sertifikat kompetensi/pelatihan yang membutuhkan pembaruan atau verifikasi perpanjangan.
            </p>
          </div>
        </div>

        {/* Right: Quick Action Buttons & Dismiss */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={onFilterExpiring}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-950 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-800/40 hover:bg-amber-200 dark:hover:bg-amber-800/60 border border-amber-300 dark:border-amber-700/60 transition-all cursor-pointer shadow-2xs active:scale-98"
            title="Filter tabel sertifikat ke status kadaluarsa"
          >
            Filter Tabel
          </button>

          <button
            type="button"
            onClick={onOpenMonitor}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 shadow-md shadow-amber-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
          >
            <span>Buka Pemantau Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-amber-200/50 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
            title="Sembunyikan notifikasi ini untuk sesi ini"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Mini preview tags of closest expiring certificates */}
      <div className="mt-3.5 pt-3 border-t border-amber-200/80 dark:border-amber-800/50 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
          Mendesak:
        </span>
        
        {previewItems.map(({ cert, details }) => {
          const isExpired = details.status === 'expired';
          return (
            <button
              key={cert.id}
              type="button"
              onClick={() => onSelectCertificate(cert)}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-amber-200 dark:border-amber-800/80 text-slate-800 dark:text-slate-200 transition-all shadow-2xs cursor-pointer group"
            >
              <span className={`w-2 h-2 rounded-full ${
                isExpired ? 'bg-rose-500 animate-pulse' : 'bg-amber-500 animate-pulse'
              }`} />
              <span className="truncate max-w-[160px] sm:max-w-[220px] font-bold">
                {cert.title}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                isExpired 
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300' 
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
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
            className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline cursor-pointer ml-1"
          >
            +{urgentCerts.length - 3} lainnya...
          </button>
        )}
      </div>

    </div>
  );
};
