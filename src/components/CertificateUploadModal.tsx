import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, FileText, Image as ImageIcon, CheckCircle, 
  AlertCircle, Cloud, Sparkles, Calendar, User, Tag, Building2, Hash, Clock,
  Files, CheckSquare, Layers, Plus, Trash2, Wand2, Loader2, Scan
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  uploadCertificate, 
  uploadMultipleCertificates, 
  parseCertificateItemInfo,
  scanCertificateFile,
  scanBatchCertificateFiles,
  ScannedCertificateResult
} from '../services/api';
import { GoogleAuthState } from '../services/googleAuth';
import { Certificate, CertificateCategory } from '../types';
import { ExpiryIndicatorBadge } from './ExpiryIndicatorBadge';

interface CertificateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCert: Certificate) => void;
  onBatchSuccess?: (newCerts: Certificate[]) => void;
  authState: GoogleAuthState;
  onOpenGoogleConnect: () => void;
}

interface BatchFileItem {
  file: File;
  title: string;
  recipientName: string;
  category: CertificateCategory;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  isScanning?: boolean;
  scannedSource?: 'ai_vision' | 'filename_heuristic';
}

export const CertificateUploadModal: React.FC<CertificateUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onBatchSuccess,
  authState,
  onOpenGoogleConnect
}) => {
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');
  
  // Single upload states
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasExpiryDate, setHasExpiryDate] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [issuer, setIssuer] = useState('');
  const [category, setCategory] = useState<CertificateCategory>('Pelatihan');
  const [credentialId, setCredentialId] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isScanningSingle, setIsScanningSingle] = useState(false);
  const [singleScanSuccess, setSingleScanSuccess] = useState<boolean | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Batch upload states
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  const [batchIssuer, setBatchIssuer] = useState('Penyelenggara Diklat Resmi');
  const [batchValidityYears, setBatchValidityYears] = useState<number>(3);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [isScanningBatch, setIsScanningBatch] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSingleFileChange = async (selectedFile: File) => {
    setErrorMsg(null);
    setSingleScanSuccess(null);
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

    // Heuristic pre-fill
    const parsed = parseCertificateItemInfo(selectedFile.name, 'Sertifikat Pelatihan', 'Staff RSUD');
    if (!title) setTitle(parsed.title);
    if (!recipientName && parsed.recipientName !== 'Staff RSUD') setRecipientName(parsed.recipientName);
    setCategory(parsed.category);

    // Run AI OCR scan
    try {
      setIsScanningSingle(true);
      const scanResult = await scanCertificateFile(selectedFile);
      if (scanResult) {
        if (scanResult.recipientName) setRecipientName(scanResult.recipientName);
        if (scanResult.title) setTitle(scanResult.title);
        if (scanResult.issuer) setIssuer(scanResult.issuer);
        if (scanResult.category) setCategory(scanResult.category);
        if (scanResult.issueDate) setIssueDate(scanResult.issueDate);
        if (scanResult.expiryDate) {
          setExpiryDate(scanResult.expiryDate);
          setHasExpiryDate(true);
        }
        if (scanResult.credentialId && !credentialId) setCredentialId(scanResult.credentialId);
        setSingleScanSuccess(true);
      }
    } catch (scanErr) {
      console.warn('AI OCR scan error on single file:', scanErr);
    } finally {
      setIsScanningSingle(false);
    }
  };

  const scanBatchItems = async (itemsToScan: BatchFileItem[], fullList: BatchFileItem[]) => {
    setIsScanningBatch(true);
    try {
      const files = itemsToScan.map(i => i.file);
      const results = await scanBatchCertificateFiles(files);
      
      setBatchFiles((prev) => {
        const next = [...prev];
        results.forEach((res) => {
          const idx = next.findIndex(n => n.file.name === res.fileName);
          if (idx !== -1) {
            next[idx] = {
              ...next[idx],
              recipientName: res.recipientName || next[idx].recipientName,
              title: res.title || next[idx].title,
              category: res.category || next[idx].category,
              issuer: res.issuer || next[idx].issuer,
              issueDate: res.issueDate || next[idx].issueDate,
              expiryDate: res.expiryDate || next[idx].expiryDate,
              isScanning: false,
              scannedSource: res.source
            };
          }
        });
        return next;
      });
    } catch (batchScanErr) {
      console.warn('Error during batch AI scan:', batchScanErr);
    } finally {
      setIsScanningBatch(false);
    }
  };

  const handleBatchFilesAdd = (newFileList: FileList | File[]) => {
    setErrorMsg(null);
    const validMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const addedItems: BatchFileItem[] = [];

    Array.from(newFileList).forEach((f) => {
      if (validMimes.includes(f.type) && f.size <= 30 * 1024 * 1024) {
        const parsed = parseCertificateItemInfo(f.name, 'Sertifikat Pelatihan', 'Staff Perawat / Medis RSUD');
        addedItems.push({
          file: f,
          title: parsed.title,
          recipientName: parsed.recipientName,
          category: parsed.category,
          isScanning: autoScanEnabled,
          scannedSource: 'filename_heuristic'
        });
      }
    });

    if (addedItems.length === 0) {
      setErrorMsg('Tidak ada file valid (PDF/JPG/PNG) yang dipilih.');
      return;
    }

    const updatedList = [...batchFiles, ...addedItems];
    setBatchFiles(updatedList);

    if (autoScanEnabled) {
      scanBatchItems(addedItems, updatedList);
    }
  };

  const handleTriggerManualBatchScan = () => {
    if (batchFiles.length === 0) return;
    scanBatchItems(batchFiles, batchFiles);
  };

  const handleRemoveBatchItem = (index: number) => {
    setBatchFiles(batchFiles.filter((_, idx) => idx !== index));
  };

  const handleBatchItemChange = (index: number, field: keyof BatchFileItem, value: any) => {
    const updated = [...batchFiles];
    updated[index] = { ...updated[index], [field]: value };
    setBatchFiles(updated);
  };

  // Single Upload Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
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

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}

      onSuccess(createdCert);
      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch Upload Submit (Processes each file individually and creates separate records)
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (batchFiles.length === 0) {
      setErrorMsg('Harap tambahkan minimal 1 file untuk diunggah.');
      return;
    }

    try {
      setIsSubmitting(true);
      setBatchProgress({ current: 0, total: batchFiles.length });

      const uploadedCerts: Certificate[] = [];

      for (let i = 0; i < batchFiles.length; i++) {
        const item = batchFiles[i];
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('title', item.title.trim());
        formData.append('recipientName', item.recipientName.trim());
        formData.append('issueDate', issueDate);
        
        if (batchValidityYears > 0) {
          const baseYear = parseInt(issueDate.substring(0, 4), 10);
          const expDate = `${baseYear + batchValidityYears}-${issueDate.substring(5)}`;
          formData.append('expiryDate', expDate);
        } else {
          formData.append('expiryDate', '');
        }

        formData.append('issuer', batchIssuer.trim() || 'Penyelenggara Diklat / Kemenkes');
        formData.append('category', item.category);
        formData.append('tags', JSON.stringify(['Batch Multi-File', item.category]));

        const resCert = await uploadCertificate(formData);
        uploadedCerts.push(resCert);
        setBatchProgress({ current: i + 1, total: batchFiles.length });
      }

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {}

      if (onBatchSuccess) {
        onBatchSuccess(uploadedCerts);
      } else if (uploadedCerts.length > 0) {
        onSuccess(uploadedCerts[0]);
      }

      onClose();
    } catch (err: any) {
      console.error('Batch upload error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah kumpulan file.');
    } finally {
      setIsSubmitting(false);
      setBatchProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-colors">
      <div 
        id="modal-upload-certificate"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all my-6 max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Unggah Sertifikat</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Pilih unggah satu berkas atau banyak berkas sekaligus (otomatis disendirikan)
              </p>
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

        {/* Mode Tabs */}
        <div className="px-6 pt-3 bg-slate-50/50 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                setUploadMode('single');
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                uploadMode === 'single'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unggah 1 Berkas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadMode('batch');
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                uploadMode === 'batch'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Files className="w-3.5 h-3.5" />
              <span>Unggah Banyak File Sekaligus (Batch)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
          
          {/* Cloud Storage Banner */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
            authState.isConnected
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300'
              : 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <Cloud className={`w-4 h-4 shrink-0 ${authState.isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <div>
                <span className="font-bold">
                  {authState.isConnected ? '● Terhubung ke Google Drive' : 'Penyimpanan Lokal & Cloud Aktif'}
                </span>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Setiap berkas dibuatkan ID unik dan masa berlaku sendiri secara otomatis.
                </p>
              </div>
            </div>
            {!authState.isConnected && (
              <button
                type="button"
                onClick={onOpenGoogleConnect}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors ml-2 shadow-2xs cursor-pointer"
              >
                Google Drive
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* SINGLE FILE FORM */}
          {uploadMode === 'single' && (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              {/* File Dropzone */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    File Dokumen / Gambar <span className="text-rose-500">*</span>
                  </label>
                  {isScanningSingle && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Membaca nama & isi dokumen...
                    </span>
                  )}
                </div>

                <div
                  id="upload-dropzone"
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleSingleFileChange(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
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
                        handleSingleFileChange(e.target.files[0]);
                      }
                    }}
                  />

                  {file ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-5 h-5 text-rose-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs">{file.name}</p>
                          <p className="text-[11px] text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 hover:underline">Ganti File</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <UploadCloud className="w-8 h-8 mx-auto text-indigo-500" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Klik untuk memilih berkas atau tarik & lepas ke sini
                      </p>
                      <p className="text-[11px] text-slate-400">PDF, PNG, JPG (Maks. 30MB) - Otomatis mendeteksi nama penerima</p>
                    </div>
                  )}
                </div>

                {singleScanSuccess && (
                  <div className="mt-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Nama penerima dan detail sertifikat berhasil diekstrak otomatis. Anda dapat mengubahnya jika perlu.</span>
                  </div>
                )}
              </div>

              {/* Title & Recipient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Judul Sertifikat / Pelatihan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Pelatihan ICU & Keperawatan Kritis"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nama Penerima / Pemilik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Contoh: dr. Ahmad Fauzi, Sp.An"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Category, Issuer, Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CertificateCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Pelatihan">Pelatihan</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Prestasi">Prestasi</option>
                    <option value="Penghargaan">Penghargaan</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Kelulusan">Kelulusan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Tanggal Terbit
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Penyelenggara / Penerbit
                  </label>
                  <input
                    type="text"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    placeholder="Contoh: Kemenkes RI / Kolegium"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Expiry Date Section */}
              <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={hasExpiryDate}
                      onChange={(e) => {
                        setHasExpiryDate(e.target.checked);
                        if (e.target.checked && !expiryDate) handleSetExpiryPreset(3);
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Memiliki Masa Berlaku (Kadaluarsa)</span>
                  </label>

                  {hasExpiryDate && (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSetExpiryPreset(1)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                      >
                        1 Thn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetExpiryPreset(3)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                      >
                        3 Thn (Medis)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetExpiryPreset(5)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                      >
                        5 Thn
                      </button>
                    </div>
                  )}
                </div>

                {hasExpiryDate && (
                  <div className="pt-1">
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Submit Single */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-950/60 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan Sertifikat...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Simpan Sertifikat Sekarang</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* BATCH MULTI-FILE FORM */}
          {uploadMode === 'batch' && (
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              
              {/* Batch Dropzone */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Pilih Banyak File PDF/Gambar Sekaligus <span className="text-rose-500">*</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoScanEnabled}
                      onChange={(e) => setAutoScanEnabled(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <Sparkles className="w-3 h-3" />
                    <span>Otomatis Baca Nama (AI OCR)</span>
                  </label>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleBatchFilesAdd(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => batchFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-slate-50/60 dark:bg-slate-800/40'
                  }`}
                >
                  <input
                    ref={batchFileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleBatchFilesAdd(e.target.files);
                      }
                    }}
                  />

                  <div className="space-y-1.5">
                    <Files className="w-9 h-9 mx-auto text-indigo-600 dark:text-indigo-400" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Tarik & lepas banyak berkas PDF/Foto atau klik untuk pilih sekaligus
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Sistem membaca nama penerima dan memisahkan setiap sertifikat secara individu ke sistem
                    </p>
                  </div>
                </div>
              </div>

              {/* Batch Table / List */}
              {batchFiles.length > 0 && (
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {batchFiles.length} Berkas Siap Diunggah (Disendirikan):
                      </span>
                      {isScanningBatch && (
                        <span className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-100 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Memindai nama peserta...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTriggerManualBatchScan}
                        disabled={isScanningBatch}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Pindai Ulang AI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBatchFiles([])}
                        className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {batchFiles.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              📁 {item.file.name}
                            </span>
                            {item.isScanning ? (
                              <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 animate-pulse">
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                Membaca...
                              </span>
                            ) : item.scannedSource === 'ai_vision' ? (
                              <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                Terbaca AI
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                Nama Berkas
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchItem(idx)}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Nama Peserta / Penerima:</label>
                            <input
                              type="text"
                              value={item.recipientName}
                              onChange={(e) => handleBatchItemChange(idx, 'recipientName', e.target.value)}
                              placeholder="Nama Penerima / Pemilik"
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Judul Sertifikat:</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleBatchItemChange(idx, 'title', e.target.value)}
                              placeholder="Judul Pelatihan / Sertifikat"
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Global Batch Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Penyelenggara / Penerbit Bersama
                  </label>
                  <input
                    type="text"
                    value={batchIssuer}
                    onChange={(e) => setBatchIssuer(e.target.value)}
                    placeholder="Penyelenggara Diklat / Kemenkes"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Masa Berlaku Default
                  </label>
                  <select
                    value={batchValidityYears}
                    onChange={(e) => setBatchValidityYears(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={1}>1 Tahun</option>
                    <option value={2}>2 Tahun</option>
                    <option value={3}>3 Tahun (Standar Pelatihan Medis)</option>
                    <option value={4}>4 Tahun</option>
                    <option value={5}>5 Tahun</option>
                    <option value={0}>Seumur Hidup / Tanpa Expired</option>
                  </select>
                </div>
              </div>

              {/* Submit Batch */}
              <button
                type="submit"
                disabled={isSubmitting || batchFiles.length === 0}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-950/60 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>
                      Mengunggah & Memisahkan {batchProgress?.current || 0} dari {batchProgress?.total || batchFiles.length} Berkas...
                    </span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Unggah {batchFiles.length} Berkas Secara Terpisah Sekarang</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
