import { Certificate, CertificateStats } from '../types';
import { getStoredAuthState } from './googleAuth';

const API_BASE = '/api';

export async function fetchCertificates(params?: {
  search?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  expiryStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ total: number; data: Certificate[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.category) query.append('category', params.category);
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);
  if (params?.expiryStatus) query.append('expiryStatus', params.expiryStatus);
  if (params?.sortBy) query.append('sortBy', params.sortBy);
  if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

  const res = await fetch(`${API_BASE}/certificates?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Gagal mengambil daftar sertifikat');
  }
  return res.json();
}

export async function fetchCertificateById(id: string): Promise<Certificate> {
  const res = await fetch(`${API_BASE}/certificates/${id}`);
  if (!res.ok) {
    throw new Error('Sertifikat tidak ditemukan');
  }
  const json = await res.json();
  return json.data;
}

export async function uploadCertificate(formData: FormData): Promise<Certificate> {
  const authState = getStoredAuthState();
  const headers: Record<string, string> = {};

  if (authState.isConnected && authState.accessToken) {
    headers['Authorization'] = `Bearer ${authState.accessToken}`;
  }

  const res = await fetch(`${API_BASE}/certificates/upload`, {
    method: 'POST',
    headers,
    body: formData
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal mengunggah sertifikat');
  }
  return data.data;
}

export async function updateCertificate(
  id: string,
  updates: Partial<Certificate>
): Promise<Certificate> {
  const res = await fetch(`${API_BASE}/certificates/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal memperbarui metadata');
  }
  return data.data;
}

export async function deleteCertificate(id: string): Promise<void> {
  const authState = getStoredAuthState();
  const headers: Record<string, string> = {};

  if (authState.isConnected && authState.accessToken) {
    headers['Authorization'] = `Bearer ${authState.accessToken}`;
  }

  const res = await fetch(`${API_BASE}/certificates/${id}`, {
    method: 'DELETE',
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal menghapus sertifikat');
  }
}

export async function fetchStats(): Promise<CertificateStats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) {
    throw new Error('Gagal memuat statistik');
  }
  const json = await res.json();
  return json.stats;
}

export async function verifyGoogleDriveFolder(): Promise<{ folderId: string; folderName: string }> {
  const authState = getStoredAuthState();
  if (!authState.accessToken) {
    throw new Error('Belum ada token Google Drive yang tersimpan.');
  }

  const res = await fetch(`${API_BASE}/drive/verify-folder`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authState.accessToken}`
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal memverifikasi folder Google Drive');
  }
  return data;
}

export async function restoreCertificates(
  certificates: Certificate[] | any,
  mode: 'replace' | 'merge' = 'replace'
): Promise<{ success: boolean; message: string; totalRestored: number; totalCurrent: number; data: Certificate[] }> {
  const res = await fetch(`${API_BASE}/certificates/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      certificates,
      mode
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal memulihkan data sertifikat');
  }
  return data;
}

export async function resetSampleCertificates(): Promise<{ success: boolean; message: string; totalRestored: number; data: Certificate[] }> {
  const res = await fetch(`${API_BASE}/certificates/reset-sample`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal mereset ke data contoh');
  }
  return data;
}

export async function syncGoogleDriveFolder(
  folderUrlOrId: string,
  options?: {
    defaultRecipient?: string;
    defaultIssuer?: string;
    accessToken?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  totalSynced: number;
  totalAdded: number;
  folderId: string;
  data: Certificate[];
}> {
  const auth = getStoredAuthState();
  const token = options?.accessToken || (auth.isConnected ? auth.accessToken : undefined);

  const res = await fetch(`${API_BASE}/drive/sync-folder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      folderUrlOrId,
      accessToken: token,
      defaultRecipient: options?.defaultRecipient,
      defaultIssuer: options?.defaultIssuer
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal menyinkronkan folder Google Drive');
  }
  return data;
}


