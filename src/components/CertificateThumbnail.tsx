import React, { useState } from 'react';
import { 
  FileText, Image as ImageIcon, Award, Sparkles, ZoomIn, 
  ExternalLink, CheckCircle2, ShieldCheck, Eye
} from 'lucide-react';
import { Certificate } from '../types';

interface CertificateThumbnailProps {
  certificate: Certificate;
  size?: 'table' | 'grid' | 'large';
  onClick?: () => void;
  showHoverZoom?: boolean;
  className?: string;
}

const CATEGORY_GRADIENTS: Record<string, { bg: string; border: string; accent: string; text: string }> = {
  Prestasi: { 
    bg: 'from-amber-500/15 via-amber-500/5 to-amber-600/10 dark:from-amber-500/25 dark:to-amber-950/40', 
    border: 'border-amber-300/70 dark:border-amber-700/60',
    accent: 'bg-amber-500 text-white',
    text: 'text-amber-700 dark:text-amber-300'
  },
  Pelatihan: { 
    bg: 'from-indigo-500/15 via-indigo-500/5 to-indigo-600/10 dark:from-indigo-500/25 dark:to-indigo-950/40', 
    border: 'border-indigo-300/70 dark:border-indigo-700/60',
    accent: 'bg-indigo-600 text-white',
    text: 'text-indigo-700 dark:text-indigo-300'
  },
  Workshop: { 
    bg: 'from-emerald-500/15 via-emerald-500/5 to-emerald-600/10 dark:from-emerald-500/25 dark:to-emerald-950/40', 
    border: 'border-emerald-300/70 dark:border-emerald-700/60',
    accent: 'bg-emerald-600 text-white',
    text: 'text-emerald-700 dark:text-emerald-300'
  },
  Akademik: { 
    bg: 'from-blue-500/15 via-blue-500/5 to-blue-600/10 dark:from-blue-500/25 dark:to-blue-950/40', 
    border: 'border-blue-300/70 dark:border-blue-700/60',
    accent: 'bg-blue-600 text-white',
    text: 'text-blue-700 dark:text-blue-300'
  },
  Penghargaan: { 
    bg: 'from-purple-500/15 via-purple-500/5 to-purple-600/10 dark:from-purple-500/25 dark:to-purple-950/40', 
    border: 'border-purple-300/70 dark:border-purple-700/60',
    accent: 'bg-purple-600 text-white',
    text: 'text-purple-700 dark:text-purple-300'
  },
  Kelulusan: { 
    bg: 'from-teal-500/15 via-teal-500/5 to-teal-600/10 dark:from-teal-500/25 dark:to-teal-950/40', 
    border: 'border-teal-300/70 dark:border-teal-700/60',
    accent: 'bg-teal-600 text-white',
    text: 'text-teal-700 dark:text-teal-300'
  },
  Lainnya: { 
    bg: 'from-slate-500/15 via-slate-500/5 to-slate-600/10 dark:from-slate-500/25 dark:to-slate-900/50', 
    border: 'border-slate-300/70 dark:border-slate-700/60',
    accent: 'bg-slate-700 text-white',
    text: 'text-slate-700 dark:text-slate-300'
  },
};

export const CertificateThumbnail: React.FC<CertificateThumbnailProps> = ({
  certificate,
  size = 'table',
  onClick,
  showHoverZoom = true,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isPdf = certificate.mimeType === 'application/pdf';
  const categoryStyle = CATEGORY_GRADIENTS[certificate.category] || CATEGORY_GRADIENTS.Lainnya;

  // Determine possible thumbnail URLs
  const candidateUrl = certificate.thumbnailLink 
    || (certificate.driveFileId && !certificate.driveFileId.includes('SAMPLE') 
        ? `https://drive.google.com/thumbnail?id=${certificate.driveFileId}&sz=w320`
        : null);

  // Sizing definitions
  const sizeClasses = {
    table: 'w-20 h-14 min-w-[5rem]',
    grid: 'w-full h-36',
    large: 'w-full h-56'
  }[size];

  return (
    <div 
      className={`relative group inline-block select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Thumbnail Container */}
      <div 
        onClick={onClick}
        className={`${sizeClasses} rounded-xl overflow-hidden border border-slate-200/90 dark:border-slate-700/80 shadow-2xs bg-slate-100 dark:bg-slate-850 cursor-pointer relative transition-all duration-200 group-hover:border-indigo-400 dark:group-hover:border-indigo-500 group-hover:shadow-md`}
      >
        {/* Attempt to load image if available and not erroring */}
        {candidateUrl && !imageError ? (
          <>
            <img 
              src={candidateUrl} 
              alt={certificate.title}
              referrerPolicy="no-referrer"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            
            {/* Loading placeholder skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-slate-200/70 dark:bg-slate-800 animate-pulse flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
            )}
          </>
        ) : (
          /* High-Fidelity Synthesized Certificate Document Card */
          <div className={`w-full h-full p-1.5 flex flex-col justify-between bg-gradient-to-br ${categoryStyle.bg} relative overflow-hidden`}>
            
            {/* Outer Decorative Certificate Border Ring */}
            <div className={`absolute inset-1 rounded-lg border border-dashed ${categoryStyle.border} pointer-events-none opacity-80`} />
            
            {/* Watermark Crest/Ribbon background */}
            <div className="absolute -right-3 -bottom-3 opacity-15 dark:opacity-20 pointer-events-none">
              <Award className="w-16 h-16 text-slate-800 dark:text-slate-200 transform -rotate-12" />
            </div>

            {/* Mini Top Row: Category & Format Badge */}
            <div className="relative z-10 flex items-center justify-between gap-1">
              <span className="text-[8px] font-extrabold uppercase tracking-tight px-1.5 py-0.5 rounded-sm bg-white/90 dark:bg-slate-900/90 shadow-2xs text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[60%]">
                {certificate.category}
              </span>
              <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded shadow-2xs ${
                isPdf 
                  ? 'bg-rose-500 text-white' 
                  : 'bg-indigo-600 text-white'
              }`}>
                {isPdf ? 'PDF' : 'IMG'}
              </span>
            </div>

            {/* Mini Center/Body: Certificate Typography Simulation */}
            <div className="relative z-10 my-auto text-center px-1">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Award className={`w-3 h-3 ${categoryStyle.text} shrink-0`} />
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                  SERTIFIKAT
                </span>
              </div>
              <p className="text-[9px] font-bold text-slate-800 dark:text-slate-100 truncate max-w-full leading-tight font-serif">
                {certificate.recipientName}
              </p>
            </div>

            {/* Mini Footer: Issuer or Date */}
            <div className="relative z-10 flex items-center justify-between text-[7px] text-slate-500 dark:text-slate-400 font-medium px-0.5">
              <span className="truncate max-w-[70%] font-semibold">{certificate.issuer}</span>
              <span className="font-mono">{certificate.issueDate.split('-')[0]}</span>
            </div>

          </div>
        )}

        {/* Hover Overlay Button */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-1 text-white">
          <div className="w-6 h-6 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white flex items-center justify-center shadow-md transform scale-75 group-hover:scale-100 transition-transform">
            <Eye className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Format Corner Indicator (Always visible for clarity) */}
        <div className="absolute bottom-1 right-1 pointer-events-none">
          <span className={`text-[7px] font-black font-mono px-1 py-0.2 rounded-xs shadow-xs uppercase ${
            isPdf 
              ? 'bg-rose-600 text-white' 
              : 'bg-indigo-600 text-white'
          }`}>
            {isPdf ? 'PDF' : 'IMG'}
          </span>
        </div>

      </div>

      {/* Floating Hover Quick-Preview Card (Appears on Hover in Table View) */}
      {showHoverZoom && isHovered && size === 'table' && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 w-72 pointer-events-none animate-in fade-in zoom-in-95 duration-150 hidden md:block">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-2.5 backdrop-blur-md">
            
            {/* Header with status */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Pratinjau Dokumen
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {certificate.title}
                </p>
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                isPdf ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
              }`}>
                {isPdf ? 'PDF' : 'IMAGE'}
              </span>
            </div>

            {/* Document Preview Card inside tooltip */}
            <div className={`w-full h-28 rounded-xl p-3 flex flex-col justify-between bg-gradient-to-br ${categoryStyle.bg} border ${categoryStyle.border} relative overflow-hidden shadow-inner`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {certificate.category}
                </span>
                <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                  ID: {certificate.credentialId || 'Auto'}
                </span>
              </div>
              
              <div className="text-center my-auto space-y-0.5">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">
                  Diberikan Kepada:
                </p>
                <p className="text-xs font-bold text-slate-900 dark:text-white font-serif">
                  {certificate.recipientName}
                </p>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-600 dark:text-slate-400">
                <span className="truncate max-w-[140px]">{certificate.issuer}</span>
                <span>{certificate.issueDate}</span>
              </div>
            </div>

            {/* Metadata Summary */}
            <div className="text-[10px] space-y-1 text-slate-600 dark:text-slate-400 pt-0.5">
              <div className="flex items-center justify-between">
                <span>File:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                  {certificate.fileName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tersimpan di:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Google Drive
                </span>
              </div>
            </div>

            <div className="text-[9px] text-center text-slate-400 dark:text-slate-500 italic pt-1 border-t border-slate-100 dark:border-slate-800">
              Klik untuk membuka detail lengkap & verifikasi QR
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
