import React, { useState } from 'react';
import { 
  X, Plus, Edit2, Trash2, RotateCcw, Check, Sparkles, FolderKanban, 
  Tag, Info, AlertTriangle, CheckCircle2, ChevronRight, Hash, Layers
} from 'lucide-react';
import { CategoryItem, Certificate } from '../types';
import { 
  COLOR_OPTIONS, 
  ICON_OPTIONS, 
  getCategoryTheme, 
  getCategoryIcon 
} from '../utils/categoryColors';
import { 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  resetCategories 
} from '../services/api';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  certificates: Certificate[];
  onCategoriesChange: () => void;
  onSelectCategoryFilter?: (categoryName: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories = [],
  certificates = [],
  onCategoriesChange,
  onSelectCategoryFilter
}) => {
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [selectedIcon, setSelectedIcon] = useState('Award');
  
  // Status & Confirmation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [fallbackCategory, setFallbackCategory] = useState('Lainnya');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const safeCertificates = Array.isArray(certificates) ? certificates : [];

  // Compute live certificate counts for each category
  const usageCountMap: Record<string, number> = {};
  safeCertificates.forEach(c => {
    if (c?.category) {
      usageCountMap[c.category] = (usageCountMap[c.category] || 0) + 1;
    }
  });

  const handleStartCreate = () => {
    setIsEditing(true);
    setEditingId(null);
    setCategoryName('');
    setCategoryDescription('');
    setSelectedColor('indigo');
    setSelectedIcon('Award');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setIsEditing(true);
    setEditingId(cat.id);
    setCategoryName(cat.name);
    setCategoryDescription(cat.description || '');
    setSelectedColor(cat.color || 'indigo');
    setSelectedIcon(cat.icon || 'Award');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setCategoryName('');
    setCategoryDescription('');
    setErrorMsg(null);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setErrorMsg('Nama kategori wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (editingId) {
        // Update existing category
        await updateCategory(editingId, {
          name: categoryName.trim(),
          description: categoryDescription.trim() || undefined,
          color: selectedColor,
          icon: selectedIcon
        });
        setSuccessMsg(`Kategori "${categoryName.trim()}" berhasil diperbarui!`);
      } else {
        // Create new category
        await createCategory({
          name: categoryName.trim(),
          description: categoryDescription.trim() || undefined,
          color: selectedColor,
          icon: selectedIcon
        });
        setSuccessMsg(`Kategori baru "${categoryName.trim()}" berhasil ditambahkan!`);
      }

      onCategoriesChange();
      setIsEditing(false);
      setEditingId(null);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      setIsDeleting(true);
      const res = await deleteCategory(deletingCategory.id, fallbackCategory);
      setSuccessMsg(res.message || `Kategori "${deletingCategory.name}" berhasil dihapus.`);
      setDeletingCategory(null);
      onCategoriesChange();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Gagal menghapus kategori: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetToDefault = async () => {
    const confirmReset = window.confirm(
      'Apakah Anda yakin ingin me-reset daftar kategori ke pengaturan awal bawaan sistem? Kategori kustom akan dihapus.'
    );
    if (!confirmReset) return;

    try {
      setIsResetting(true);
      await resetCategories();
      setSuccessMsg('Kategori berhasil di-reset ke standar sistem.');
      onCategoriesChange();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Gagal me-reset kategori: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const previewTheme = getCategoryTheme(categoryName || 'Contoh Kategori', [{ id: 'preview', name: categoryName || 'Contoh Kategori', color: selectedColor, createdAt: '', updatedAt: '' }]);
  const PreviewIconComponent = getCategoryIcon(selectedIcon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="category-manager-modal" 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shadow-xs">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Manajemen Kategori Sertifikat
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  {categories.length} Kategori
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kelola kategori sertifikat untuk organisasi data yang lebih terstruktur
              </p>
            </div>
          </div>
          <button
            id="btn-close-category-manager"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Create / Edit Form View */}
          {isEditing ? (
            <form onSubmit={handleSubmitForm} className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {editingId ? 'Edit Kategori Sertifikat' : 'Tambah Kategori Sertifikat Baru'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
                >
                  Kembali ke Daftar
                </button>
              </div>

              {/* Live Preview Badge */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Pratinjau Tampilan Badge &amp; Tombol
                </span>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Category Pill Tag */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${previewTheme.bg} ${previewTheme.text} ${previewTheme.border}`}>
                    <PreviewIconComponent className="w-3.5 h-3.5 shrink-0" />
                    <span>{categoryName.trim() || 'Nama Kategori'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/5 dark:bg-white/10 font-black">
                      3
                    </span>
                  </span>

                  {/* Active Filter Pill Simulation */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs">
                    <PreviewIconComponent className="w-3.5 h-3.5" />
                    <span>{categoryName.trim() || 'Nama Kategori'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-500 text-white font-black">
                      3
                    </span>
                  </span>
                </div>
              </div>

              {/* Category Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Nama Kategori <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-slate-400">Maks. 30 karakter</span>
                </label>
                <input
                  id="input-category-name"
                  type="text"
                  required
                  maxLength={30}
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Contoh: Webinar Medis, Uji Lisensi, Magang Klinis..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              {/* Category Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Deskripsi / Keterangan Kategori <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  id="input-category-desc"
                  rows={2}
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Penjelasan singkat tujuan atau jenis sertifikat dalam kategori ini..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
                />
              </div>

              {/* Color Picker Palette */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Pilih Warna Tema Badge
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {COLOR_OPTIONS.map(c => {
                    const isSelected = selectedColor === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm ring-2 ring-indigo-500/40'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full shrink-0 ${c.bgClass}`} />
                        <span className="truncate text-[11px]">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Selector Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Pilih Ikon Visual
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {ICON_OPTIONS.map(opt => {
                    const IconComp = opt.icon;
                    const isSelected = selectedIcon === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedIcon(opt.id)}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                        title={opt.label}
                      >
                        <IconComp className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                        <span className="truncate text-[11px] text-left">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-save-category"
                  type="submit"
                  disabled={isSubmitting || !categoryName.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-100 dark:shadow-indigo-950/50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambahkan Kategori')}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Category List View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Daftar Kategori Tersedia ({categories.length})
                  </h4>
                </div>
                <button
                  id="btn-add-new-category"
                  type="button"
                  onClick={handleStartCreate}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Kategori Baru</span>
                </button>
              </div>

              {/* Categories Cards */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-850">
                {categories.map(cat => {
                  const theme = getCategoryTheme(cat.name, categories);
                  const IconComp = getCategoryIcon(cat.icon);
                  const certCount = usageCountMap[cat.name] || 0;

                  return (
                    <div 
                      key={cat.id} 
                      className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${theme.bg} ${theme.border}`}>
                          <IconComp className={`w-4 h-4 ${theme.text}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {cat.name}
                            </span>
                            
                            {/* Badge */}
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${theme.bg} ${theme.text} ${theme.border}`}>
                              {cat.color || 'indigo'}
                            </span>

                            {/* Default flag */}
                            {cat.isDefault && (
                              <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                                Bawaan
                              </span>
                            )}
                          </div>
                          
                          {cat.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {cat.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              {certCount} sertifikat terdaftar
                            </span>
                            {onSelectCategoryFilter && certCount > 0 && (
                              <>
                                <span>•</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectCategoryFilter(cat.name);
                                    onClose();
                                  }}
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                                >
                                  Tampilkan di Tabel &rarr;
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                          title="Edit Kategori"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingCategory(cat);
                            // Set fallback category to something other than the deleted one
                            const other = categories.find(c => c.id !== cat.id);
                            setFallbackCategory(other ? other.name : 'Lainnya');
                          }}
                          className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reset to defaults helper */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Kategori kustom tersimpan dan tersinkronisasi otomatis.</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  disabled={isResetting}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ke Standar</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Delete Confirmation Modal Layer */}
        {deletingCategory && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Kategori "{deletingCategory.name}"?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {(usageCountMap[deletingCategory.name] || 0) > 0 ? (
                    <>
                      Terdapat <strong className="text-slate-800 dark:text-slate-200">{usageCountMap[deletingCategory.name]} sertifikat</strong> yang saat ini menggunakan kategori ini. Silakan pilih kategori pengalihan (*fallback*) agar data sertifikat tetap terkelompok rapi:
                    </>
                  ) : (
                    'Kategori ini belum digunakan oleh sertifikat manapun dan aman untuk dihapus.'
                  )}
                </p>
              </div>

              {/* Reassignment Dropdown if certificates exist */}
              {(usageCountMap[deletingCategory.name] || 0) > 0 && (
                <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                    Alihkan sertifikat tersebut ke kategori:
                  </label>
                  <select
                    value={fallbackCategory}
                    onChange={(e) => setFallbackCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold"
                  >
                    {categories
                      .filter(c => c.id !== deletingCategory.id)
                      .map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Menghapus...' : 'Konfirmasi Hapus'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
