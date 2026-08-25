import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BellRing, Clock, AlertTriangle, CheckCircle2, ShieldAlert,
  Search, ExternalLink, Calendar, User, Building2, Download,
  Copy, Check, Share2, Filter, Eye, RefreshCw, Send, ArrowRight
} from 'lucide-react';
import { Certificate } from '../types';
import { getExpiryDetails, getExpirySummary } from '../utils/expiry';
import { ExpiryIndicatorBadge } from './ExpiryIndicatorBadge';

interface ExpiryMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: Certificate[];
  onSelectCertificate: (cert: Certificate) => void;
}

export const ExpiryMonitorModal: React.FC<ExpiryMonitorModalProps> = ({
  isOpen,
  onClose,
  certificates = [],
  onSelectCertificate
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'expiring_soon' | 'expired' | 'valid'>('expiring_soon');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const safeCertificates = Array.isArray(certificates) ? certificates : [];
  const summary = getExpirySummary(safeCertificates);

  // Filter items based on activeTab and searchQuery
  const filteredList = safeCertificates
    .map(cert => ({
      cert,
      details: getExpiryDetails(cert.expiryDate)
    }))
    .filter(({ cert, details }) => {
      // Tab filter
      if (activeTab === 'expiring_soon' && details.status !== 'expiring_soon') return false;
      if (activeTab === 'expired' && details.status !== 'expired') return false;
      if (activeTab === 'valid' && details.status !== 'valid' && details.status !== 'lifetime') return false;

      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = cert.title.toLowerCase().includes(q);
        const matchesRecipient = cert.recipientName.toLowerCase().includes(q);
        const matchesIssuer = cert.issuer.toLowerCase().includes(q);
        const matchesCred = (cert.credentialId || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesRecipient && !matchesIssuer && !matchesCred) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by urgency: expiring soon & expired first
      const statusPriority: Record<string, number> = {
        expired: 1,
        expiring_soon: 2,
        valid: 3,
        lifetime: 4
      };
      const priorityDiff = (statusPriority[a.details.status] || 99) - (statusPriority[b.details.status] || 99);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.details.daysRemaining ?? 9999) - (b.details.daysRemaining ?? 9999);
    });

  const handleCopyAlertReport = () => {
    const expiringSoonList = safeCertificates
      .map(c => ({ cert: c, details: getExpiryDetails(c.expiryDate) }))
      .filter(item => item.details.status === 'expiring_soon' || item.details.status === 'expired');

    const lines = [
      '📢 *LAPORAN MONITORING MASA BERLAKU SERTIFIKAT*',
      `📅 Tanggal Cek: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`,
      `⚠️ Segera Kadaluarsa (≤ 30 Hari): ${summary.expiringSoonCount} Sertifikat`,
      `❌ Telah Kadaluarsa: ${summary.expiredCount} Sertifikat`,
      '',
      '--- DAFTAR SERTIFIKAT MENDESAK ---'
    ];

    expiringSoonList.forEach((item, idx) => {
      const statusText = item.details.status === 'expired' 
        ? `[KADALUARSA - ${item.details.badgeSubtext}]` 
        : `[SEGERA BERAKHIR - ${item.details.badgeSubtext}]`;

      lines.push(
        `${idx + 1}. *${item.cert.title}*\n   • Pemilik: ${item.cert.recipientName}\n   • Penyelenggara: ${item.cert.issuer}\n   • Masa Berlaku: ${item.details.formattedDate} ${statusText}\n   • Tautan: ${item.cert.webViewLink}`
      );
    });

    lines.push('', 'Mohon agar segera dilakukan perpanjangan atau verifikasi ulang. Terima kasih.');

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Nama Sertifikat', 'Nama Penerima', 'Penerbit', 'Kategori', 'Tanggal Terbit', 'Masa Berlaku', 'Status', 'Sisa Hari', 'Tautan Drive'];
    const rows = filteredList.map(({ cert, details }) => [
      `"${cert.credentialId || cert.id}"`,
      `"${cert.title.replace(/"/g, '""')}"`,
      `"${cert.recipientName.replace(/"/g, '""')}"`,
      `"${cert.issuer.replace(/"/g, '""')}"`,
      `"${cert.category}"`,
      `"${cert.issueDate}"`,
      `"${cert.expiryDate || 'Seumur Hidup'}"`,
      `"${details.badgeLabel}"`,
      `"${details.daysRemaining !== null ? details.daysRemaining : '-'}"`,
      `"${cert.webViewLink}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `monitoring_masa_berlaku_sertifikat_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="modal-expiry-monitor-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-colors"
        >
          <motion.div 
            key="modal-expiry-monitor-card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            id="modal-expiry-monitor"
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all flex flex-col max-h-[92vh] my-4"
          >
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-50/70 via-slate-50/70 to-slate-50/70 dark:from-amber-950/40 dark:via-slate-850 dark:to-slate-850 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <BellRing className="w-6 h-6 animate-swing" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Pusat Pemantauan Masa Berlaku
                </h2>
                <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                  {summary.totalUrgent} Perhatian
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Sistem peringatan otomatis untuk sertifikat kadaluarsa &amp; yang akan berakhir dalam 30 hari
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Metrics Ribbon */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Card 1: Expiring Soon */}
            <button
              type="button"
              onClick={() => setActiveTab('expiring_soon')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'expiring_soon'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-600 ring-2 ring-amber-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                <span>&le; 30 Hari Lagi</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {summary.expiringSoonCount}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Segera berakhir
              </p>
            </button>

            {/* Card 2: Expired */}
            <button
              type="button"
              onClick={() => setActiveTab('expired')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'expired'
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-600 ring-2 ring-rose-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                <span>Kadaluarsa</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {summary.expiredCount}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Telah lewat tempo
              </p>
            </button>

            {/* Card 3: Valid */}
            <button
              type="button"
              onClick={() => setActiveTab('valid')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'valid'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <span>Masa Aktif Aman</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {summary.validCount + summary.lifetimeCount}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                &gt; 30 hari &amp; seumur hidup
              </p>
            </button>

            {/* Card 4: All */}
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-600 ring-2 ring-indigo-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                <span>Semua Data</span>
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                {certificates.length}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Total sertifikat
              </p>
            </button>

          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dalam daftar pemantauan..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Quick export/copy actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyAlertReport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 transition-colors cursor-pointer"
              title="Salin rekap pesan pengingat ke WhatsApp/Email"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Rekap Peringatan</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
              title="Unduh daftar masa berlaku ke CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* List of Certificates */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Tidak Ada Sertifikat dalam Kategori Ini
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Semua sertifikat terpantau dalam kondisi baik atau tidak sesuai dengan kata kunci pencarian Anda.
                </p>
              </div>
            </div>
          ) : (
            filteredList.map(({ cert, details }, fIdx) => {
              const isUrgent = details.status === 'expiring_soon';
              const isExpired = details.status === 'expired';

              return (
                <div
                  key={`monitor-item-${cert.id || 'c'}-${fIdx}`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isExpired
                      ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                      : isUrgent
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ExpiryIndicatorBadge expiryDate={cert.expiryDate} />
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {cert.category}
                      </span>
                      {cert.credentialId && (
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {cert.credentialId}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {cert.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <strong className="text-slate-800 dark:text-slate-200">{cert.recipientName}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cert.issuer}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Terbit: {cert.issueDate}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <a
                      href={cert.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-colors"
                      title="Buka Berkas di Google Drive"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectCertificate(cert);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                        isExpired
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 dark:shadow-rose-950/40'
                          : isUrgent
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200 dark:shadow-amber-950/40'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-indigo-950/40'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail / Perpanjang</span>
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
            Masa berlaku dihitung otomatis berdasarkan tanggal hari ini.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer ml-auto"
          >
            Tutup Pemantau
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
