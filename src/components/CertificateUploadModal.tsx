import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, FileText, Image as ImageIcon, CheckCircle, 
  AlertCircle, Cloud, Sparkles, Calendar, User, Tag, Building2, Hash, Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { uploadCertificate } from '../services/api';
import { GoogleAuthState } from '../services/googleAuth';
import { Certificate } from '../types';
import { ExpiryIndicatorBadge } from './ExpiryIndicatorBadge';

interface CertificateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCert: Certificate) => void;
  authState: GoogleAuthState;
  onOpenGoogleConnect: () => void;
}

export const CertificateUploadModal: React.FC<CertificateUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  authState,
  onOpenGoogleConnect
}) => {
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasExpiryDate, setHasExpiryDate] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [issuer, setIssuer] = useState('');
  const [category, setCategory] = useState<'Prestasi' | 'Pelatihan' | 'Workshop' | 'Akademik' | 'Penghargaan' | 'Kelulusan' | 'Lainnya'>('Prestasi');
  const [credentialId, setCredentialId] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleGenerateCredentialId = () => {
    const year = issueDate ? issueDate.split('-')[0] : new Date().getFullYear().toString();
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const prefix = category.substring(0, 3).toUpperCase();
    setCredentialId(`CERT-${year}-${prefix}-${randomCode}`);
  };

  const handleSetExpiryPreset = (yearsToAdd: number) => {
    const baseDate = issueDate ? new Date(issueDate) : new Date();
    baseDate.setFullYear(baseDate.getFullYear() + yearsToAdd);
    setExpiryDate(baseDate.toISOString().split('T')[0]);
    setHasExpiryDate(true);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleFileChange = (selectedFile: File) => {
    setErrorMsg(null);
    const validMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimes.includes(selectedFile.type)) {
      setErrorMsg('Format file tidak didukung. Harap pilih file PDF, JPG, atau PNG.');
      return;
    }

    if (selectedFile.size > 30 * 1024 * 1024) {
      setErrorMsg('Ukuran file melebihi batas maksimum (30 MB).');
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }

    // Auto-fill title from filename if title is empty
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!file) {
      setErrorMsg('Harap pilih file sertifikat terlebih dahulu.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Nama sertifikat wajib diisi.');
      return;
    }

    if (!recipientName.trim()) {
      setErrorMsg('Nama pemilik / penerima wajib diisi.');
      return;
    }

    if (!issueDate) {
      setErrorMsg('Tanggal terbit sertifikat wajib diisi.');
      return;
    }

    if (hasExpiryDate && !expiryDate) {
      setErrorMsg('Harap tentukan tanggal kadaluarsa atau pilih opsi Berlaku Seumur Hidup.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('recipientName', recipientName.trim());
      if (recipientEmail) formData.append('recipientEmail', recipientEmail.trim());
      formData.append('issueDate', issueDate);
      if (hasExpiryDate && expiryDate) {
        formData.append('expiryDate', expiryDate);
      } else {
        formData.append('expiryDate', '');
      }
      formData.append('issuer', issuer.trim() || 'Penyelenggara Resmi');
      formData.append('category', category);
      if (credentialId) formData.append('credentialId', credentialId.trim());
      if (description) formData.append('description', description.trim());
      if (tags.length > 0) formData.append('tags', JSON.stringify(tags));

      const createdCert = await uploadCertificate(formData);

      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // ignore
      }

      onSuccess(createdCert);
      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-colors">
      <div 
        id="modal-upload-certificate"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all transform animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Unggah Sertifikat Baru</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">File fisik otomatis disimpan di Google Drive & terindeks ke Database</p>
            </div>
          </div>
          <button
            id="btn-close-upload-modal"
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Google Drive Status Banner */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
            authState.isConnected
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300'
              : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300'
          }`}>
            <div className="flex items-center gap-2.5">
              <Cloud className={`w-4 h-4 shrink-0 ${authState.isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
              <div>
                <span className="font-bold">
                  {authState.isConnected ? '● Google Drive Aktif' : 'Penyimpanan Google Drive Cloud'}
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {authState.isConnected
                    ? 'File fisik disimpan ke folder "📁 Sertifikat Digital" di Google Drive akun Anda.'
                    : 'Gunakan koneksi Google Drive untuk sinkronisasi cloud real-time.'}
                </p>
              </div>
            </div>
            {!authState.isConnected && (
              <button
                type="button"
                onClick={onOpenGoogleConnect}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors ml-2 shadow-2xs cursor-pointer"
              >
                Koneksikan
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">
              File Dokumen / Gambar <span className="text-rose-500">*</span>
            </label>
            <div
              id="upload-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : file
                  ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-slate-50/60 dark:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : file.type === 'application/pdf' ? (
                        <FileText className="w-6 h-6 text-rose-500" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-indigo-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {(file.size / 1024).toFixed(1)} KB • {file.type || 'Dokumen'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors">
                    Ganti File
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/50 shadow-2xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Klik untuk memilih file atau drag & drop ke sini
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Mendukung format PDF, JPG, PNG, atau WEBP (Maksimal 30 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">
                Nama Sertifikat <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-cert-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Juara 1 Lomba Web Development Nasional"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all"
              />
            </div>

            {/* Recipient Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">
                Nama Pemilik / Penerima <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-recipient-name"
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all"
                />
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">
                Tanggal Terbit <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-issue-date"
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all cursor-pointer"
                />
                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Expiry Date / Validity Section */}
            <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                    Masa Berlaku & Kadaluarsa
                  </span>
                </div>
                
                {/* Toggle Seumur Hidup vs Ada Kadaluarsa */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHasExpiryDate(false);
                      setExpiryDate('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      !hasExpiryDate
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    ♾️ Seumur Hidup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasExpiryDate(true);
                      if (!expiryDate) {
                        handleSetExpiryPreset(1);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      hasExpiryDate
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    📅 Ada Masa Berlaku
                  </button>
                </div>
              </div>

              {hasExpiryDate ? (
                <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        id="input-expiry-date"
                        type="date"
                        required={hasExpiryDate}
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-2.5" />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mr-1">Preset:</span>
                      {[1, 2, 3, 5].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => handleSetExpiryPreset(yr)}
                          className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          +{yr} Thn
                        </button>
                      ))}
                    </div>
                  </div>

                  {expiryDate && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Status Masa Berlaku:</span>
                      <ExpiryIndicatorBadge expiryDate={expiryDate} variant="compact" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  ✓ Sertifikat berlaku permanen tanpa tanggal kedaluwarsa.
                </p>
              )}
            </div>

            {/* Issuer / Organizer */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">
                Lembaga Penerbit / Penyelenggara
              </label>
              <div className="relative">
                <input
                  id="input-issuer"
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="Contoh: Kementerian Komunikasi & Digital"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all"
                />
                <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">
                Kategori Sertifikat
              </label>
              <select
                id="select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="Prestasi" className="dark:bg-slate-800">Prestasi & Kompetisi</option>
                <option value="Pelatihan" className="dark:bg-slate-800">Pelatihan & Kursus</option>
                <option value="Workshop" className="dark:bg-slate-800">Workshop & Webinar</option>
                <option value="Akademik" className="dark:bg-slate-800">Akademik & Formal</option>
                <option value="Penghargaan" className="dark:bg-slate-800">Penghargaan / Award</option>
                <option value="Kelulusan" className="dark:bg-slate-800">Kelulusan & Sertifikasi</option>
                <option value="Lainnya" className="dark:bg-slate-800">Lainnya</option>
              </select>
            </div>

            {/* Credential ID */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Nomor Sertifikat / ID Kredensial
                </label>
                <button
                  type="button"
                  onClick={handleGenerateCredentialId}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Otomatis</span>
                </button>
              </div>
              <div className="relative">
                <input
                  id="input-credential-id"
                  type="text"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                  placeholder="Contoh: CERT-2026-WEB-88231"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none font-mono transition-all"
                />
                <Hash className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">
                Deskripsi / Catatan Tambahan (Opsional)
              </label>
              <textarea
                id="input-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Penjelasan singkat mengenai kompetensi atau capaian sertifikat..."
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all resize-none"
              />
            </div>

            {/* Tags */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">
                Tag & Label
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Tambah tag (misal: Web Dev, React, Juara 1) lalu Enter"
                  className="w-full px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shrink-0 transition-colors cursor-pointer"
                >
                  Tambah
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              id="btn-cancel-upload"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-submit-upload"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-950/50 active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan ke Google Drive...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Simpan ke Google Drive</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
