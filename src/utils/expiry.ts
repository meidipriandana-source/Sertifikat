import { ExpiryStatus } from '../types';

export interface ExpiryDetails {
  status: ExpiryStatus;
  daysRemaining: number | null;
  formattedDate: string;
  badgeLabel: string;
  badgeSubtext: string;
  isBlinking: boolean;
  colorTheme: 'amber' | 'rose' | 'emerald' | 'blue';
}

/**
 * Calculates the expiration status and information for a given expiry date.
 * If expiryDate is undefined or empty, the certificate is considered "Lifetime / Seumur Hidup".
 * If remaining days <= 30 and >= 0, status is 'expiring_soon' (Mendekati Kadaluarsa -> Blinking Light).
 * If remaining days < 0, status is 'expired' (Kadaluarsa -> Blinking Red Light).
 * If remaining days > 30, status is 'valid' (Aktif -> Steady Green).
 */
export function getExpiryDetails(expiryDate?: string | null): ExpiryDetails {
  if (!expiryDate || expiryDate.trim() === '') {
    return {
      status: 'lifetime',
      daysRemaining: null,
      formattedDate: 'Seumur Hidup',
      badgeLabel: 'Seumur Hidup',
      badgeSubtext: 'Berlaku Selamanya',
      isBlinking: false,
      colorTheme: 'blue'
    };
  }

  // Parse today and expiry date (start of day)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const parts = expiryDate.split('-');
  let exp: Date;
  if (parts.length === 3) {
    exp = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    exp = new Date(expiryDate);
  }

  const expZero = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
  const diffTime = expZero.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Format date in Indonesian readable form (e.g. 25 Des 2026)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const formattedDate = `${exp.getDate()} ${months[exp.getMonth()]} ${exp.getFullYear()}`;

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    const badgeSubtext = absDays === 1 ? 'Kadaluarsa kemarin' : `Kadaluarsa ${absDays} hari lalu`;
    return {
      status: 'expired',
      daysRemaining: diffDays,
      formattedDate,
      badgeLabel: 'Kadaluarsa',
      badgeSubtext,
      isBlinking: true, // Blinking red LED
      colorTheme: 'rose'
    };
  }

  if (diffDays <= 30) {
    const badgeSubtext = diffDays === 0 ? 'Kadaluarsa Hari Ini' : `${diffDays} hari lagi`;
    return {
      status: 'expiring_soon',
      daysRemaining: diffDays,
      formattedDate,
      badgeLabel: 'Segera Berakhir',
      badgeSubtext,
      isBlinking: true, // Blinking amber LED
      colorTheme: 'amber'
    };
  }

  return {
    status: 'valid',
    daysRemaining: diffDays,
    formattedDate,
    badgeLabel: 'Aktif',
    badgeSubtext: `${diffDays} hari tersisa`,
    isBlinking: false,
    colorTheme: 'emerald'
  };
}

export function getExpirySummary(certificates: { expiryDate?: string }[] = []) {
  let expiringSoonCount = 0;
  let expiredCount = 0;
  let validCount = 0;
  let lifetimeCount = 0;

  const safeList = Array.isArray(certificates) ? certificates : [];

  for (const cert of safeList) {
    if (!cert) continue;
    const details = getExpiryDetails(cert.expiryDate);
    if (details.status === 'expiring_soon') {
      expiringSoonCount++;
    } else if (details.status === 'expired') {
      expiredCount++;
    } else if (details.status === 'valid') {
      validCount++;
    } else if (details.status === 'lifetime') {
      lifetimeCount++;
    }
  }

  return {
    expiringSoonCount,
    expiredCount,
    validCount,
    lifetimeCount,
    totalUrgent: expiringSoonCount + expiredCount
  };
}
