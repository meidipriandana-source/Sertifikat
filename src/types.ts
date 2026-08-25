export type CertificateCategory = string;

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  color: string; // e.g. 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'teal' | 'cyan' | 'orange' | 'slate'
  icon?: string; // e.g. 'Award' | 'GraduationCap' | 'BookOpen' | 'Briefcase' | 'Sparkles' | 'Shield' | 'Tag' | 'Stethoscope'
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  title: string;
  recipientName: string;
  recipientEmail?: string;
  issueDate: string;
  expiryDate?: string; // Masa berlaku sertifikat (ISO Date: YYYY-MM-DD or undefined/empty for seumur hidup)
  issuer: string;
  category: CertificateCategory;
  description?: string;
  credentialId?: string;
  tags?: string[];
  
  // Google Drive Metadata
  driveFileId: string;
  driveFolderId?: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  
  // File details
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpiryStatus = 'lifetime' | 'valid' | 'expiring_soon' | 'expired';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface CertificateStats {
  totalCertificates: number;
  totalRecipients: number;
  totalStorageBytes: number;
  categoryDistribution: Record<string, number>;
  monthlyTrends: { month: string; count: number }[];
  expiringSoonCount?: number;
  expiredCount?: number;
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  totalRestored: number;
  mode: 'replace' | 'merge';
}

export interface AppConfig {
  appName: string;
  hasGoogleOAuth: boolean;
  googleClientId?: string;
  targetFolderName: string;
}
