import React, { useState } from 'react';
import { 
  X, ExternalLink, Download, Copy, Check, Calendar, User, 
  Building2, HardDrive, FileText, Image as ImageIcon, QrCode, 
  Edit3, Trash2, ShieldCheck, Tag, Link2, Save, Clock
} from 'lucide-react';
import { Certificate } from '../types';
import { updateCertificate } from '../services/api';
import { ExpiryIndicatorBadge } from './ExpiryIndicatorBadge';

interface CertificateDetailModalProps {
  certificate: Certificate | null;
  onClose: () => void;
  onUpdate: (updated: Certificate) => void;
  onDelete: (cert: Certificate) => void;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const CertificateDetailModal: React.FC<CertificateDetailModalProps> = ({
  certificate,
  onClose,
  onUpdate,
  onDelete
}) => {
  if (!certificate) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit states
  const [editTitle, setEditTitle] = useState(certificate.title);
  const [editRecipient, setEditRecipient] = useState(certificate.recipientName);
  const [editIssuer, setEditIssuer] = useState(certificate.issuer);
  const [editDate, setEditDate] = useState(certificate.issueDate);
  const [editHasExpiryDate, setEditHasExpiryDate] = useState(Boolean(certificate.expiryDate && certificate.expiryDate.trim() !== ''));
  const [editExpiryDate, setEditExpiryDate] = useState(certificate.expiryDate || '');
  const [editCategory, setEditCategory] = useState(certificate.category);
  const [editDescription, setEditDescription] = useState(certificate.description || '');

  const isPdf = certificate.mimeType === 'application/pdf';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(certificate.webViewLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    if (certificate.credentialId) {
      navigator.clipboard.writeText(certificate.credentialId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSetEditExpiryPreset = (years: number) => {
    const base = editDate ? new Date(editDate) : new Date();
    base.setFullYear(base.getFullYear() + years);
    setEditExpiryDate(base.toISOString().split('T')[0]);
    setEditHasExpiryDate(true);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      const updated = await updateCertificate(certificate.id, {
        title: editTitle,
        recipientName: editRecipient,
        issuer: editIssuer,
        issueDate: editDate,
        expiryDate: editHasExpiryDate && editExpiryDate ? editExpiryDate : '',
        category: editCategory,
        description: editDescription
      });
      onUpdate(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert(`Gagal memperbarui data: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-colors">
      <div 
        id="modal-certificate-detail"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all flex flex-col max-h-[90vh]"
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isPdf 
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50' 
                : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50'
            }`}>
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-md sm:max-w-lg">
                {certificate.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Google Drive File ID:</span>
                <code className="font-mono text-[11px] bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-700 dark:text-slate-300">
                  {certificate.driveFileId.substring(0, 22)}...
                </code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-edit"
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isEditing 
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
              title="Edit Data"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEditing ? 'Batal' : 'Edit'}</span>
            </button>

            <button
              id="btn-close-detail-modal"
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: File Preview & Google Drive Links */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Visual File Preview Box */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-900/5 dark:bg-slate-800/40 aspect-4/3 flex flex-col items-center justify-center p-6 text-center relative group shadow-2xs">
              <div className="space-y-3">
                <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-xs ${
                  isPdf 
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
                    : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {isPdf ? <FileText className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{certificate.fileName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {certificate.mimeType} • {formatBytes(certificate.fileSize)}
                  </p>
                </div>
                
                {/* Embedded Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <a
                    href={certificate.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-100 dark:shadow-indigo-950/50 active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka File di Google Drive</span>
                  </a>

                  {certificate.webContentLink && (
                    <a
                      href={certificate.webContentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh File</span>
                    </a>
                  )}
                </div>
              </div>

              <span className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-slate-800">
                Google Drive Storage
              </span>
            </div>

            {/* Google Drive Link Box with Copy Button */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
                <div className="flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Tautan Langsung Google Drive (Web View)</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin Tautan</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={certificate.webViewLink}
                className="w-full px-3 py-2 text-[11px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 select-all outline-none"
              />
            </div>

          </div>

          {/* Right Column: Metadata & Verification */}
          <div className="lg:col-span-5 space-y-5">
            
            {isEditing ? (
              /* EDIT FORM */
              <div className="space-y-3.5 bg-slate-50/50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                  <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Edit Metadata Sertifikat</span>
                </h3>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[10px]">Nama Sertifikat</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[10px]">Nama Pemilik / Penerima</label>
                  <input
                    type="text"
                    value={editRecipient}
                    onChange={(e) => setEditRecipient(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[10px]">Lembaga Penerbit</label>
                  <input
                    type="text"
                    value={editIssuer}
                    onChange={(e) => setEditIssuer(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[10px]">Tanggal Terbit</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[10px]">Kategori</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-medium"
                    >
                      <option value="Prestasi">Prestasi</option>
                      <option value="Pelatihan">Pelatihan</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Akademik">Akademik</option>
                      <option value="Penghargaan">Penghargaan</option>
                      <option value="Kelulusan">Kelulusan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* Edit Expiry Date */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Masa Berlaku</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditHasExpiryDate(false);
                          setEditExpiryDate('');
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                          !editHasExpiryDate
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        Seumur Hidup
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditHasExpiryDate(true);
                          if (!editExpiryDate) handleSetEditExpiryPreset(1);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                          editHasExpiryDate
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        Ada Batas
                      </button>
                    </div>
                  </div>

                  {editHasExpiryDate && (
                    <div className="space-y-1.5 pt-1">
                      <input
                        type="date"
                        value={editExpiryDate}
                        onChange={(e) => setEditExpiryDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Preset:</span>
                        {[1, 2, 3, 5].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => handleSetEditExpiryPreset(yr)}
                            className="px-1.5 py-0.5 bg-white dark:bg-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold cursor-pointer"
                          >
                            +{yr} Thn
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[10px]">Deskripsi</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW METADATA */
              <div className="space-y-4">
                
                {/* Expiry Status Banner with Blinking Light */}
                <ExpiryIndicatorBadge expiryDate={certificate.expiryDate} variant="detail" />

                {/* Recipient & Issuer Box */}
                <div className="bg-slate-50/70 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Penerima Sertifikat
                    </span>
                    <p className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                      <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{certificate.recipientName}</span>
                    </p>
                    {certificate.recipientEmail && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 ml-6 font-medium">{certificate.recipientEmail}</p>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Lembaga Penyelenggara
                    </span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                      <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>{certificate.issuer}</span>
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Tanggal Terbit
                      </span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{certificate.issueDate}</span>
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Kategori
                      </span>
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {certificate.category}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Credential ID & QR Code Box */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Verifikasi Kredensial</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId ? 'ID Tersalin!' : 'Salin ID'}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {certificate.credentialId || 'CERT-UNASSIGNED'}
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full shrink-0">
                      Terverifikasi
                    </span>
                  </div>

                  {certificate.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                      {certificate.description}
                    </p>
                  )}

                  {certificate.tags && certificate.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {certificate.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold border border-indigo-100 dark:border-indigo-900/50"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    id="btn-delete-cert-detail-modal"
                    type="button"
                    onClick={() => {
                      onDelete(certificate);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Sertifikat</span>
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
