import React from 'react';
import { Clock, AlertTriangle, AlertCircle, ShieldCheck, Infinity } from 'lucide-react';
import { getExpiryDetails } from '../utils/expiry';

interface ExpiryIndicatorBadgeProps {
  expiryDate?: string | null;
  variant?: 'card' | 'table' | 'detail' | 'compact';
  showDate?: boolean;
}

export const ExpiryIndicatorBadge: React.FC<ExpiryIndicatorBadgeProps> = ({
  expiryDate,
  variant = 'compact',
  showDate = true
}) => {
  const details = getExpiryDetails(expiryDate);
  const { status, formattedDate, badgeLabel, badgeSubtext, isBlinking, colorTheme } = details;

  // Visual Styles based on status theme
  const themeStyles = {
    amber: {
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
      badgeBorder: 'border-amber-300 dark:border-amber-700/80',
      badgeText: 'text-amber-800 dark:text-amber-300',
      ledPing: 'bg-amber-400',
      ledDot: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.9)] ring-2 ring-amber-200 dark:ring-amber-900',
      glowBanner: 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
    },
    rose: {
      badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
      badgeBorder: 'border-rose-300 dark:border-rose-700/80',
      badgeText: 'text-rose-800 dark:text-rose-300',
      ledPing: 'bg-rose-500',
      ledDot: 'bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.9)] ring-2 ring-rose-200 dark:ring-rose-900',
      glowBanner: 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
    },
    emerald: {
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      badgeBorder: 'border-emerald-200 dark:border-emerald-800/60',
      badgeText: 'text-emerald-800 dark:text-emerald-300',
      ledPing: 'bg-emerald-400',
      ledDot: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
      glowBanner: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200',
      icon: <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
    },
    blue: {
      badgeBg: 'bg-slate-50 dark:bg-slate-800/80',
      badgeBorder: 'border-slate-200 dark:border-slate-700',
      badgeText: 'text-slate-700 dark:text-slate-300',
      ledPing: 'bg-blue-400',
      ledDot: 'bg-blue-500',
      glowBanner: 'bg-slate-500/10 border-slate-500/20 text-slate-800 dark:text-slate-200',
      icon: <Infinity className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
    }
  }[colorTheme];

  // Blinking Light Hardware LED Indicator
  const renderLedIndicator = () => (
    <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
      {isBlinking && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${themeStyles.ledPing}`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full h-2 w-2 ${themeStyles.ledDot} ${
          isBlinking ? 'animate-led-blink' : ''
        }`}
      />
    </span>
  );

  // Variant: Detail Modal View (High prominence)
  if (variant === 'detail') {
    return (
      <div className={`p-4 rounded-2xl border ${themeStyles.badgeBorder} ${themeStyles.badgeBg} flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shrink-0 shadow-2xs">
            {renderLedIndicator()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Masa Berlaku Sertifikat
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${themeStyles.badgeBg} ${themeStyles.badgeText} ${themeStyles.badgeBorder}`}>
                {themeStyles.icon}
                <span>{badgeLabel}</span>
              </span>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
              <span>{formattedDate}</span>
              {status !== 'lifetime' && (
                <span className={`text-xs font-bold ${themeStyles.badgeText}`}>
                  ({badgeSubtext})
                </span>
              )}
            </p>
          </div>
        </div>

        {isBlinking && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            {renderLedIndicator()}
            <span className={themeStyles.badgeText}>
              {status === 'expiring_soon' ? 'Peringatan Kadaluarsa' : 'Perlu Pembaruan'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Variant: Card View (for Grid Card body/footer)
  if (variant === 'card') {
    return (
      <div className={`inline-flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl border text-xs font-medium ${themeStyles.badgeBg} ${themeStyles.badgeBorder} ${themeStyles.badgeText}`}>
        <div className="flex items-center gap-2 min-w-0">
          {renderLedIndicator()}
          <span className="font-bold text-[11px] truncate">
            {status === 'lifetime' ? 'Berlaku Seumur Hidup' : `Exp: ${formattedDate}`}
          </span>
        </div>
        <span className="text-[10px] font-extrabold shrink-0 ml-1.5 opacity-90">
          {status === 'lifetime' ? 'Permanen' : badgeSubtext}
        </span>
      </div>
    );
  }

  // Variant: Table Row Compact View
  if (variant === 'table') {
    return (
      <div className="flex flex-col items-start gap-1">
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${themeStyles.badgeBg} ${themeStyles.badgeBorder} ${themeStyles.badgeText}`}>
          {renderLedIndicator()}
          <span>{badgeLabel}</span>
        </div>
        {showDate && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {status === 'lifetime' ? 'Seumur Hidup' : formattedDate}
          </span>
        )}
      </div>
    );
  }

  // Variant: Compact Pill Badge
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${themeStyles.badgeBg} ${themeStyles.badgeBorder} ${themeStyles.badgeText}`}>
      {renderLedIndicator()}
      <span>{status === 'lifetime' ? 'Seumur Hidup' : `${formattedDate} (${badgeSubtext})`}</span>
    </span>
  );
};
