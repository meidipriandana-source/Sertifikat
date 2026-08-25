import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Award,
  ShieldCheck,
  Calendar,
  User,
  SlidersHorizontal,
  RefreshCw,
  QrCode,
  FileText,
  Eye,
  Info,
  Layers,
  Sparkles,
  Printer
} from 'lucide-react';
import { Certificate } from '../types';
import { parseGoogleDriveLink } from '../utils/drive';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate | null;
  certificates?: Certificate[];
  onSelectCertificate?: (cert: Certificate) => void;
  onOpenDetail?: (cert: Certificate) => void;
  onOpenPrint?: (cert: Certificate) => void;
}

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; badge: string; ring: string }> = {
  Prestasi: {
    bg: 'from-amber-600/20 via-amber-500/10 to-amber-700/20',
    border: 'border-amber-400/60 dark:border-amber-500/50',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500 text-white',
    ring: 'ring-amber-400/40'
  },
  Pelatihan: {
    bg: 'from-indigo-600/20 via-indigo-500/10 to-indigo-700/20',
    border: 'border-indigo-400/60 dark:border-indigo-500/50',
    text: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-600 text-white',
    ring: 'ring-indigo-400/40'
  },
  Workshop: {
    bg: 'from-emerald-600/20 via-emerald-500/10 to-emerald-700/20',
    border: 'border-emerald-400/60 dark:border-emerald-500/50',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-600 text-white',
    ring: 'ring-emerald-400/40'
  },
  Akademik: {
    bg: 'from-blue-600/20 via-blue-500/10 to-blue-700/20',
    border: 'border-blue-400/60 dark:border-blue-500/50',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-600 text-white',
    ring: 'ring-blue-400/40'
  },
  Penghargaan: {
    bg: 'from-purple-600/20 via-purple-500/10 to-purple-700/20',
    border: 'border-purple-400/60 dark:border-purple-500/50',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-600 text-white',
    ring: 'ring-purple-400/40'
  },
  Kelulusan: {
    bg: 'from-teal-600/20 via-teal-500/10 to-teal-700/20',
    border: 'border-teal-400/60 dark:border-teal-500/50',
    text: 'text-teal-600 dark:text-teal-400',
    badge: 'bg-teal-600 text-white',
    ring: 'ring-teal-400/40'
  },
  Lainnya: {
    bg: 'from-slate-600/20 via-slate-500/10 to-slate-700/20',
    border: 'border-slate-400/60 dark:border-slate-500/50',
    text: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-700 text-white',
    ring: 'ring-slate-400/40'
  }
};

type FilterMode = 'normal' | 'contrast' | 'invert' | 'grayscale';

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen = true,
  onClose,
  certificate,
  certificates = [],
  onSelectCertificate,
  onOpenDetail,
  onOpenPrint
}) => {
  // Transform & Zoom states
  const [scale, setScale] = useState<number>(1.0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [filterMode, setFilterMode] = useState<FilterMode>('normal');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showMetadataPanel, setShowMetadataPanel] = useState<boolean>(false);

  // Image load states
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [urlIndex, setUrlIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Current index in certificates list
  const currentIndex = certificates.findIndex(c => c.id === certificate?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < certificates.length - 1;

  // Derive Google Drive details and image candidate URLs
  const driveInfo = certificate ? parseGoogleDriveLink(certificate.webViewLink || certificate.driveFileId || '') : null;
  const driveId = driveInfo?.driveId || '';
  const isPdf = certificate?.mimeType === 'application/pdf';

  const candidateUrls: string[] = [];
  if (certificate?.thumbnailLink) {
    candidateUrls.push(certificate.thumbnailLink.replace(/=s\d+/, '=s1600').replace(/=w\d+/, '=w1600'));
    candidateUrls.push(certificate.thumbnailLink);
  }
  if (driveId && driveInfo?.isRealDrive) {
    candidateUrls.push(`https://lh3.googleusercontent.com/d/${driveId}=w1600`);
    candidateUrls.push(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`);
    candidateUrls.push(`https://lh3.googleusercontent.com/d/${driveId}=w800`);
    candidateUrls.push(`https://drive.google.com/thumbnail?id=${driveId}&sz=w800`);
    candidateUrls.push(`https://drive.google.com/uc?export=view&id=${driveId}`);
  }

  const currentImageUrl = candidateUrls[urlIndex] || null;

  // Reset transforms whenever certificate changes or modal opens
  useEffect(() => {
    if (isOpen && certificate) {
      setScale(1.0);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setFilterMode('normal');
      setImageLoaded(false);
      setImageError(false);
      setUrlIndex(0);
    }
  }, [certificate?.id, isOpen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleNextCertificate = useCallback(() => {
    if (hasNext && onSelectCertificate) {
      onSelectCertificate(certificates[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, certificates, onSelectCertificate]);

  const handlePrevCertificate = useCallback(() => {
    if (hasPrev && onSelectCertificate) {
      onSelectCertificate(certificates[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, certificates, onSelectCertificate]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(4.0, Number((prev + 0.25).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const next = Math.max(0.5, Number((prev - 0.25).toFixed(2)));
      if (next <= 1.0) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  const handleRotateClockwise = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleRotateCounterClockwise = useCallback(() => {
    setRotation(prev => (prev - 90 + 360) % 360);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  const handleCycleFilter = () => {
    const modes: FilterMode[] = ['normal', 'contrast', 'invert', 'grayscale'];
    const nextIdx = (modes.indexOf(filterMode) + 1) % modes.length;
    setFilterMode(modes[nextIdx]);
  };

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextCertificate();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevCertificate();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
        case 'r':
        case 'R':
          e.preventDefault();
          handleResetZoom();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          setShowMetadataPanel(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNextCertificate, handlePrevCertificate, handleZoomIn, handleZoomOut, handleResetZoom]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Pan / Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1 || rotation !== 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale === 1.0) {
      setScale(2.0);
    } else {
      handleResetZoom();
    }
  };

  const handleImageError = () => {
    if (urlIndex < candidateUrls.length - 1) {
      setUrlIndex(prev => prev + 1);
    } else {
      setImageError(true);
    }
  };

  if (!certificate) return null;

  const catStyle = CATEGORY_STYLES[certificate.category] || CATEGORY_STYLES.Lainnya;

  // Compute CSS filter string
  const filterStyles: Record<FilterMode, string> = {
    normal: 'none',
    contrast: 'contrast(160%) brightness(105%)',
    invert: 'invert(100%) hue-rotate(180deg)',
    grayscale: 'grayscale(100%) contrast(120%)'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-image-lightbox-backdrop"
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-md text-white select-none overflow-hidden"
          onMouseUp={handleMouseUp}
        >
          {/* Top Bar Header */}
          <div className="relative z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 shrink-0">
            {/* Title & Info */}
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-md ${catStyle.badge}`}>
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md md:max-w-lg">
                    {certificate.title}
                  </h3>
                  <span className={`hidden sm:inline-flex text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${catStyle.badge}`}>
                    {certificate.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate flex items-center gap-2 mt-0.5">
                  <span className="font-medium text-slate-300">{certificate.recipientName}</span>
                  <span>•</span>
                  <span>{certificate.issuer}</span>
                  {certificate.issueDate && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{certificate.issueDate}</span>
                    </>
                  )}
                  {certificates.length > 1 && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-400 font-semibold font-mono">
                        ({currentIndex + 1}/{certificates.length})
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Toggle Metadata Info Panel */}
              <button
                type="button"
                onClick={() => setShowMetadataPanel(prev => !prev)}
                className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  showMetadataPanel
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Informasi Dokumen (I)"
                aria-label="Toggle informasi dokumen"
              >
                <Info className="w-4 h-4" />
                <span className="hidden md:inline">Detail</span>
              </button>

              {/* Open in Detail Modal */}
              {onOpenDetail && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDetail(certificate);
                  }}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Buka Form Edit & Detail Lengkap"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden md:inline">Kelola</span>
                </button>
              )}

              {/* Print Certificate Button */}
              {onOpenPrint && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPrint(certificate);
                  }}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Cetak Dokumen Sertifikat"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden md:inline">Cetak</span>
                </button>
              )}

              {/* External Google Drive Link */}
              {certificate.webViewLink && (
                <a
                  href={certificate.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                  title="Buka di Google Drive"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden lg:inline">Google Drive</span>
                </a>
              )}

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title={isFullscreen ? 'Keluar Fullscreen (F)' : 'Layar Penuh (F)'}
                aria-label="Toggle layar penuh"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 border border-rose-500 text-white transition-all cursor-pointer shadow-lg ml-1"
                title="Tutup Lightbox (Esc)"
                aria-label="Tutup pratinjau"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Main Workspace Area (Viewport + Navigation) */}
          <div className="relative flex-1 w-full h-full flex overflow-hidden">
            {/* Previous Navigation Button */}
            {hasPrev && (
              <button
                type="button"
                onClick={handlePrevCertificate}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-indigo-600 border border-slate-700/80 hover:border-indigo-500 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all hover:scale-110 cursor-pointer group"
                title="Sertifikat Sebelumnya (Panah Kiri)"
                aria-label="Sertifikat sebelumnya"
              >
                <ChevronLeft className="w-6 h-6 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Next Navigation Button */}
            {hasNext && (
              <button
                type="button"
                onClick={handleNextCertificate}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-indigo-600 border border-slate-700/80 hover:border-indigo-500 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all hover:scale-110 cursor-pointer group"
                title="Sertifikat Berikutnya (Panah Kanan)"
                aria-label="Sertifikat berikutnya"
              >
                <ChevronRight className="w-6 h-6 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Zoomable Image / Document Viewport */}
            <div
              ref={viewportRef}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onDoubleClick={handleDoubleClick}
              className={`flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden touch-none ${
                scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
              }`}
            >
              <div
                style={{
                  transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale}) rotate(${rotation}deg)`,
                  filter: filterStyles[filterMode],
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out, filter 0.2s ease',
                  transformOrigin: 'center center'
                }}
                className="relative max-w-full max-h-full flex items-center justify-center pointer-events-auto"
              >
                {/* 1. Real Image Render (when URL exists and is valid) */}
                {currentImageUrl && !imageError ? (
                  <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900 flex items-center justify-center">
                    <img
                      src={currentImageUrl}
                      alt={certificate.title}
                      referrerPolicy="no-referrer"
                      onLoad={() => setImageLoaded(true)}
                      onError={handleImageError}
                      draggable={false}
                      className={`max-w-[90vw] max-h-[75vh] object-contain select-none transition-opacity duration-200 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    {!imageLoaded && (
                      <div className="w-80 h-56 sm:w-96 sm:h-64 flex flex-col items-center justify-center gap-3 bg-slate-900 text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                        <span className="text-xs font-semibold">Memuat Resolusi Tinggi...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 2. High-Definition Vector Certificate Document Card Canvas */
                  <div className="w-[820px] max-w-[92vw] aspect-[1.414/1] rounded-2xl bg-gradient-to-br from-amber-50/95 via-white to-amber-50/90 text-slate-900 shadow-2xl border-8 border-double border-amber-600/40 p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden select-none">
                    {/* Ornate Background Geometry & Watermark */}
                    <div className="absolute inset-2 border-2 border-amber-500/30 rounded-xl pointer-events-none" />
                    <div className="absolute inset-4 border border-dashed border-amber-400/40 rounded-lg pointer-events-none" />
                    <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                      <Award className="w-96 h-96 text-amber-900 transform -rotate-12" />
                    </div>

                    {/* Certificate Header */}
                    <div className="relative z-10 text-center space-y-1">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Award className={`w-7 h-7 ${catStyle.text}`} />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-600">
                          SERTIFIKAT RESMI • {certificate.category.toUpperCase()}
                        </span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-900 font-serif">
                        SERTIFIKAT PENGHARGAAN
                      </h1>
                      <p className="text-xs text-slate-500 font-medium">
                        Nomor Registrasi Kredensial: <span className="font-mono font-bold text-slate-700">{certificate.credentialId || 'ID-AUTO-VERIFIED'}</span>
                      </p>
                    </div>

                    {/* Certificate Body */}
                    <div className="relative z-10 text-center my-4 space-y-2">
                      <p className="text-xs sm:text-sm text-slate-600 uppercase tracking-widest font-semibold">
                        Diberikan dengan bangga kepada:
                      </p>
                      <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-serif tracking-tight border-b-2 border-amber-400/50 pb-2 inline-block max-w-full px-6">
                        {certificate.recipientName}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed pt-1">
                        Atas pencapaian dan partisipasi aktif dalam:
                        <br />
                        <span className="font-bold text-slate-900 text-sm sm:text-base">{certificate.title}</span>
                      </p>
                      {certificate.description && (
                        <p className="text-xs text-slate-500 italic max-w-lg mx-auto line-clamp-2">
                          "{certificate.description}"
                        </p>
                      )}
                    </div>

                    {/* Certificate Footer & Signatures */}
                    <div className="relative z-10 pt-4 border-t border-slate-200/80 flex items-end justify-between text-xs text-slate-700">
                      {/* Left: Date & Verification QR */}
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-white p-1.5 rounded-lg border border-slate-300 shadow-xs flex flex-col items-center justify-center">
                          <QrCode className="w-9 h-9 text-slate-800" />
                          <span className="text-[7px] font-mono font-bold text-slate-500 mt-0.5">VERIFIED</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-semibold">Tanggal Terbit:</p>
                          <p className="font-bold text-slate-800 font-mono">{certificate.issueDate}</p>
                          {certificate.expiryDate && (
                            <p className="text-[10px] text-amber-700 font-medium">
                              Berlaku s/d: <span className="font-mono">{certificate.expiryDate}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Center: Official Seal Crest */}
                      <div className="hidden sm:flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-amber-950 flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-amber-400">
                          <ShieldCheck className="w-8 h-8 stroke-[2]" />
                        </div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-800 mt-1">
                          TERVERIFIKASI
                        </span>
                      </div>

                      {/* Right: Issuer Signatory */}
                      <div className="text-right">
                        <div className="h-9 flex items-center justify-end">
                          <span className="font-serif italic text-base text-indigo-900 tracking-wider font-bold">
                            {certificate.issuer}
                          </span>
                        </div>
                        <div className="w-36 border-t border-slate-400 pt-1">
                          <p className="font-bold text-slate-900 truncate">{certificate.issuer}</p>
                          <p className="text-[10px] text-slate-500">Penerbit Resmi</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Collapsible Metadata Sidebar */}
            <AnimatePresence>
              {showMetadataPanel && (
                <motion.div
                  key="lightbox-metadata-sidebar"
                  initial={{ x: 320, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 320, opacity: 0 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                  className="w-80 bg-slate-900/95 border-l border-slate-800 p-5 space-y-4 overflow-y-auto shrink-0 z-40 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      Detail Dokumen
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowMetadataPanel(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Judul Sertifikat</span>
                      <p className="text-white font-semibold">{certificate.title}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Penerima</span>
                      <p className="text-white font-semibold flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        {certificate.recipientName}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Instansi / Penerbit</span>
                      <p className="text-white font-semibold">{certificate.issuer}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Kategori</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${catStyle.badge}`}>
                        {certificate.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Tanggal Terbit</span>
                        <p className="text-slate-200 font-mono">{certificate.issueDate}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Masa Berlaku</span>
                        <p className="text-slate-200 font-mono">
                          {certificate.expiryDate || 'Seumur Hidup'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Nama File &amp; Format</span>
                      <p className="text-slate-200 truncate font-mono text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800">
                        {certificate.fileName} ({certificate.mimeType})
                      </p>
                    </div>

                    {certificate.credentialId && (
                      <div>
                        <span className="text-slate-400 block mb-0.5">ID Kredensial</span>
                        <p className="font-mono text-indigo-300 text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800 break-all">
                          {certificate.credentialId}
                        </p>
                      </div>
                    )}

                    {certificate.tags && certificate.tags.length > 0 && (
                      <div>
                        <span className="text-slate-400 block mb-1">Tags / Kata Kunci</span>
                        <div className="flex flex-wrap gap-1">
                          {certificate.tags.map((t, idx) => (
                            <span key={`lightbox-tag-${idx}`} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    {onOpenDetail && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDetail(certificate);
                        }}
                        className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        Buka Form Edit
                      </button>
                    )}
                    {onOpenPrint && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenPrint(certificate);
                        }}
                        className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Printer className="w-4 h-4" />
                        Cetak Sertifikat
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Floating Control Dock */}
          <div className="relative z-30 px-4 py-3 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-center shrink-0">
            <div className="flex items-center gap-1 sm:gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-2xl flex-wrap justify-center">
              {/* Zoom Out Button */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="Perkecil Zoom (-)"
                aria-label="Perkecil zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Current Zoom Indicator */}
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer"
                title="Reset Zoom ke 100% (0 / R)"
              >
                {Math.round(scale * 100)}%
              </button>

              {/* Zoom In Button */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 4.0}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="Perbesar Zoom (+)"
                aria-label="Perbesar zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-800 mx-1 hidden sm:block" />

              {/* Rotate Counter-Clockwise */}
              <button
                type="button"
                onClick={handleRotateCounterClockwise}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Putar 90° Berlawanan Jarum Jam"
                aria-label="Putar kiri"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Rotate Clockwise */}
              <button
                type="button"
                onClick={handleRotateClockwise}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Putar 90° Searah Jarum Jam"
                aria-label="Putar kanan"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-800 mx-1 hidden sm:block" />

              {/* Filter / High Contrast Mode */}
              <button
                type="button"
                onClick={handleCycleFilter}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-medium ${
                  filterMode !== 'normal'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title={`Filter Kontras: ${filterMode.toUpperCase()} (Klik untuk ganti mode)`}
                aria-label="Ganti mode kontras"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden md:inline capitalize">{filterMode}</span>
              </button>

              {/* Fit / Reset View */}
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer text-xs font-semibold flex items-center gap-1"
                title="Reset Posisi &amp; Skala"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
