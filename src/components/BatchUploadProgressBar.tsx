import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, HardDrive, CheckCircle2, Clock, 
  Sparkles, ShieldCheck, FileCheck, ArrowRight
} from 'lucide-react';

export interface BatchUploadProgressState {
  current: number;
  total: number;
  currentFileName?: string;
  currentRecipient?: string;
  bytesUploaded?: number;
  totalBytes?: number;
  startTime?: number;
  estimatedRemainingSec?: number;
  uploadSpeedKBs?: number;
  statusText?: string;
}

interface BatchUploadProgressBarProps {
  progress: BatchUploadProgressState | null;
  isSubmitting: boolean;
}

export const BatchUploadProgressBar: React.FC<BatchUploadProgressBarProps> = ({
  progress,
  isSubmitting
}) => {
  if (!isSubmitting || !progress || progress.total === 0) {
    return null;
  }

  const current = progress.current;
  const total = progress.total;
  
  // Calculate percentage: if current file is in flight, give it partial progression
  const percentage = Math.min(100, Math.max(2, Math.round((current / total) * 100)));

  // Format time remaining
  const formatRemainingTime = (sec?: number) => {
    if (sec === undefined || isNaN(sec) || sec <= 0) return 'Menghitung...';
    if (sec < 60) return `~${Math.ceil(sec)} detik lagi`;
    const mins = Math.floor(sec / 60);
    const remainingSecs = Math.ceil(sec % 60);
    return `~${mins} mnt ${remainingSecs > 0 ? `${remainingSecs} dtk` : ''} lagi`;
  };

  // Format bytes
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="w-full bg-linear-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl text-white overflow-hidden relative"
      >
        {/* Background glow effects */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Top Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Cloud className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>Mengunggah Berkas ke Google Drive</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {percentage}%
                </span>
              </h4>
              <p className="text-[11px] text-slate-300">
                Memproses arsip sertifikat <span className="font-semibold text-white">{current}</span> dari <span className="font-semibold text-white">{total}</span> berkas
              </p>
            </div>
          </div>

          {/* Time and Speed Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Estimasi: <strong className="text-white font-mono">{formatRemainingTime(progress.estimatedRemainingSec)}</strong></span>
            </div>

            {progress.uploadSpeedKBs !== undefined && progress.uploadSpeedKBs > 0 && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300">
                <span className="text-cyan-400 font-bold">⚡</span>
                <span className="font-mono text-white">{progress.uploadSpeedKBs > 1024 ? `${(progress.uploadSpeedKBs / 1024).toFixed(1)} MB/s` : `${Math.round(progress.uploadSpeedKBs)} KB/s`}</span>
              </div>
            )}
          </div>
        </div>

        {/* Animated Progress Bar Track */}
        <div className="space-y-1.5 relative z-10">
          <div className="w-full h-3.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/80 shadow-inner">
            <motion.div
              className="h-full bg-linear-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full relative overflow-hidden"
              style={{ width: `${percentage}%` }}
              initial={{ width: '2%' }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {/* Shimmer animation */}
              <div 
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-pulse"
                style={{ backgroundSize: '200% 100%' }}
              />
            </motion.div>
          </div>

          {/* Micro Progress Track Labels */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>
              {progress.totalBytes ? `${formatBytes(progress.bytesUploaded)} / ${formatBytes(progress.totalBytes)}` : `${current} selesai`}
            </span>
            <span>
              {total - current > 0 ? `${total - current} berkas tersisa` : 'Menyelesaikan sinkronisasi...'}
            </span>
          </div>
        </div>

        {/* Active File Upload Info Card */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 relative z-10 text-xs">
          <div className="flex items-center gap-2 bg-slate-900/60 rounded-xl p-2 border border-slate-800">
            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Sedang Diproses:</p>
              <p className="text-xs font-semibold text-slate-200 truncate" title={progress.currentFileName}>
                {progress.currentFileName || `Berkas ke-${current + 1}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/60 rounded-xl p-2 border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Penerima Sertifikat:</p>
              <p className="text-xs font-semibold text-indigo-300 truncate" title={progress.currentRecipient}>
                {progress.currentRecipient || 'Mendeteksi data penerima...'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Line */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-slate-300">
              {progress.statusText || 'Mengunggah dan membuat kredensial arsip digital...'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Google Drive API v3</span>
        </div>

      </motion.div>
    </AnimatePresence>
  );
};
