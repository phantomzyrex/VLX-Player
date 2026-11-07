export interface DriveAccount {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  accessToken: string;
  tokenExpiry: number; // timestamp in ms
  addedAt: number;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  durationMillis?: number;
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  };
  isFolder: boolean;
  isVideo: boolean;
  starred?: boolean;
}

export type PlaylistItemType = 'drive' | 'local' | 'demo' | 'stream';

export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  type: PlaylistItemType;
  driveFileId?: string;
  accountId?: string;
  duration?: number;
  thumbnail?: string;
  size?: number;
  lastPosition?: number;
  localFile?: File;
  mimeType?: string;
  embeddedUrl?: string;
  subtitleFiles?: Array<{ name: string; url: string; content?: string }>;
}

export interface VideoFilters {
  brightness: number; // 0.5 to 2.0 (default 1.0)
  contrast: number;   // 0.5 to 2.0 (default 1.0)
  saturation: number; // 0.0 to 3.0 (default 1.0)
  hue: number;        // -180 to 180 (default 0)
  gamma: number;      // 0.5 to 2.0 (default 1.0)
  rotate: number;     // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
}

export type AspectRatioMode = 'original' | '16:9' | '4:3' | 'fill' | 'stretch';

export interface SubtitleSettings {
  enabled: boolean;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  color: string;
  backgroundColor: string;
  delay: number; // in seconds +/-
  verticalPosition: number; // 5 to 50 % from bottom
}

export interface SubtitleCue {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language?: string;
  cues: SubtitleCue[];
  source: 'local' | 'drive' | 'demo';
}

export type ThemePreset = 'inferno' | 'cyber' | 'aurora' | 'sunset' | 'mono';

export interface PlayerSettings {
  volume: number;          // 0 to 2.0 (200% VLC boost)
  playbackSpeed: number;   // 0.25 to 4.0
  skipInterval: number;    // seconds (e.g. 5, 10, 30)
  repeatMode: 'off' | 'one' | 'all';
  shuffle: boolean;
  theme: ThemePreset;
  isDarkMode: boolean;
  ambientLighting: boolean;
  audioVisualizer: boolean;
  equalizerPreset: string;
  equalizerGains: number[]; // 10 bands
  videoFilters: VideoFilters;
  aspectRatio: AspectRatioMode;
  subtitleSettings: SubtitleSettings;
  googleClientId: string;
}

export interface ContinueWatchingItem {
  id: string;
  title: string;
  thumbnail?: string;
  duration: number;
  currentTime: number;
  lastPlayed: number;
  type: PlaylistItemType;
  driveFileId?: string;
  accountId?: string;
  sourceUrl?: string;
}

export interface MediaInfo {
  filename: string;
  videoWidth: number;
  videoHeight: number;
  duration: number;
  fileSize?: number;
  mimeType?: string;
  container?: string;
  audioSampleRate?: number;
  playbackRate: number;
}
