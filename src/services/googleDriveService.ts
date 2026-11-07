import { DriveAccount, DriveFile, PlaylistItem } from '../types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void;
            error_callback?: (err: unknown) => void;
            prompt?: string;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string; hint?: string }) => void;
          };
        };
      };
    };
  }
}

const STORAGE_KEY_ACCOUNTS = 'vlx_drive_accounts';
const STORAGE_KEY_ACTIVE_ACCOUNT = 'vlx_active_account_id';
const STORAGE_KEY_CLIENT_ID = 'vlx_google_client_id';

export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/x-matroska',
  'video/quicktime',
  'video/x-msvideo',
  'video/mp2t',
  'video/ogg',
  'video/x-m4v',
];

export const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.ts', '.m4v', '.ogv', '.flv'];

export class GoogleDriveService {
  public static getSavedClientId(): string {
    const saved = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
    if (saved && saved.trim()) return saved.trim();
    return firebaseConfig.oAuthClientId || '';
  }

  public static setSavedClientId(clientId: string): void {
    localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
  }

  public static getAccounts(): DriveAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveAccounts(accounts: DriveAccount[]): void {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  }

  public static getActiveAccountId(): string | null {
    const active = localStorage.getItem(STORAGE_KEY_ACTIVE_ACCOUNT);
    const accounts = this.getAccounts();
    if (active && accounts.some((a) => a.id === active)) {
      return active;
    }
    return accounts.length > 0 ? accounts[0].id : null;
  }

  public static setActiveAccountId(id: string): void {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ACCOUNT, id);
  }

  public static getActiveAccount(): DriveAccount | null {
    const activeId = this.getActiveAccountId();
    if (!activeId) return null;
    const accounts = this.getAccounts();
    return accounts.find((a) => a.id === activeId) || null;
  }

  public static removeAccount(id: string): void {
    const accounts = this.getAccounts().filter((a) => a.id !== id);
    this.saveAccounts(accounts);
    if (this.getActiveAccountId() === id) {
      this.setActiveAccountId(accounts.length > 0 ? accounts[0].id : '');
    }
  }

  /**
   * Primary authentication via Firebase GoogleAuthProvider with Drive readonly scope
   */
  public static async signInWithFirebase(): Promise<{
    accessToken: string;
    user: { id: string; name: string; email: string; picture?: string };
  }> {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve Google Drive access token from sign-in.');
    }

    return {
      accessToken: credential.accessToken,
      user: {
        id: result.user.uid,
        name: result.user.displayName || 'Google User',
        email: result.user.email || 'user@gmail.com',
        picture: result.user.photoURL || undefined,
      },
    };
  }

  /**
   * Secondary authentication via Google Identity Services (GIS)
   */
  public static requestGoogleSignIn(
    clientId: string,
    prompt: string = 'select_account'
  ): Promise<{ accessToken: string; expiresIn: number }> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(
          new Error(
            'Google Identity Services script not yet loaded. Please check your internet connection or reload.'
          )
        );
        return;
      }

      if (!clientId) {
        reject(new Error('Google OAuth Client ID is required. Please set it in Settings.'));
        return;
      }

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          prompt,
          callback: (response) => {
            if (response.error) {
              const errMsg = (response as any).error_description || response.error;
              reject(new Error(errMsg));
            } else if (response.access_token) {
              resolve({
                accessToken: response.access_token,
                expiresIn: response.expires_in || 3600,
              });
            } else {
              reject(new Error('Failed to obtain access token.'));
            }
          },
          error_callback: (err: any) => {
            const errType = err?.type || (typeof err === 'string' ? err : '');
            const message = err?.message || '';
            if (errType === 'popup_closed' || message.includes('closed') || String(err).includes('closed')) {
              reject(
                new Error(
                  'The sign-in popup was closed. If it closed automatically, verify that your current origin is listed in "Authorized JavaScript origins" in Google Cloud Console.'
                )
              );
            } else if (errType === 'popup_blocked' || message.includes('blocked')) {
              reject(
                new Error('Sign-in popup was blocked by your browser. Please allow popups for this site.')
              );
            } else {
              reject(new Error(message || errType || 'Sign-in window closed or canceled.'));
            }
          },
        });

        client.requestAccessToken();
      } catch (err: any) {
        reject(new Error(err?.message || 'Failed to initialize Google Sign-in.'));
      }
    });
  }

  /**
   * Fetch User Info from Google Profile API
   */
  public static async fetchUserInfo(accessToken: string): Promise<{ id: string; name: string; email: string; picture?: string }> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch user info: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      id: data.sub || String(Date.now()),
      name: data.name || 'Google User',
      email: data.email || 'user@gmail.com',
      picture: data.picture,
    };
  }

  /**
   * Add account using an access token directly (e.g. OAuth Playground or Bearer token)
   */
  public static async addAccountWithAccessToken(accessToken: string): Promise<DriveAccount> {
    const userInfo = await this.fetchUserInfo(accessToken.trim());

    const accounts = this.getAccounts();
    const existingIndex = accounts.findIndex((a) => a.email === userInfo.email);

    const account: DriveAccount = {
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      avatarUrl: userInfo.picture,
      accessToken: accessToken.trim(),
      tokenExpiry: Date.now() + 3600 * 1000,
      addedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }

    this.saveAccounts(accounts);
    this.setActiveAccountId(account.id);
    return account;
  }

  /**
   * Signs in a user and saves to account list using Firebase Auth (or GIS fallback)
   */
  public static async addGoogleAccount(customClientId?: string): Promise<DriveAccount> {
    let accessToken: string = '';
    let userInfo: { id: string; name: string; email: string; picture?: string };

    const effectiveClientId = customClientId || this.getSavedClientId();
    const isCustomOtherClient = customClientId && customClientId !== firebaseConfig.oAuthClientId;

    if (!isCustomOtherClient) {
      // Use Firebase Auth (eliminates 401 invalid_client)
      try {
        const fbResult = await this.signInWithFirebase();
        accessToken = fbResult.accessToken;
        userInfo = fbResult.user;
      } catch (fbErr: any) {
        if (fbErr?.code === 'auth/popup-closed-by-user') {
          throw new Error('Sign-in popup was closed.');
        }
        console.warn('Firebase auth attempt returned, attempting GIS flow:', fbErr?.message || fbErr);
        // Fallback to GIS
        const { accessToken: gisToken } = await this.requestGoogleSignIn(effectiveClientId);
        accessToken = gisToken;
        userInfo = await this.fetchUserInfo(accessToken);
      }
    } else {
      // User specified a custom client ID
      const { accessToken: gisToken } = await this.requestGoogleSignIn(effectiveClientId);
      accessToken = gisToken;
      userInfo = await this.fetchUserInfo(accessToken);
    }

    const accounts = this.getAccounts();
    const existingIndex = accounts.findIndex((a) => a.email === userInfo.email);

    const account: DriveAccount = {
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      avatarUrl: userInfo.picture,
      accessToken,
      tokenExpiry: Date.now() + 3600 * 1000,
      addedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }

    this.saveAccounts(accounts);
    this.setActiveAccountId(account.id);
    return account;
  }

  /**
   * Refreshes token if expired or near expiry
   */
  public static async ensureValidToken(account: DriveAccount, clientId: string): Promise<string> {
    // If token has at least 5 minutes remaining, use it
    if (account.tokenExpiry - Date.now() > 5 * 60 * 1000) {
      return account.accessToken;
    }

    // Refresh token silently or via prompt
    try {
      const { accessToken, expiresIn } = await this.requestGoogleSignIn(clientId, 'none');
      account.accessToken = accessToken;
      account.tokenExpiry = Date.now() + expiresIn * 1000;
      const accounts = this.getAccounts().map((a) => (a.id === account.id ? account : a));
      this.saveAccounts(accounts);
      return accessToken;
    } catch {
      // Return existing token if silent refresh fails, might still work briefly
      return account.accessToken;
    }
  }

  /**
   * List files from Google Drive
   */
  public static async listFiles(params: {
    accessToken: string;
    folderId?: string;
    searchQuery?: string;
    filterMode?: 'all' | 'recent' | 'starred';
    pageToken?: string;
    pageSize?: number;
  }): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
    const { accessToken, folderId = 'root', searchQuery, filterMode = 'all', pageToken, pageSize = 40 } = params;

    const queryParts: string[] = ['trashed = false'];

    if (filterMode === 'starred') {
      queryParts.push('starred = true');
      queryParts.push("(mimeType contains 'video/' or mimeType = 'application/vnd.google-apps.folder')");
    } else if (filterMode === 'recent') {
      queryParts.push("mimeType contains 'video/'");
    } else {
      // Normal folder browsing
      if (searchQuery && searchQuery.trim()) {
        const clean = searchQuery.trim().replace(/['\\]/g, '');
        queryParts.push(`name contains '${clean}'`);
        queryParts.push("(mimeType contains 'video/' or mimeType = 'application/vnd.google-apps.folder')");
      } else {
        queryParts.push(`'${folderId}' in parents`);
        queryParts.push("(mimeType contains 'video/' or mimeType = 'application/vnd.google-apps.folder')");
      }
    }

    const q = queryParts.join(' and ');
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', q);
    url.searchParams.set('pageSize', String(pageSize));
    url.searchParams.set(
      'fields',
      'nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink, iconLink, videoMediaMetadata, starred, parents)'
    );

    if (filterMode === 'recent') {
      url.searchParams.set('orderBy', 'viewedByMeTime desc, modifiedTime desc');
    } else {
      url.searchParams.set('orderBy', 'folder, modifiedTime desc, name');
    }

    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Drive API error (${res.status}): ${errBody || res.statusText}`);
    }

    const data = await res.json();
    const rawFiles: any[] = data.files || [];

    const files: DriveFile[] = rawFiles.map((f) => {
      const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
      const isVideo =
        f.mimeType?.startsWith('video/') ||
        VIDEO_EXTENSIONS.some((ext) => f.name?.toLowerCase().endsWith(ext));

      let durationMillis: number | undefined;
      if (f.videoMediaMetadata?.durationMillis) {
        durationMillis = parseInt(f.videoMediaMetadata.durationMillis, 10);
      }

      return {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size ? parseInt(f.size, 10) : undefined,
        modifiedTime: f.modifiedTime,
        thumbnailLink: f.thumbnailLink,
        webViewLink: f.webViewLink,
        videoMediaMetadata: f.videoMediaMetadata,
        durationMillis,
        isFolder,
        isVideo,
        starred: f.starred,
      };
    });

    return {
      files,
      nextPageToken: data.nextPageToken,
    };
  }

  /**
   * Search for subtitle files in the same folder as the video
   */
  public static async findSubtitlesInFolder(
    accessToken: string,
    folderId: string,
    videoName: string
  ): Promise<Array<{ name: string; url: string; content?: string }>> {
    try {
      const q = `'${folderId}' in parents and trashed = false and (name contains '.srt' or name contains '.vtt')`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id, name, mimeType)`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return [];

      const data = await res.json();
      const files: any[] = data.files || [];

      // Find matching or relevant subtitle files
      const subtitleFiles = await Promise.all(
        files.map(async (file) => {
          try {
            const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (contentRes.ok) {
              const text = await contentRes.text();
              return {
                name: file.name,
                url: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
                content: text,
              };
            }
          } catch {
            // ignore
          }
          return null;
        })
      );

      return subtitleFiles.filter(Boolean) as Array<{ name: string; url: string; content?: string }>;
    } catch {
      return [];
    }
  }

  /**
   * Creates a playable URL from Google Drive file
   */
  public static async createDriveMediaStreamUrl(
    fileId: string,
    accessToken: string
  ): Promise<{ streamUrl: string; embeddedUrl: string }> {
    const embeddedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Range: 'bytes=0-',
        },
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(`Failed to stream video: ${response.statusText}`);
      }

      const blob = await response.blob();
      const streamUrl = URL.createObjectURL(blob);
      return { streamUrl, embeddedUrl };
    } catch (err) {
      console.warn('Direct media stream fetch failed, using embedded fallback:', err);
      return {
        streamUrl: '',
        embeddedUrl,
      };
    }
  }
}

/**
 * Built-in open demo videos for instant out-of-the-box VLC testing
 */
export const DEMO_VIDEOS: PlaylistItem[] = [
  {
    id: 'demo_bbb',
    title: 'Big Buck Bunny (Animation / 1080p 60fps)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    type: 'demo',
    duration: 596,
    size: 158008374,
    thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    mimeType: 'video/mp4',
    subtitleFiles: [
      {
        name: 'English Subtitles.vtt',
        url: '',
        content: `WEBVTT

00:00:01.000 --> 00:00:04.000
Peach Open Movie Project presents...

00:00:05.000 --> 00:00:10.000
Big Buck Bunny - An open source animated short film.

00:00:12.000 --> 00:00:18.000
A sunny morning in the enchanted forest!

00:00:20.000 --> 00:00:28.000
Testing VLX Player subtitles & 10-band equalizer audio processing.`,
      },
    ],
  },
  {
    id: 'demo_tears',
    title: 'Tears of Steel (Sci-Fi VFX / 4K Master)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    type: 'demo',
    duration: 734,
    size: 168000000,
    thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg',
    mimeType: 'video/mp4',
  },
  {
    id: 'demo_sintel',
    title: 'Sintel (Fantasy CGI / 4K)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    type: 'demo',
    duration: 888,
    size: 129000000,
    thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
    mimeType: 'video/mp4',
  },
  {
    id: 'demo_elephants',
    title: 'Elephants Dream (Open Movie / Surround)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    type: 'demo',
    duration: 653,
    size: 140000000,
    thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
    mimeType: 'video/mp4',
  },
];
