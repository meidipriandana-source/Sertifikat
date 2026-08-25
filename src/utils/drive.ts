/**
 * Utility helper to parse and format Google Drive links, file IDs, and folder IDs.
 */

export interface GoogleDriveParsedInfo {
  isValid: boolean;
  driveId: string;
  isFolder: boolean;
  isRealDrive: boolean;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  embedUrl: string;
  imageCdnUrl: string | null;
}

export function parseGoogleDriveLink(input: string): GoogleDriveParsedInfo {
  const trimmed = (input || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      driveId: '',
      isFolder: false,
      isRealDrive: false,
      webViewLink: '',
      embedUrl: '',
      imageCdnUrl: null
    };
  }

  let driveId = trimmed;
  let isFolder = false;

  // 1. Check folder URL patterns: drive.google.com/drive/folders/ID or folders/ID
  const folderMatch = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) {
    driveId = folderMatch[1];
    isFolder = true;
  } else {
    // 2. Check file URL patterns: /file/d/ID, id=ID, open?id=ID, uc?id=ID
    const fileMatch = 
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (fileMatch) {
      driveId = fileMatch[1];
    } else if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
      // Raw Google Drive ID (usually 25-45 alphanumeric characters)
      driveId = trimmed;
    }
  }

  // Sanitize trailing slashes or queries from ID
  if (driveId.includes('?')) driveId = driveId.split('?')[0];
  if (driveId.includes('/')) driveId = driveId.split('/')[0];
  if (driveId.includes('&')) driveId = driveId.split('&')[0];

  const isRealDrive = Boolean(driveId && !driveId.includes('SAMPLE') && !driveId.startsWith('sample'));
  const isValid = Boolean(driveId && driveId.length >= 8);

  let webViewLink = trimmed;
  if (isValid) {
    if (isFolder) {
      webViewLink = `https://drive.google.com/drive/folders/${driveId}?usp=sharing`;
    } else {
      webViewLink = `https://drive.google.com/file/d/${driveId}/view?usp=sharing`;
    }
  }

  let embedUrl = '';
  if (isFolder) {
    embedUrl = `https://drive.google.com/embeddedfolderview?id=${driveId}#list`;
  } else if (isRealDrive) {
    embedUrl = `https://drive.google.com/file/d/${driveId}/preview`;
  }

  const webContentLink = isFolder ? undefined : `https://drive.google.com/uc?export=download&id=${driveId}`;
  const thumbnailLink = isFolder ? undefined : `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
  const imageCdnUrl = isRealDrive && !isFolder ? `https://lh3.googleusercontent.com/d/${driveId}=w1200` : null;

  return {
    isValid,
    driveId,
    isFolder,
    isRealDrive,
    webViewLink,
    webContentLink,
    thumbnailLink,
    embedUrl,
    imageCdnUrl
  };
}
