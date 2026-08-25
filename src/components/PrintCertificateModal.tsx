import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, X, Award, ShieldCheck, QrCode, Check, 
  RotateCcw, Sparkles, Building2, Calendar, User, FileText, CheckCircle2
} from 'lucide-react';
import { Certificate } from '../types';

interface PrintCertificateModalProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
}

type PrintTheme = 'gold' | 'navy' | 'emerald' | 'crimson';
type Orientation = 'landscape' | 'portrait';

export const PrintCertificateModal: React.FC<PrintCertificateModalProps> = ({
  certificate,
  isOpen,
  onClose
}) => {
  const [theme, setTheme] = useState<PrintTheme>('gold');
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [showQr, setShowQr] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showSeal, setShowSeal] = useState(true);

  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  // QR Code URL based on the certificate Drive link or ID
  const verifyLink = certificate.webViewLink || `https://drive.google.com/open?id=${certificate.driveFileId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyLink)}&margin=4`;

  // Theme palettes
  const themeStyles = {
    gold: {
      borderOuter: 'border-amber-700/80',
      borderInner: 'border-amber-500/60',
      cornerDecor: 'text-amber-700',
      primaryText: 'text-amber-900',
      accentText: 'text-amber-800',
      ribbonBg: 'bg-amber-600',
      sealBorder: 'border-amber-600',
      sealBg: 'bg-amber-50',
      sealText: 'text-amber-900',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      divider: 'border-amber-300'
    },
    navy: {
      borderOuter: 'border-indigo-900',
      borderInner: 'border-indigo-600/70',
      cornerDecor: 'text-indigo-900',
      primaryText: 'text-indigo-950',
      accentText: 'text-indigo-800',
      ribbonBg: 'bg-indigo-700',
      sealBorder: 'border-indigo-700',
      sealBg: 'bg-indigo-50',
      sealText: 'text-indigo-950',
      badgeBg: 'bg-indigo-100 text-indigo-950 border-indigo-300',
      divider: 'border-indigo-200'
    },
    emerald: {
      borderOuter: 'border-emerald-900',
      borderInner: 'border-emerald-600/70',
      cornerDecor: 'text-emerald-800',
      primaryText: 'text-emerald-950',
      accentText: 'text-emerald-800',
      ribbonBg: 'bg-emerald-700',
      sealBorder: 'border-emerald-700',
      sealBg: 'bg-emerald-50',
      sealText: 'text-emerald-950',
      badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      divider: 'border-emerald-200'
    },
    crimson: {
      borderOuter: 'border-rose-900',
      borderInner: 'border-rose-600/70',
      cornerDecor: 'text-rose-800',
      primaryText: 'text-rose-950',
      accentText: 'text-rose-800',
      ribbonBg: 'bg-rose-700',
      sealBorder: 'border-rose-700',
      sealBg: 'bg-rose-50',
      sealText: 'text-rose-950',
      badgeBg: 'bg-rose-100 text-rose-950 border-rose-300',
      divider: 'border-rose-200'
    }
  }[theme];

  return (
    <>
      {/* 1. ONSCREEN PREVIEW MODAL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            key="modal-print-cert-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 transition-colors no-print"
          >
            <motion.div 
              key="modal-print-cert-card"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              id="modal-print-certificate"
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[94vh]"
            >
              
              {/* Modal Top Controls Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-950 text-indigo-400 flex items-center justify-center border border-indigo-800/80 shadow-xs">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Cetak Versi Dokumen Sertifikat</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Print Ready
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Pratinjau layout cetak A4 beresolusi tinggi dengan bingkai resmi & stempel verifikasi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    id="btn-trigger-print"
                    type="button"
                    onClick={handlePrint}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-900/50 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Sekarang (Print / PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Options Toolbar */}
              <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
                
                {/* Theme Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Tema Warna:</span>
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTheme('gold')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        theme === 'gold' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Emas Klasik
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('navy')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        theme === 'navy' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Royal Navy
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('emerald')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        theme === 'emerald' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Emerald
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('crimson')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        theme === 'crimson' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Crimson
                    </button>
                  </div>
                </div>

                {/* Orientation Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Orientasi:</span>
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        orientation === 'landscape' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Lanskap (A4)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        orientation === 'portrait' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Potret (A4)
                    </button>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none text-[11px]">
                    <input 
                      type="checkbox" 
                      checked={showQr} 
                      onChange={(e) => setShowQr(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span>QR Verifikasi</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none text-[11px]">
                    <input 
                      type="checkbox" 
                      checked={showSignatures} 
                      onChange={(e) => setShowSignatures(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Tanda Tangan</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none text-[11px]">
                    <input 
                      type="checkbox" 
                      checked={showSeal} 
                      onChange={(e) => setShowSeal(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Stempel Segel</span>
                  </label>
                </div>

              </div>

              {/* Certificate Scrollable Canvas Container */}
              <div className="p-6 overflow-y-auto flex items-center justify-center bg-slate-950/60 min-h-[460px]">
                <div className="transform scale-90 sm:scale-95 md:scale-100 transition-transform origin-top">
                  
                  {/* The Document Sheet */}
                  <div 
                    className={`bg-white text-slate-900 shadow-2xl p-8 sm:p-12 relative overflow-hidden transition-all select-none border border-slate-300 ${
                      orientation === 'landscape' 
                        ? 'w-[780px] min-h-[550px]' 
                        : 'w-[580px] min-h-[780px]'
                    }`}
                    style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
                  >
                    
                    {/* Background Certificate Watermark Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                      <Award className="w-[450px] h-[450px]" />
                    </div>

                    {/* Outer Border with Inner Double Line */}
                    <div className={`absolute inset-4 border-4 border-double ${themeStyles.borderOuter} pointer-events-none`} />
                    <div className={`absolute inset-6 border ${themeStyles.borderInner} pointer-events-none`} />

                    {/* Corner Ornaments */}
                    <div className={`absolute top-7 left-7 text-lg font-serif font-black ${themeStyles.cornerDecor} pointer-events-none`}>
                      ❖
                    </div>
                    <div className={`absolute top-7 right-7 text-lg font-serif font-black ${themeStyles.cornerDecor} pointer-events-none`}>
                      ❖
                    </div>
                    <div className={`absolute bottom-7 left-7 text-lg font-serif font-black ${themeStyles.cornerDecor} pointer-events-none`}>
                      ❖
                    </div>
                    <div className={`absolute bottom-7 right-7 text-lg font-serif font-black ${themeStyles.cornerDecor} pointer-events-none`}>
                      ❖
                    </div>

                    {/* Certificate Content Header */}
                    <div className="text-center relative z-10 space-y-2 pt-2">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Award className={`w-8 h-8 ${themeStyles.primaryText}`} />
                      </div>
                      
                      <h1 className={`text-2xl sm:text-3xl font-bold tracking-widest uppercase ${themeStyles.primaryText}`}>
                        SERTIFIKAT {certificate.category.toUpperCase()}
                      </h1>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-sans font-semibold">
                        Certificate of {certificate.category} & Achievement
                      </p>

                      <div className={`w-32 h-0.5 mx-auto my-3 ${themeStyles.ribbonBg}`} />
                    </div>

                    {/* Recipient Statement */}
                    <div className="text-center relative z-10 my-6 space-y-3">
                      <p className="text-xs italic text-slate-600">
                        Dengan bangga sertifikat ini diberikan sebagai tanda bukti kepada:
                      </p>

                      <div className="py-2">
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-slate-900 border-b-2 border-slate-300 pb-1.5 inline-block min-w-[340px] max-w-full">
                          {certificate.recipientName}
                        </h2>
                        {certificate.recipientEmail && (
                          <p className="text-[11px] font-sans text-slate-500 mt-1">
                            {certificate.recipientEmail}
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
                        Atas kelulusan dan partisipasi aktif dalam:
                      </p>

                      <h3 className={`text-base sm:text-lg font-bold ${themeStyles.accentText} max-w-lg mx-auto font-sans`}>
                        "{certificate.title}"
                      </h3>

                      {certificate.description && (
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto italic">
                          {certificate.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Details: Date, Verification QR, Signatures */}
                    <div className="relative z-10 mt-8 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 items-end">
                      
                      {/* Left: Institution & Date */}
                      <div className="space-y-1 text-left text-xs font-sans">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Lembaga Penyelenggara</p>
                        <p className="font-bold text-slate-800">{certificate.issuer}</p>
                        <p className="text-[11px] text-slate-500">
                          Tanggal Terbit: <span className="font-semibold text-slate-700">{certificate.issueDate}</span>
                        </p>
                        {certificate.expiryDate && (
                          <p className="text-[10px] text-slate-500">
                            Berlaku Hingga: <span className="font-semibold text-slate-700">{certificate.expiryDate}</span>
                          </p>
                        )}
                      </div>

                      {/* Center: Official Seal / Stamp & QR */}
                      <div className="flex flex-col items-center justify-center text-center">
                        {showQr && (
                          <div className="p-1.5 bg-white border border-slate-300 rounded-lg shadow-xs inline-block mb-1">
                            <img 
                              src={qrCodeUrl} 
                              alt="Verification QR" 
                              className="w-16 h-16 object-contain"
                              crossOrigin="anonymous"
                            />
                          </div>
                        )}
                        
                        {showSeal && (
                          <div className={`mt-1 px-2.5 py-0.5 rounded-full border ${themeStyles.sealBorder} ${themeStyles.sealBg} ${themeStyles.sealText} text-[9px] font-sans font-extrabold tracking-wider flex items-center gap-1 shadow-2xs`}>
                            <ShieldCheck className="w-3 h-3" />
                            <span>VERIFIED CREDENTIAL</span>
                          </div>
                        )}

                        <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                          ID: {certificate.credentialId || 'CERT-AUTOGEN'}
                        </span>
                      </div>

                      {/* Right: Signature Block */}
                      <div className="text-right space-y-1 text-xs font-sans">
                        {showSignatures && (
                          <div className="inline-block text-center min-w-[140px]">
                            <div className="h-10 flex items-end justify-center mb-1">
                              <span className="font-serif italic text-base text-slate-800 tracking-wider">
                                {certificate.issuer.split(' ')[0]} Sign.
                              </span>
                            </div>
                            <div className="w-full border-b border-slate-400 mb-1" />
                            <p className="font-bold text-slate-800 text-[11px]">Pimpinan Lembaga</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider">{certificate.issuer}</p>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Bottom Micro Verification Text */}
                    <div className="absolute bottom-2 left-0 right-0 text-center text-[8px] font-sans text-slate-400 pointer-events-none">
                      Tervalidasi secara digital melalui Google Drive Cloud Repository • Dokumen Asli Sah
                    </div>

                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Tip: Anda juga dapat memilih 'Save as PDF' pada dialog cetak browser Anda.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-900/50 flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Sekarang</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. PURE PRINT ROOT (VISIBLE ONLY DURING WINDOW.PRINT()) */}
      <div 
        id="printable-certificate-root" 
        className="print-only hidden"
        style={{
          fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div 
          className={`w-full h-full bg-white text-slate-900 p-12 relative flex flex-col justify-between`}
          style={{ minHeight: '100vh', pageBreakInside: 'avoid' }}
        >
          {/* Border Decoration for print */}
          <div 
            className={`absolute inset-4 border-4 border-double ${themeStyles.borderOuter}`}
            style={{ pointerEvents: 'none' }}
          />
          <div 
            className={`absolute inset-6 border ${themeStyles.borderInner}`}
            style={{ pointerEvents: 'none' }}
          />

          {/* Corner Marks */}
          <div className={`absolute top-7 left-7 text-lg font-serif font-black ${themeStyles.cornerDecor}`}>❖</div>
          <div className={`absolute top-7 right-7 text-lg font-serif font-black ${themeStyles.cornerDecor}`}>❖</div>
          <div className={`absolute bottom-7 left-7 text-lg font-serif font-black ${themeStyles.cornerDecor}`}>❖</div>
          <div className={`absolute bottom-7 right-7 text-lg font-serif font-black ${themeStyles.cornerDecor}`}>❖</div>

          {/* Header */}
          <div className="text-center pt-4">
            <h1 className={`text-3xl font-bold tracking-widest uppercase ${themeStyles.primaryText}`}>
              SERTIFIKAT {certificate.category.toUpperCase()}
            </h1>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-sans font-semibold mt-1">
              Certificate of {certificate.category} & Achievement
            </p>
            <div className={`w-36 h-0.5 mx-auto my-3 ${themeStyles.ribbonBg}`} />
          </div>

          {/* Body */}
          <div className="text-center my-6 space-y-4">
            <p className="text-sm italic text-slate-600">
              Dengan bangga sertifikat ini diberikan sebagai tanda bukti kepada:
            </p>

            <div>
              <h2 className="text-4xl font-extrabold tracking-wide text-slate-900 border-b-2 border-slate-300 pb-2 inline-block min-w-[380px]">
                {certificate.recipientName}
              </h2>
              {certificate.recipientEmail && (
                <p className="text-xs font-sans text-slate-500 mt-1">
                  {certificate.recipientEmail}
                </p>
              )}
            </div>

            <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed pt-2">
              Atas kelulusan dan partisipasi aktif dalam:
            </p>

            <h3 className={`text-xl font-bold ${themeStyles.accentText} max-w-xl mx-auto font-sans`}>
              "{certificate.title}"
            </h3>

            {certificate.description && (
              <p className="text-xs text-slate-600 max-w-lg mx-auto italic">
                {certificate.description}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-300 grid grid-cols-3 gap-6 items-end pb-4">
            
            {/* Left */}
            <div className="space-y-1 text-left text-xs font-sans">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Lembaga Penyelenggara</p>
              <p className="font-bold text-slate-800 text-sm">{certificate.issuer}</p>
              <p className="text-xs text-slate-600">
                Tanggal Terbit: <span className="font-semibold text-slate-800">{certificate.issueDate}</span>
              </p>
              {certificate.expiryDate && (
                <p className="text-xs text-slate-600">
                  Berlaku Hingga: <span className="font-semibold text-slate-800">{certificate.expiryDate}</span>
                </p>
              )}
            </div>

            {/* Center */}
            <div className="flex flex-col items-center justify-center text-center">
              {showQr && (
                <div className="p-1.5 bg-white border border-slate-300 rounded-lg shadow-xs inline-block mb-1">
                  <img 
                    src={qrCodeUrl} 
                    alt="Verification QR" 
                    className="w-20 h-20 object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              
              {showSeal && (
                <div className={`mt-1 px-3 py-1 rounded-full border ${themeStyles.sealBorder} ${themeStyles.sealBg} ${themeStyles.sealText} text-[10px] font-sans font-extrabold tracking-wider`}>
                  VERIFIED CREDENTIAL
                </div>
              )}

              <span className="text-[10px] font-mono text-slate-600 mt-1">
                ID: {certificate.credentialId || 'CERT-AUTOGEN'}
              </span>
            </div>

            {/* Right */}
            <div className="text-right space-y-1 text-xs font-sans">
              {showSignatures && (
                <div className="inline-block text-center min-w-[160px]">
                  <div className="h-12 flex items-end justify-center mb-1">
                    <span className="font-serif italic text-lg text-slate-800 tracking-wider">
                      {certificate.issuer.split(' ')[0]} Sign.
                    </span>
                  </div>
                  <div className="w-full border-b border-slate-400 mb-1" />
                  <p className="font-bold text-slate-800 text-xs">Pimpinan Lembaga</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{certificate.issuer}</p>
                </div>
              )}
            </div>

          </div>

          <div className="text-center text-[9px] font-sans text-slate-400 pb-2">
            Tervalidasi secara digital melalui Google Drive Cloud Repository • Dokumen Asli Sah
          </div>

        </div>
      </div>
    </>
  );
};
