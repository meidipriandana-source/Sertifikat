// Google Identity Services (GIS) OAuth helper for Google Drive API
const GIS_SCRIPT_ID = 'google-gsi-client-script';
const TOKEN_STORAGE_KEY = 'sms_gdrive_access_token';
const EXPIRY_STORAGE_KEY = 'sms_gdrive_token_expiry';
const USER_EMAIL_STORAGE_KEY = 'sms_gdrive_user_email';

export interface GoogleAuthState {
  isConnected: boolean;
  accessToken: string | null;
  userEmail: string | null;
  expiresAt: number | null;
}

export function loadGoogleGsiScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById(GIS_SCRIPT_ID)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = GIS_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Google GSI script could not be loaded directly');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

export function getStoredAuthState(): GoogleAuthState {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expiry = localStorage.getItem(EXPIRY_STORAGE_KEY);
  const email = localStorage.getItem(USER_EMAIL_STORAGE_KEY);

  if (token && expiry) {
    const expiresAt = parseInt(expiry, 10);
    if (Date.now() < expiresAt) {
      return {
        isConnected: true,
        accessToken: token,
        userEmail: email,
        expiresAt
      };
    }
  }

  return {
    isConnected: false,
    accessToken: null,
    userEmail: null,
    expiresAt: null
  };
}

export function saveAuthState(token: string, expiresInSeconds: number, email?: string): void {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(EXPIRY_STORAGE_KEY, expiresAt.toString());
  if (email) {
    localStorage.setItem(USER_EMAIL_STORAGE_KEY, email);
  }
}

export function clearAuthState(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(EXPIRY_STORAGE_KEY);
  localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
}

// Request Token using GIS OAuth 2.0 Token Client
export function requestGoogleDriveToken(
  clientId: string,
  onSuccess: (token: string, expiresIn: number) => void,
  onError: (err: any) => void
): void {
  if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
    onError(new Error('Google Identity Services library belum dimuat.'));
    return;
  }

  try {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: any) => {
        if (response.error !== undefined) {
          onError(response);
          return;
        }
        if (response.access_token) {
          const expiresIn = response.expires_in ? parseInt(response.expires_in, 10) : 3600;
          saveAuthState(response.access_token, expiresIn);
          onSuccess(response.access_token, expiresIn);
        }
      }
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  } catch (err) {
    onError(err);
  }
}
