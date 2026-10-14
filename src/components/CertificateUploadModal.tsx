import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, UploadCloud, FileText, Image as ImageIcon, CheckCircle, 
  AlertCircle, Cloud, Sparkles, Calendar, User, Tag, Building2, Hash, Clock,
  Files, CheckSquare, Layers, Plus, Trash2, Wand2, Loader2, Scan, RefreshCw, Check, Lightbulb, Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  uploadCertificate, 
  uploadMultipleCertificates, 
  parseCertificateItemInfo,
  scanCertificateFile,
  scanBatchCertificateFiles,
  suggestCategoryAndTags,
  ScannedCertificateResult
} from '../services/api';
import { GoogleAuthState } from '../services/googleAuth';
import { Certificate, CertificateCategory, CategoryItem } from '../types';
import { recommendCategoriesFromMetadata, CategoryRecommendation } from '../utils/categoryRecommender';
import { ExpiryIndicatorBadge } from './ExpiryIndicatorBadge';
import { BatchUploadProgressBar, BatchUploadProgressState } from './BatchUploadProgressBar';

interface CertificateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCert: Certificate) => void;
  onBatchSuccess?: (newCerts: Certificate[]) => void;
  authState: GoogleAuthState;
  onOpenGoogleConnect: () => void;
  categoriesList?: CategoryItem[];
  certificates?: Certificate[];
  onOpenCategoryManager?: () => void;
}

interface BatchFileItem {
  file: File;
  previewUrl?: string;
  title: string;
  recipientName: string;
  category: CertificateCategory;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  suggestedTags?: string[];
  tags?: string[];
  extractedTextSummary?: string;
  isScanning?: boolean;
  scannedSource?: 'ai_vision' | 'filename_heuristic';
}

export const CertificateUploadModal: React.FC<CertificateUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onBatchSuccess,
  authState,
  onOpenGoogleConnect,
  categoriesList = [],
  certificates = [],
  onOpenCategoryManager
}) => {
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');
  
  // Available category names (guaranteed case-insensitively unique)
  const categoryMap = new Map<string, string>();
  const rawList = categoriesList.length > 0 
    ? categoriesList.map(c => c.name)
    : ['Pelatihan', 'Workshop', 'Prestasi', 'Penghargaan', 'Akademik', 'Kelulusan', 'Lainnya'];
  rawList.forEach(s => {
    const trimmed = (s || '').trim();
    if (trimmed && !categoryMap.has(trimmed.toLowerCase())) {
      categoryMap.set(trimmed.toLowerCase(), trimmed);
    }
  });
  const availableCategories = Array.from(categoryMap.values());

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
  const [aiSuggestedTags, setAiSuggestedTags] = useState<string[]>([]);
  const [aiExtractedSummary, setAiExtractedSummary] = useState<string | null>(null);
  const [isScanningSingle, setIsScanningSingle] = useState(false);
  const [singleScanSuccess, setSingleScanSuccess] = useState<boolean | null>(null);
  const [scanSource, setScanSource] = useState<'ai_vision' | 'filename_heuristic' | null>(null);
  const [isRequestingAISuggestions, setIsRequestingAISuggestions] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Batch upload states
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  const [batchCommonTitle, setBatchCommonTitle] = useState('Pelatihan Bantuan Hidup Dasar (BHD)');
  const [batchIssuer, setBatchIssuer] = useState('Diklat RSUD dr. H. Jusuf SK');
  const [batchCommonCategory, setBatchCommonCategory] = useState<CertificateCategory>('Pelatihan');
  const [batchValidityYears, setBatchValidityYears] = useState<number>(3);
  const [batchProgress, setBatchProgress] = useState<BatchUploadProgressState | null>(null);
  const [isScanningBatch, setIsScanningBatch] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [batchSearchTerm, setBatchSearchTerm] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewModalFile, setPreviewModalFile] = useState<{ file: File; name: string; url?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  async function traverseFileTree(item: FileSystemEntry, files: File[]) {
    if (item.isFile) {
      await new Promise<void>((resolve) => {
        (item as FileSystemFileEntry).file((file) => {
          files.push(file);
          resolve();
        }, () => resolve());
      });
    } else if (item.isDirectory) {
      const dirReader = (item as FileSystemDirectoryEntry).createReader();
      await new Promise<void>((resolve) => {
        dirReader.readEntries(async (entries: FileSystemEntry[]) => {
          for (const entry of entries) {
            await traverseFileTree(entry, files);
          }
          resolve();
        }, () => resolve());
      });
    }
  }

  // Compute intelligent real-time category recommendations based on current form metadata and archive history
  const singleCategoryRecommendations = useMemo(() => {
    return recommendCategoriesFromMetadata(
      {
        title,
        issuer,
        recipientName,
        description,
        tags,
        fileName: file?.name,
        extractedTextSummary: aiExtractedSummary || undefined
      },
      certificates,
      availableCategories
    );
  }, [title, issuer, recipientName, description, tags, file?.name, aiExtractedSummary, certificates, availableCategories]);

  const topCategoryRecommendation = singleCategoryRecommendations.length > 0 ? singleCategoryRecommendations[0] : null;

  // Batch common category recommendation
  const batchCommonRecommendations = useMemo(() => {
    return recommendCategoriesFromMetadata(
      {
        title: batchCommonTitle,
        issuer: batchIssuer,
        fileName: batchFiles.length > 0 ? batchFiles[0].file.name : undefined
      },
      certificates,
      availableCategories
    );
  }, [batchCommonTitle, batchIssuer, batchFiles, certificates, availableCategories]);

  const topBatchRecommendation = batchCommonRecommendations.length > 0 ? batchCommonRecommendations[0] : null;

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

  const handleApplyCommonTitleToAll = () => {
    if (!batchCommonTitle.trim()) return;
    setBatchFiles(batchFiles.map(item => ({ ...item, title: batchCommonTitle.trim() })));
  };

  const handleApplyCommonCategoryToAll = (newCat: CertificateCategory) => {
    setBatchCommonCategory(newCat);
    setBatchFiles(batchFiles.map(item => ({ ...item, category: newCat })));
  };

  const handleApplyAutoCategoryRecommendationsToAllBatch = () => {
    setBatchFiles(prev => prev.map(item => {
      const recomms = recommendCategoriesFromMetadata(
        {
          title: item.title,
          issuer: item.issuer || batchIssuer,
          recipientName: item.recipientName,
          fileName: item.file.name,
          extractedTextSummary: item.extractedTextSummary
        },
        certificates,
        availableCategories
      );
      const best = recomms.length > 0 ? recomms[0] : null;
      return {
        ...item,
        category: best && best.score >= 35 ? best.category : item.category
      };
    }));
  };

  const handleAddTag = (customTag?: string) => {
    const targetTag = (customTag !== undefined ? customTag : tagInput).trim();
    if (targetTag && !tags.includes(targetTag)) {
      setTags([...tags, targetTag]);
      if (customTag === undefined) setTagInput('');
    }
  };

  const handleToggleSuggestedTag = (suggested: string) => {
    if (tags.includes(suggested)) {
      setTags(tags.filter(t => t !== suggested));
    } else {
      setTags([...tags, suggested]);
    }
  };

  const handleAddAllSuggestedTags = () => {
    if (aiSuggestedTags.length === 0) return;
    const merged = Array.from(new Set([...tags, ...aiSuggestedTags]));
    setTags(merged);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Re-request Gemini AI suggestions on demand based on current form values & archive metadata
  const handleTriggerAISuggestions = async () => {
    try {
      setIsRequestingAISuggestions(true);
      const res = await suggestCategoryAndTags({
        title,
        issuer,
        recipientName,
        description,
        currentCategory: category,
        tags,
        fileName: file?.name,
        existingCertificates: certificates
      });

      if (res.category && res.category !== category) {
        setCategory(res.category);
      }
      if (res.suggestedTags && res.suggestedTags.length > 0) {
        setAiSuggestedTags(res.suggestedTags);
        // Add new suggested tags
        setTags(prev => Array.from(new Set([...prev, ...res.suggestedTags])));
      }
      if (res.summary) {
        setAiExtractedSummary(res.summary);
      }
    } catch (err) {
      console.warn('AI suggestions error:', err);
    } finally {
      setIsRequestingAISuggestions(false);
    }
  };

  const handleSingleFileChange = async (selectedFile: File) => {
    setErrorMsg(null);
    setSingleScanSuccess(null);
    setAiSuggestedTags([]);
    setAiExtractedSummary(null);
    setScanSource(null);

    const validMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const isValid = validMimes.includes(selectedFile.type) || /\.(pdf|jpg|jpeg|png|webp)$/i.test(selectedFile.name);
    if (!isValid) {
      setErrorMsg('Format file tidak didukung. Harap pilih file PDF, JPG, atau PNG.');
      return;
    }

    if (selectedFile.size > 30 * 1024 * 1024) {
      setErrorMsg('Ukuran file melebihi batas maksimum (30 MB).');
      return;
    }

    setFile(selectedFile);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // 1. Immediate Heuristic Pre-fill from Filename
    const parsed = parseCertificateItemInfo(selectedFile.name, 'Sertifikat Pelatihan', 'Staff RSUD');
    const computedTitle = parsed.title;
    const computedRecipient = parsed.recipientName !== 'Staff RSUD' ? parsed.recipientName : '';
    
    if (!title) setTitle(computedTitle);
    if (!recipientName && computedRecipient) setRecipientName(computedRecipient);

    // 2. Immediate Metadata Category Recommendation based on file name & initial title
    const initialRecomms = recommendCategoriesFromMetadata(
      {
        title: computedTitle,
        recipientName: computedRecipient,
        fileName: selectedFile.name
      },
      certificates,
      availableCategories
    );

    if (initialRecomms.length > 0 && initialRecomms[0].score >= 35) {
      setCategory(initialRecomms[0].category);
    } else {
      setCategory(parsed.category);
    }

    // 3. Run AI OCR scan and automatic Gemini metadata suggestion
    try {
      setIsScanningSingle(true);
      const scanResult = await scanCertificateFile(selectedFile);
      
      let finalTitle = computedTitle;
      let finalRecipient = computedRecipient;
      let finalIssuer = issuer;
      let finalCategory = parsed.category;

      if (scanResult) {
        if (scanResult.recipientName) {
          setRecipientName(scanResult.recipientName);
          finalRecipient = scanResult.recipientName;
        }
        if (scanResult.title) {
          setTitle(scanResult.title);
          finalTitle = scanResult.title;
        }
        if (scanResult.issuer) {
          setIssuer(scanResult.issuer);
          finalIssuer = scanResult.issuer;
        }
        if (scanResult.category) {
          setCategory(scanResult.category);
          finalCategory = scanResult.category;
        }
        if (scanResult.issueDate) setIssueDate(scanResult.issueDate);
        if (scanResult.expiryDate) {
          setExpiryDate(scanResult.expiryDate);
          setHasExpiryDate(true);
        }
        if (scanResult.credentialId && !credentialId) setCredentialId(scanResult.credentialId);
        
        if (scanResult.suggestedTags && scanResult.suggestedTags.length > 0) {
          setAiSuggestedTags(scanResult.suggestedTags);
          setTags(prev => Array.from(new Set([...prev, ...scanResult.suggestedTags!])));
        }
        if (scanResult.extractedTextSummary) {
          setAiExtractedSummary(scanResult.extractedTextSummary);
        }

        setSingleScanSuccess(true);
        setScanSource(scanResult.source);
      }

      // 4. Automatic Category & Tag Recommendation Grounding with Gemini & Archive DB
      try {
        const aiSuggestion = await suggestCategoryAndTags({
          title: finalTitle,
          issuer: finalIssuer,
          recipientName: finalRecipient,
          currentCategory: finalCategory,
          fileName: selectedFile.name,
          existingCertificates: certificates
        });

        if (aiSuggestion.category) {
          setCategory(aiSuggestion.category);
        }
        if (aiSuggestion.suggestedTags && aiSuggestion.suggestedTags.length > 0) {
          setAiSuggestedTags(aiSuggestion.suggestedTags);
          setTags(prev => Array.from(new Set([...prev, ...aiSuggestion.suggestedTags])));
        }
        if (aiSuggestion.summary && !aiExtractedSummary) {
          setAiExtractedSummary(aiSuggestion.summary);
        }
      } catch (aiErr) {
        console.warn('Auto AI category suggestion fallback:', aiErr);
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
            const itemTags = res.suggestedTags && res.suggestedTags.length > 0 ? res.suggestedTags : [res.category || next[idx].category];
            next[idx] = {
              ...next[idx],
              recipientName: res.recipientName || next[idx].recipientName,
              title: res.title || next[idx].title,
              category: res.category || next[idx].category,
              issuer: res.issuer || next[idx].issuer,
              issueDate: res.issueDate || next[idx].issueDate,
              expiryDate: res.expiryDate || next[idx].expiryDate,
              suggestedTags: res.suggestedTags,
              tags: itemTags,
              extractedTextSummary: res.extractedTextSummary,
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
      const isValid = validMimes.includes(f.type) || /\.(pdf|jpg|jpeg|png|webp)$/i.test(f.name);
      if (isValid && f.size <= 30 * 1024 * 1024) {
        const fallbackTitle = batchCommonTitle.trim() || 'Sertifikat Pelatihan';
        const parsed = parseCertificateItemInfo(f.name, fallbackTitle, 'Peserta Diklat');
        const previewUrl = URL.createObjectURL(f);
        addedItems.push({
          file: f,
          previewUrl,
          title: batchCommonTitle.trim() ? batchCommonTitle.trim() : parsed.title,
          recipientName: parsed.recipientName,
          category: batchCommonCategory || parsed.category,
          suggestedTags: [parsed.category, 'Diklat RSUD'],
          tags: [parsed.category, 'Diklat RSUD'],
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
    const item = batchFiles[index];
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
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

  // Batch Upload Submit (Processes each file individually and creates separate records with real-time ETA telemetry)
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (batchFiles.length === 0) {
      setErrorMsg('Harap tambahkan minimal 1 file untuk diunggah.');
      return;
    }

    const totalFiles = batchFiles.length;
    const totalBytes = batchFiles.reduce((acc, curr) => acc + curr.file.size, 0);
    const startTime = Date.now();
    let accumulatedBytes = 0;

    try {
      setIsSubmitting(true);
      setBatchProgress({
        current: 0,
        total: totalFiles,
        currentFileName: batchFiles[0]?.file.name,
        currentRecipient: batchFiles[0]?.recipientName,
        bytesUploaded: 0,
        totalBytes,
        startTime,
        estimatedRemainingSec: totalFiles * 2.5,
        uploadSpeedKBs: 0,
        statusText: `Menyiapkan pengunggahan ${totalFiles} berkas ke Google Drive...`
      });

      const uploadedCerts: Certificate[] = [];

      for (let i = 0; i < batchFiles.length; i++) {
        const item = batchFiles[i];
        
        // Update state at start of each file
        const itemStartTime = Date.now();
        const elapsedTotalSec = Math.max(0.5, (Date.now() - startTime) / 1000);
        const currentSpeedKBs = accumulatedBytes > 0 ? (accumulatedBytes / 1024) / elapsedTotalSec : 250;
        const remainingBytes = Math.max(0, totalBytes - accumulatedBytes);
        const estimatedRemainingSec = currentSpeedKBs > 0 ? Math.ceil((remainingBytes / 1024) / currentSpeedKBs) : (totalFiles - i) * 2;

        setBatchProgress({
          current: i,
          total: totalFiles,
          currentFileName: item.file.name,
          currentRecipient: item.recipientName,
          bytesUploaded: accumulatedBytes,
          totalBytes,
          startTime,
          estimatedRemainingSec,
          uploadSpeedKBs: currentSpeedKBs,
          statusText: `Mengunggah berkas ${i + 1} dari ${totalFiles}: "${item.file.name}"...`
        });

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
        
        const itemTags = item.tags && item.tags.length > 0 
          ? item.tags 
          : (item.suggestedTags && item.suggestedTags.length > 0 ? item.suggestedTags : ['Batch Multi-File', item.category]);
        formData.append('tags', JSON.stringify(itemTags));

        const resCert = await uploadCertificate(formData);
        uploadedCerts.push(resCert);
        
        accumulatedBytes += item.file.size;
        const nowElapsedSec = Math.max(0.5, (Date.now() - startTime) / 1000);
        const updatedSpeedKBs = (accumulatedBytes / 1024) / nowElapsedSec;
        const updatedRemainingBytes = Math.max(0, totalBytes - accumulatedBytes);
        const updatedRemainingSec = (totalFiles - (i + 1) === 0) ? 0 : Math.ceil((updatedRemainingBytes / 1024) / (updatedSpeedKBs || 250));

        setBatchProgress({
          current: i + 1,
          total: totalFiles,
          currentFileName: i + 1 < totalFiles ? batchFiles[i + 1]?.file.name : item.file.name,
          currentRecipient: i + 1 < totalFiles ? batchFiles[i + 1]?.recipientName : item.recipientName,
          bytesUploaded: accumulatedBytes,
          totalBytes,
          startTime,
          estimatedRemainingSec: updatedRemainingSec,
          uploadSpeedKBs: updatedSpeedKBs,
          statusText: i + 1 === totalFiles 
            ? 'Semua berkas selesai diunggah! Menyelesaikan...' 
            : `Selesai ${i + 1}/${totalFiles}. Menyiapkan berkas berikutnya...`
        });
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

  const filteredBatchFiles = batchSearchTerm.trim() 
    ? batchFiles.filter(b => 
        b.file.name.toLowerCase().includes(batchSearchTerm.toLowerCase()) || 
        b.recipientName.toLowerCase().includes(batchSearchTerm.toLowerCase()) ||
        b.title.toLowerCase().includes(batchSearchTerm.toLowerCase())
      )
    : batchFiles;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="modal-upload-cert-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-colors"
        >
          <motion.div 
            key="modal-upload-cert-card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            id="modal-upload-certificate"
            className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 transition-all my-6 max-h-[92vh] flex flex-col ${
              uploadMode === 'batch' ? 'max-w-6xl' : 'max-w-2xl'
            }`}
          >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Unggah Sertifikat Diklat RSUD</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {uploadMode === 'batch' 
                  ? 'Unggah banyak berkas sekaligus — nama otomatis terbaca & dibuatkan kolom per orang'
                  : 'Unggah berkas sertifikat tunggal dengan verifikasi data lengkap'}
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
              <span className="flex items-center gap-1.5">
                <span>Unggah Banyak File Sekaligus (Batch Kolom Nama)</span>
                {batchFiles.length > 0 && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                    {batchFiles.length} file
                  </span>
                )}
              </span>
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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Kategori <span className="text-rose-500">*</span>
                    </label>
                    {onOpenCategoryManager && (
                      <button
                        type="button"
                        onClick={onOpenCategoryManager}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                      >
                        + Kelola
                      </button>
                    )}
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {availableCategories.map((catName, idx) => (
                      <option key={`single-cat-${catName}-${idx}`} value={catName}>{catName}</option>
                    ))}
                  </select>

                  {/* Metadata-driven quick category recommendation pills */}
                  {singleCategoryRecommendations.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-semibold">
                          <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                          Saran Metadata:
                        </span>
                        {topCategoryRecommendation && topCategoryRecommendation.category !== category && (
                          <button
                            type="button"
                            onClick={() => setCategory(topCategoryRecommendation.category)}
                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Gunakan Saran
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {singleCategoryRecommendations.slice(0, 3).map((rec, rIdx) => {
                          const isCurrent = category === rec.category;
                          return (
                            <button
                              key={`single-rec-${rec.category}-${rIdx}`}
                              type="button"
                              onClick={() => setCategory(rec.category)}
                              title={rec.reasons.join(' • ')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300 dark:ring-indigo-700'
                                  : rec.score >= 60
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                              }`}
                            >
                              <span>{rec.category}</span>
                              <span className={`text-[9px] px-1 rounded-full ${
                                isCurrent 
                                  ? 'bg-indigo-700 text-indigo-100' 
                                  : rec.score >= 60 
                                  ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' 
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}>
                                {rec.score}%
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {topCategoryRecommendation && topCategoryRecommendation.reasons.length > 0 && (
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-400 italic line-clamp-1" title={topCategoryRecommendation.reasons.join(', ')}>
                          💡 {topCategoryRecommendation.reasons[0]}
                        </p>
                      )}
                    </div>
                  )}
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
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => handleSetExpiryPreset(1)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-600 dark:hover:text-teal-300 cursor-pointer"
                      >
                        1 Thn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetExpiryPreset(2)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-600 dark:hover:text-teal-300 cursor-pointer"
                      >
                        2 Thn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetExpiryPreset(3)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-600 dark:hover:text-teal-300 cursor-pointer"
                      >
                        3 Thn (Medis)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetExpiryPreset(4)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-600 dark:hover:text-teal-300 cursor-pointer"
                      >
                        4 Thn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetExpiryPreset(5)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-600 dark:hover:text-teal-300 cursor-pointer"
                      >
                        5 Thn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetExpiryPreset(10)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-600 dark:hover:text-teal-300 cursor-pointer"
                      >
                        10 Thn
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

              {/* Gemini AI Category & Tags Section */}
              <div className="p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/40 dark:from-slate-850 dark:via-slate-850 dark:to-indigo-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        Rekomendasi Kategori & Tag Gemini AI
                        {scanSource === 'ai_vision' && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-semibold">
                            AI OCR Aktif
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        AI menganalisis isi sertifikat untuk menentukan kategori yang tepat dan membuat tag relevan.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerAISuggestions}
                    disabled={isRequestingAISuggestions || (!title && !recipientName && !file)}
                    className="px-2.5 py-1 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Minta AI Gemini untuk menganalisis ulang teks dan memberikan rekomendasi baru"
                  >
                    {isRequestingAISuggestions ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Menganalisis...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        <span>Saran AI Ulang</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Top Metadata Category Match Analysis Box */}
                {topCategoryRecommendation && (
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Kategori Terpilih:
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                          {category}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {topCategoryRecommendation.score}% Relevansi Metadata
                      </span>
                    </div>

                    {topCategoryRecommendation.reasons.length > 0 && (
                      <div className="text-[10.5px] text-slate-600 dark:text-slate-300 space-y-0.5">
                        {topCategoryRecommendation.reasons.map((reason, rIdx) => (
                          <p key={`reason-line-${rIdx}`} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{reason}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Extracted Summary (if present) */}
                {aiExtractedSummary && (
                  <div className="text-[11px] bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-1">Ringkasan Dokumen:</span>
                    {aiExtractedSummary}
                  </div>
                )}

                {/* Suggested Tags from Gemini */}
                {aiSuggestedTags.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Tag yang Disarankan AI (Klik untuk memilih):
                      </span>
                      <button
                        type="button"
                        onClick={handleAddAllSuggestedTags}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                      >
                        + Gunakan Semua Tag AI
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {aiSuggestedTags.map((st, sIdx) => {
                        const isSelected = tags.includes(st);
                        return (
                          <button
                            key={`suggested-tag-${st}-${sIdx}`}
                            type="button"
                            onClick={() => handleToggleSuggestedTag(st)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                            }`}
                          >
                            {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-indigo-500" />}
                            <span>{st}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Tags & Custom Tag Input */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Tag Sertifikat yang Terpasang:
                  </label>
                  
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {tags.map((t, tIdx) => (
                        <span
                          key={`active-tag-${t}-${tIdx}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                        >
                          <Tag className="w-3 h-3 text-indigo-500" />
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="text-indigo-400 hover:text-rose-600 dark:hover:text-rose-400 ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
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
                      placeholder="Tambah tag manual (tekan Enter)..."
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag()}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      + Tambah Tag
                    </button>
                  </div>
                </div>
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
              
              {/* Batch Settings Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                      Pengaturan Pelatihan Bersama (Batch)
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoScanEnabled}
                      onChange={(e) => setAutoScanEnabled(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Otomatis Baca Nama & Format Gelar</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Judul Pelatihan Bersama
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={batchCommonTitle}
                        onChange={(e) => setBatchCommonTitle(e.target.value)}
                        placeholder="Contoh: Pelatihan Bantuan Hidup Dasar (BHD)"
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCommonTitleToAll}
                        title="Terapkan judul ini ke semua baris berkas di bawah"
                        className="px-2.5 py-1.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-200 cursor-pointer shrink-0"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Penyelenggara / Penerbit
                    </label>
                    <input
                      type="text"
                      value={batchIssuer}
                      onChange={(e) => setBatchIssuer(e.target.value)}
                      placeholder="Diklat RSUD dr. H. Jusuf SK"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Masa Berlaku
                      </label>
                      <select
                        value={batchValidityYears}
                        onChange={(e) => setBatchValidityYears(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value={1}>1 Tahun</option>
                        <option value={2}>2 Tahun</option>
                        <option value={3}>3 Tahun (Medis)</option>
                        <option value={4}>4 Tahun</option>
                        <option value={5}>5 Tahun</option>
                        <option value={10}>10 Tahun</option>
                        <option value={0}>Seumur Hidup</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                          Kategori Bersama
                        </label>
                        {topBatchRecommendation && topBatchRecommendation.category !== batchCommonCategory && (
                          <button
                            type="button"
                            onClick={() => handleApplyCommonCategoryToAll(topBatchRecommendation.category)}
                            className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                            title={`Gunakan saran kategori: ${topBatchRecommendation.category} (${topBatchRecommendation.score}% relevan)`}
                          >
                            <Lightbulb className="w-2.5 h-2.5 text-amber-500" />
                            Gunakan {topBatchRecommendation.category}
                          </button>
                        )}
                      </div>
                      <select
                        value={batchCommonCategory}
                        onChange={(e) => handleApplyCommonCategoryToAll(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {availableCategories.map((catName, idx) => (
                          <option key={`batch-common-cat-${catName}-${idx}`} value={catName}>{catName}</option>
                        ))}
                      </select>
                      {topBatchRecommendation && (
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 truncate" title={topBatchRecommendation.reasons.join(', ')}>
                          💡 Saran: <strong className="text-indigo-600 dark:text-indigo-400">{topBatchRecommendation.category}</strong> ({topBatchRecommendation.score}% relevan)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Batch Dropzone & Folder Upload */}
              <div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const items = e.dataTransfer.items;
                    const collectedFiles: File[] = [];
                    if (items && items.length > 0) {
                      for (let i = 0; i < items.length; i++) {
                        const entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
                        if (entry) {
                          await traverseFileTree(entry, collectedFiles);
                        } else {
                          const file = items[i].getAsFile();
                          if (file) collectedFiles.push(file);
                        }
                      }
                    } else if (e.dataTransfer.files) {
                      collectedFiles.push(...(Array.from(e.dataTransfer.files) as File[]));
                    }
                    if (collectedFiles.length > 0) {
                      handleBatchFilesAdd(collectedFiles);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
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
                  <input
                    ref={folderInputRef}
                    type="file"
                    // @ts-ignore
                    webkitdirectory=""
                    directory=""
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleBatchFilesAdd(e.target.files);
                      }
                    }}
                  />

                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
                      <Files className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        Tarik & lepas satu folder penuh, atau pilih berkas sertifikat secara instan
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Format nama seperti <span className="font-mono text-indigo-600 dark:text-indigo-400">Sertifikat_Tri_Mulyani_S_A_P.png</span> langsung terbaca otomatis beserta pratinjaunya.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                      <button
                        type="button"
                        onClick={() => batchFileInputRef.current?.click()}
                        className="px-4 py-2 text-xs font-black rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Pilih Berkas File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => folderInputRef.current?.click()}
                        className="px-4 py-2 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <Files className="w-4 h-4" />
                        <span>Pilih Satu Folder</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Batch Table / Editable Columns Grid */}
              {batchFiles.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-0">
                  {/* Table Toolbar */}
                  <div className="p-3.5 bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        Daftar Berkas Terdeteksi ({batchFiles.length} Peserta)
                      </span>
                      {isScanningBatch && (
                        <span className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-100 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-full animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Memindai nama peserta...
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {batchFiles.length > 5 && (
                        <input
                          type="text"
                          value={batchSearchTerm}
                          onChange={(e) => setBatchSearchTerm(e.target.value)}
                          placeholder="Cari nama peserta / file..."
                          className="px-2.5 py-1 text-[11px] border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      )}
                      <button
                        type="button"
                        onClick={handleApplyAutoCategoryRecommendationsToAllBatch}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer border border-emerald-200 dark:border-emerald-800/50"
                        title="Cocokkan kategori tiap baris berkas secara otomatis berdasarkan metadata arsip"
                      >
                        <Wand2 className="w-3 h-3 text-emerald-600" />
                        <span>Auto-Kategori Semua Baris</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => batchFileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Berkas Lagi</span>
                      </button>
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
                        onClick={() => {
                          batchFiles.forEach(item => {
                            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
                          });
                          setBatchFiles([]);
                        }}
                        className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer px-1"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>

                  {/* The Columns Table */}
                  <div className="max-h-80 overflow-y-auto overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[760px]">
                      <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3 w-52">Berkas Dokumen</th>
                          <th className="py-2.5 px-3 min-w-[200px]">Kolom Nama Peserta <span className="text-rose-500">*</span></th>
                          <th className="py-2.5 px-3 min-w-[180px]">Kolom Judul Sertifikat</th>
                          <th className="py-2.5 px-3 w-28">Kategori</th>
                          <th className="py-2.5 px-3 min-w-[150px]">Tag AI / Label</th>
                          <th className="py-2.5 px-3 w-24 text-center">Status</th>
                          <th className="py-2.5 px-3 w-10 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {filteredBatchFiles.map((item, idx) => {
                          const originalIdx = batchFiles.indexOf(item);
                          const isImage = item.file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(item.file.name);
                          const isPdf = item.file.type.includes('pdf') || /\.pdf$/i.test(item.file.name);
                          const currentItemTags = item.tags || item.suggestedTags || [item.category];

                          return (
                            <tr key={`batch-row-${item.file?.name || 'item'}-${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              {/* No */}
                              <td className="py-2 px-3 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>

                              {/* File name & info */}
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  {isImage ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreviewModalFile({ file: item.file, name: item.file.name, url: item.previewUrl });
                                      }}
                                      className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 hover:scale-105 transition-transform cursor-pointer relative group"
                                      title="Klik untuk pratinjau gambar sertifikat"
                                    >
                                      <img
                                        src={item.previewUrl}
                                        alt={item.file.name}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                                        Lihat
                                      </div>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreviewModalFile({ file: item.file, name: item.file.name, url: item.previewUrl });
                                      }}
                                      className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0 text-[9px] font-bold border border-slate-200 dark:border-slate-700 cursor-pointer hover:scale-105 transition-transform ${
                                        isPdf ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                                      }`}
                                      title="Klik untuk pratinjau berkas"
                                    >
                                      <FileText className="w-4 h-4 mb-0.5" />
                                      <span>{isPdf ? 'PDF' : 'DOC'}</span>
                                    </button>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-medium text-slate-900 dark:text-slate-200 truncate max-w-[170px] text-[11px]" title={item.file.name}>
                                      {item.file.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {(item.file.size / 1024).toFixed(0)} KB • <button type="button" onClick={() => {
                                        setPreviewModalFile({ file: item.file, name: item.file.name, url: item.previewUrl });
                                      }} className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer">Pratinjau</button>
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Recipient Name Column */}
                              <td className="py-2 px-3">
                                <div className="relative">
                                  <input
                                    type="text"
                                    required
                                    value={item.recipientName}
                                    onChange={(e) => handleBatchItemChange(originalIdx, 'recipientName', e.target.value)}
                                    placeholder="Nama Peserta"
                                    className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              </td>

                              {/* Title Column */}
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => handleBatchItemChange(originalIdx, 'title', e.target.value)}
                                  placeholder="Judul Sertifikat"
                                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                                />
                              </td>

                              {/* Category */}
                              <td className="py-2 px-3">
                                <select
                                  value={item.category}
                                  onChange={(e) => handleBatchItemChange(originalIdx, 'category', e.target.value)}
                                  className="w-full px-2 py-1.5 text-[11px] border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                                >
                                  {availableCategories.map((catName, cIdx) => (
                                    <option key={`batch-row-cat-${catName}-${cIdx}`} value={catName}>{catName}</option>
                                  ))}
                                </select>
                              </td>

                              {/* Tag AI / Label Column */}
                              <td className="py-2 px-3">
                                <div className="flex flex-wrap gap-1 items-center max-w-[200px]">
                                  {currentItemTags.slice(0, 3).map((t, tIdx) => (
                                    <span
                                      key={`batch-tag-${idx}-${t}-${tIdx}`}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 truncate max-w-[90px]"
                                      title={t}
                                    >
                                      {t}
                                    </span>
                                  ))}
                                  {currentItemTags.length > 3 && (
                                    <span className="text-[9px] text-slate-400 font-medium">
                                      +{currentItemTags.length - 3}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-2 px-3 text-center">
                                {item.isScanning ? (
                                  <span className="text-[10px] text-indigo-600 font-bold flex items-center justify-center gap-1 animate-pulse">
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    Membaca...
                                  </span>
                                ) : item.scannedSource === 'ai_vision' ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    AI Terbaca
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    Nama Terbaca
                                  </span>
                                )}
                              </td>

                              {/* Delete */}
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBatchItem(originalIdx)}
                                  title="Hapus baris ini"
                                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary footer within table */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Total: <strong className="text-slate-900 dark:text-white">{batchFiles.length} Sertifikat</strong> akan disimpan ke arsip RSUD dr. H. Jusuf SK.
                    </span>
                    <span className="text-[11px]">
                      Penerbit: <strong className="text-slate-800 dark:text-slate-200">{batchIssuer}</strong> | Masa Berlaku: <strong className="text-slate-800 dark:text-slate-200">{batchValidityYears > 0 ? `${batchValidityYears} Tahun` : 'Seumur Hidup'}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Detailed Progress Bar & Estimation Box */}
              <BatchUploadProgressBar
                progress={batchProgress}
                isSubmitting={isSubmitting}
              />

              {/* Submit Batch */}
              <button
                type="submit"
                disabled={isSubmitting || batchFiles.length === 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-950/60 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>
                      Mengunggah & Menyimpan {batchProgress?.current || 0} dari {batchProgress?.total || batchFiles.length} Berkas Sertifikat...
                    </span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>
                      {batchFiles.length > 0 
                        ? `Unggah & Simpan Semua ${batchFiles.length} Sertifikat Sekarang`
                        : 'Pilih Berkas Terlebih Dahulu'}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Sistem Arsip & Verifikasi Sertifikat Diklat RSUD dr. H. Jusuf SK
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

          </motion.div>
        </motion.div>
      )}

      {/* Preview Lightbox Modal */}
      {previewModalFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-md">
                    Pratinjau: {previewModalFile.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {(previewModalFile.file.size / (1024 * 1024)).toFixed(2)} MB • {previewModalFile.file.type || 'Dokumen'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalFile(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-auto bg-slate-950/5 flex items-center justify-center">
              {(() => {
                const isPreviewImage = previewModalFile.file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(previewModalFile.name);
                const isPreviewPdf = previewModalFile.file.type.includes('pdf') || /\.pdf$/i.test(previewModalFile.name);
                return isPreviewImage && previewModalFile.url ? (
                  <img
                    src={previewModalFile.url}
                    alt={previewModalFile.name}
                    className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-200 dark:border-slate-800"
                  />
                ) : isPreviewPdf && previewModalFile.url ? (
                  <iframe
                    src={previewModalFile.url}
                    title={previewModalFile.name}
                    className="w-full h-[60vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                  />
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Pratinjau langsung tidak tersedia untuk format file ini.
                    </p>
                    <p className="text-xs text-slate-500">
                      Berkas siap diunggah dan disimpan ke Google Drive.
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewModalFile(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
