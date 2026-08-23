import React from 'react';
import { 
  Award, Briefcase, Sparkles, GraduationCap, Shield, FileCheck, Tag, 
  BookOpen, Star, Bookmark, Stethoscope, HeartHandshake, Layers, 
  CheckCircle, Lightbulb, Compass, Trophy
} from 'lucide-react';
import { CategoryItem } from '../types';

export interface CategoryColorTheme {
  bg: string;
  text: string;
  border: string;
  dot: string;
  hover: string;
  active: string;
  pillBg: string;
  pillText: string;
  badge: string;
}

export const COLOR_OPTIONS = [
  { id: 'indigo', name: 'Indigo', hex: '#6366f1', bgClass: 'bg-indigo-500' },
  { id: 'emerald', name: 'Emerald', hex: '#10b981', bgClass: 'bg-emerald-500' },
  { id: 'amber', name: 'Amber', hex: '#f59e0b', bgClass: 'bg-amber-500' },
  { id: 'blue', name: 'Biru', hex: '#3b82f6', bgClass: 'bg-blue-500' },
  { id: 'purple', name: 'Ungu', hex: '#a855f7', bgClass: 'bg-purple-500' },
  { id: 'rose', name: 'Rose', hex: '#f43f5e', bgClass: 'bg-rose-500' },
  { id: 'teal', name: 'Teal', hex: '#14b8a6', bgClass: 'bg-teal-500' },
  { id: 'cyan', name: 'Cyan', hex: '#06b6d4', bgClass: 'bg-cyan-500' },
  { id: 'orange', name: 'Oranye', hex: '#f97316', bgClass: 'bg-orange-500' },
  { id: 'violet', name: 'Violet', hex: '#8b5cf6', bgClass: 'bg-violet-500' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', bgClass: 'bg-pink-500' },
  { id: 'slate', name: 'Slate', hex: '#64748b', bgClass: 'bg-slate-500' },
];

export const ICON_OPTIONS = [
  { id: 'Award', label: 'Piala / Prestasi', icon: Award },
  { id: 'Briefcase', label: 'Pelatihan / Diklat', icon: Briefcase },
  { id: 'Sparkles', label: 'Workshop / Kreatif', icon: Sparkles },
  { id: 'GraduationCap', label: 'Akademik / Ijazah', icon: GraduationCap },
  { id: 'Shield', label: 'Penghargaan / Lisensi', icon: Shield },
  { id: 'FileCheck', label: 'Kelulusan / Uji Kompetensi', icon: FileCheck },
  { id: 'Stethoscope', label: 'Medis / Kesehatan', icon: Stethoscope },
  { id: 'BookOpen', label: 'Edukasi / Jurnal', icon: BookOpen },
  { id: 'Trophy', label: 'Kejuaraan', icon: Trophy },
  { id: 'Star', label: 'Bintang / Spesial', icon: Star },
  { id: 'HeartHandshake', label: 'Sosial / Relawan', icon: HeartHandshake },
  { id: 'CheckCircle', label: 'Verifikasi', icon: CheckCircle },
  { id: 'Layers', label: 'Modul / Paket', icon: Layers },
  { id: 'Bookmark', label: 'Favorit', icon: Bookmark },
  { id: 'Lightbulb', label: 'Inovasi', icon: Lightbulb },
  { id: 'Tag', label: 'Kategori Umum', icon: Tag },
];

const COLOR_THEMES: Record<string, CategoryColorTheme> = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    text: 'text-indigo-800 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800/80',
    dot: 'bg-indigo-500',
    hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/50',
    active: 'bg-indigo-600 text-white',
    pillBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    pillText: 'text-indigo-700 dark:text-indigo-300',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/80',
    dot: 'bg-emerald-500',
    hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
    active: 'bg-emerald-600 text-white',
    pillBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    pillText: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-900 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/80',
    dot: 'bg-amber-500',
    hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/50',
    active: 'bg-amber-600 text-white',
    pillBg: 'bg-amber-50 dark:bg-amber-950/40',
    pillText: 'text-amber-800 dark:text-amber-300',
    badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800/80',
    dot: 'bg-blue-500',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/50',
    active: 'bg-blue-600 text-white',
    pillBg: 'bg-blue-50 dark:bg-blue-950/40',
    pillText: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800/80',
    dot: 'bg-purple-500',
    hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/50',
    active: 'bg-purple-600 text-white',
    pillBg: 'bg-purple-50 dark:bg-purple-950/40',
    pillText: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/80',
    dot: 'bg-rose-500',
    hover: 'hover:bg-rose-100 dark:hover:bg-rose-900/50',
    active: 'bg-rose-600 text-white',
    pillBg: 'bg-rose-50 dark:bg-rose-950/40',
    pillText: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/50',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800/80',
    dot: 'bg-teal-500',
    hover: 'hover:bg-teal-100 dark:hover:bg-teal-900/50',
    active: 'bg-teal-600 text-white',
    pillBg: 'bg-teal-50 dark:bg-teal-950/40',
    pillText: 'text-teal-700 dark:text-teal-300',
    badge: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800'
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/50',
    text: 'text-cyan-800 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800/80',
    dot: 'bg-cyan-500',
    hover: 'hover:bg-cyan-100 dark:hover:bg-cyan-900/50',
    active: 'bg-cyan-600 text-white',
    pillBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    pillText: 'text-cyan-700 dark:text-cyan-300',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/50',
    text: 'text-orange-900 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800/80',
    dot: 'bg-orange-500',
    hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/50',
    active: 'bg-orange-600 text-white',
    pillBg: 'bg-orange-50 dark:bg-orange-950/40',
    pillText: 'text-orange-800 dark:text-orange-300',
    badge: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800'
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/50',
    text: 'text-violet-800 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800/80',
    dot: 'bg-violet-500',
    hover: 'hover:bg-violet-100 dark:hover:bg-violet-900/50',
    active: 'bg-violet-600 text-white',
    pillBg: 'bg-violet-50 dark:bg-violet-950/40',
    pillText: 'text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800'
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-950/50',
    text: 'text-pink-800 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-800/80',
    dot: 'bg-pink-500',
    hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/50',
    active: 'bg-pink-600 text-white',
    pillBg: 'bg-pink-50 dark:bg-pink-950/40',
    pillText: 'text-pink-700 dark:text-pink-300',
    badge: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800'
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800/70',
    text: 'text-slate-800 dark:text-slate-200',
    border: 'border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-500',
    hover: 'hover:bg-slate-200 dark:hover:bg-slate-700',
    active: 'bg-slate-700 text-white',
    pillBg: 'bg-slate-100 dark:bg-slate-800',
    pillText: 'text-slate-700 dark:text-slate-300',
    badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  }
};

const DEFAULT_CATEGORY_COLOR_MAP: Record<string, string> = {
  'Prestasi': 'amber',
  'Pelatihan': 'indigo',
  'Workshop': 'emerald',
  'Akademik': 'blue',
  'Penghargaan': 'purple',
  'Kelulusan': 'teal',
  'Lainnya': 'slate'
};

export function getCategoryTheme(categoryName: string, customCategories?: CategoryItem[]): CategoryColorTheme {
  let colorKey = 'indigo';

  if (customCategories && customCategories.length > 0) {
    const found = customCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    if (found && found.color && COLOR_THEMES[found.color]) {
      colorKey = found.color;
      return COLOR_THEMES[colorKey];
    }
  }

  if (DEFAULT_CATEGORY_COLOR_MAP[categoryName]) {
    colorKey = DEFAULT_CATEGORY_COLOR_MAP[categoryName];
  } else {
    // Generate deterministic color based on string hash for unknown custom categories
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorKeys = Object.keys(COLOR_THEMES);
    const index = Math.abs(hash) % colorKeys.length;
    colorKey = colorKeys[index];
  }

  return COLOR_THEMES[colorKey] || COLOR_THEMES.indigo;
}

export function getCategoryIcon(iconName?: string) {
  const found = ICON_OPTIONS.find(i => i.id === iconName);
  return found ? found.icon : Tag;
}
