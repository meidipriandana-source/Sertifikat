import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  Clock, Sparkles, ChevronLeft, ChevronRight, Users, Award, 
  Eye, ExternalLink, ArrowRight, FileText, Image as ImageIcon,
  CheckCircle2, AlertTriangle, ShieldCheck, Plus, Calendar
} from 'lucide-react';
import { Certificate, CategoryItem } from '../types';
import { getCategoryTheme, getCategoryIcon } from '../utils/categoryColors';
import { getExpiryDetails } from '../utils/expiry';
import { CertificateThumbnail } from './CertificateThumbnail';

interface RecentlyUploadedWidgetProps {
  certificates: Certificate[];
  categoriesList?: CategoryItem[];
  onSelectCertificate: (certificate: Certificate) => void;
  onOpenLightbox?: (certificate: Certificate) => void;
  onOpenUpload?: () => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getRelativeTimeString(dateStr?: string): string {
  if (!dateStr) return 'Baru ditambahkan';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Future date or invalid
    if (isNaN(diffMs) || diffMs < 0) {
      return 'Baru saja';
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 2) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  } catch {
    return 'Baru saja';
  }
}

export const RecentlyUploadedWidget: React.FC<RecentlyUploadedWidgetProps> = ({
  certificates = [],
  categoriesList = [],
  onSelectCertificate,
  onOpenLightbox,
  onOpenUpload
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Extract and sort the last 5 uploaded certificates based on createdAt or fallback
  const recentCertificates = useMemo(() => {
    if (!Array.isArray(certificates) || certificates.length === 0) return [];
    
    return [...certificates]
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        // Fallback to issueDate or reverse array order
        const issueA = a.issueDate ? new Date(a.issueDate).getTime() : 0;
        const issueB = b.issueDate ? new Date(b.issueDate).getTime() : 0;
        return issueB - issueA;
      })
      .slice(0, 5);
  }, [certificates]);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons, { passive: true });
      window.addEventListener('resize', updateScrollButtons);
      return () => {
        el.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, [recentCertificates]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (recentCertificates.length === 0) {
    return null;
  }

  return (
    <section 
      id="widget-recently-uploaded"
      aria-label="Sertifikat Baru Diunggah"
      className="bg-white dark:bg-[#071f29] rounded-2xl border border-slate-200/90 dark:border-[#103a4b] p-4 sm:p-5 shadow-xs transition-colors relative overflow-hidden"
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200/80 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 shadow-2xs">
            <Clock className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                Baru Diunggah
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100/80 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-700/60">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                <span>{recentCertificates.length} Terakhir</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-teal-200/60 hidden sm:block truncate">
              Akses instan ke arsip dan kredensial terbaru yang masuk ke sistem
            </p>
          </div>
        </div>

        {/* Action Controls: Left/Right Arrow Navigation */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            id="btn-recent-scroll-left"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
              canScrollLeft
                ? 'bg-slate-100 dark:bg-[#0b2835] border-slate-200 dark:border-[#134356] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#0f3749] shadow-2xs active:scale-95'
                : 'bg-slate-50 dark:bg-[#061820] border-slate-100 dark:border-[#0e2c38] text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
            }`}
            aria-label="Gulir ke kiri"
            title="Gulir arsip sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            id="btn-recent-scroll-right"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
              canScrollRight
                ? 'bg-slate-100 dark:bg-[#0b2835] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#0f3749] shadow-2xs active:scale-95'
                : 'bg-slate-50 dark:bg-[#061820] border-slate-100 dark:border-[#0e2c38] text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
            }`}
            aria-label="Gulir ke kanan"
            title="Gulir arsip berikutnya"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Strip Container */}
      <div 
        ref={scrollContainerRef}
        id="recent-certificates-strip"
        className="flex items-stretch gap-3.5 overflow-x-auto no-scrollbar pb-1.5 pt-0.5 px-0.5 scroll-smooth snap-x snap-mandatory focus:outline-none"
        tabIndex={0}
      >
        {recentCertificates.map((cert, index) => {
          const catTheme = getCategoryTheme(cert.category, categoriesList);
          const matchedCategoryItem = categoriesList.find(c => c.name.toLowerCase() === cert.category?.toLowerCase());
          const IconComp = matchedCategoryItem ? getCategoryIcon(matchedCategoryItem.icon) : Award;
          const expiryInfo = getExpiryDetails(cert.expiryDate);
          const relTime = getRelativeTimeString(cert.createdAt);
          const isPdf = cert.mimeType === 'application/pdf';

          return (
            <div
              key={`recent-cert-${cert.id}-${index}`}
              id={`recent-card-${cert.id}`}
              onClick={() => onSelectCertificate(cert)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectCertificate(cert);
                }
              }}
              className="w-[285px] sm:w-[325px] shrink-0 snap-start rounded-2xl bg-slate-50/70 dark:bg-[#092531] border border-slate-200/90 dark:border-[#123e4f] p-3.5 hover:border-teal-400 dark:hover:border-teal-400/80 hover:bg-white dark:hover:bg-[#0c2f3e] shadow-2xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between gap-3 cursor-pointer select-none text-left relative overflow-hidden"
            >
              {/* Card Top Metadata: Category Pill & Upload Recency Badge */}
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${catTheme.bg} ${catTheme.text} ${catTheme.border}`}>
                  <IconComp className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[110px]">{cert.category || 'Umum'}</span>
                </span>

                <span 
                  className="flex items-center gap-1 text-[10.5px] font-semibold text-slate-500 dark:text-teal-200/70 shrink-0"
                  title={`Dibuat: ${cert.createdAt ? new Date(cert.createdAt).toLocaleString('id-ID') : 'Baru'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 animate-pulse" />
                  <span>{relTime}</span>
                </span>
              </div>

              {/* Card Body: Thumbnail & Core Details */}
              <div className="flex items-start gap-3 min-w-0">
                {/* Visual Thumbnail Box */}
                <div 
                  className="w-14 h-18 sm:w-16 sm:h-20 shrink-0 rounded-xl overflow-hidden shadow-2xs border border-slate-200 dark:border-[#154659] bg-white dark:bg-[#051820] group-hover:ring-2 group-hover:ring-teal-400/40 transition-all relative"
                  onClick={(e) => {
                    if (onOpenLightbox) {
                      e.stopPropagation();
                      onOpenLightbox(cert);
                    }
                  }}
                  title="Klik untuk melihat pratinjau penuh"
                >
                  <CertificateThumbnail
                    certificate={cert}
                    size="table"
                    showHoverZoom={false}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                    <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                  </div>
                </div>

                {/* Text Metadata Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 
                    className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-teal-400 dark:group-hover:text-teal-300 transition-colors"
                    title={cert.title}
                  >
                    {cert.title}
                  </h4>

                  {/* Recipient */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-semibold truncate pt-0.5">
                    <Users className="w-3 h-3 text-teal-400 shrink-0" />
                    <span className="truncate">{cert.recipientName}</span>
                  </div>

                  {/* Issuer */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <Award className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{cert.issuer}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Expiry Status / File Details & Quick Actions */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-[#123e4f] flex items-center justify-between gap-2 text-xs">
                
                {/* Expiry Pill or File Spec */}
                <div className="min-w-0">
                  {expiryInfo.status === 'expiring_soon' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      <span>{expiryInfo.badgeSubtext || 'Segera Kadaluarsa'}</span>
                    </span>
                  ) : expiryInfo.status === 'expired' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/60 truncate">
                      <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                      <span>{expiryInfo.badgeLabel}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10.5px] text-slate-500 dark:text-slate-400 font-mono">
                      <span className={`px-1 py-0.2 rounded text-[8px] font-black uppercase text-white ${isPdf ? 'bg-rose-500' : 'bg-teal-500'}`}>
                        {isPdf ? 'PDF' : 'IMG'}
                      </span>
                      <span>{formatBytes(cert.fileSize)}</span>
                    </span>
                  )}
                </div>

                {/* Quick Action Interactive Buttons */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {onOpenLightbox && (
                    <button
                      type="button"
                      onClick={() => onOpenLightbox(cert)}
                      className="p-1.5 text-slate-400 hover:text-teal-400 dark:hover:text-teal-300 rounded-lg hover:bg-slate-200/80 dark:hover:bg-[#0e3546] transition-colors cursor-pointer"
                      title="Pratinjau cepat"
                      aria-label={`Pratinjau ${cert.title}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {cert.webViewLink && (
                    <a
                      href={cert.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-200/80 dark:hover:bg-[#0e3546] transition-colors cursor-pointer"
                      title="Buka berkas di Google Drive"
                      aria-label="Buka di Google Drive"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectCertificate(cert)}
                    className="px-2 py-1 bg-white dark:bg-[#0b2b39] text-slate-700 dark:text-slate-200 hover:text-teal-400 dark:hover:text-teal-300 border border-slate-200 dark:border-[#164a5c] rounded-lg text-[10.5px] font-bold flex items-center gap-1 shadow-2xs hover:border-teal-400/50 transition-colors cursor-pointer"
                    title="Buka rincian sertifikat"
                  >
                    <span>Rincian</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

              </div>

            </div>
          );
        })}

        {/* Optional trailing card: Upload CTA */}
        {onOpenUpload && (
          <div
            id="recent-card-upload-cta"
            onClick={onOpenUpload}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenUpload();
              }
            }}
            className="w-[180px] shrink-0 snap-start rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#134356] hover:border-teal-400 dark:hover:border-teal-400/80 bg-slate-50/50 dark:bg-[#071f29]/50 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all duration-200 group select-none"
            title="Tambah atau unggah sertifikat baru"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 border border-teal-200/80 dark:border-teal-700/80 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-300">
                Unggah Lagi
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                PDF atau Gambar
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
