import { ThemePreset } from '../types';

export interface ThemeColors {
  name: string;
  primary: string;
  secondary: string;
  glow: string;
  gradient: string;
  bgLight: string;
  bgDark: string;
  borderGlow: string;
  coneGlow: string;
}

export const THEMES: Record<ThemePreset, ThemeColors> = {
  inferno: {
    name: 'Inferno (VLC Classic)',
    primary: '#ff6b00',
    secondary: '#ff9100',
    glow: 'rgba(255, 107, 0, 0.45)',
    gradient: 'from-amber-500 via-orange-600 to-red-600',
    bgLight: '#faf5f0',
    bgDark: '#0c0a09',
    borderGlow: 'border-orange-500/40',
    coneGlow: '#ff6b00',
  },
  cyber: {
    name: 'Cyberpunk Neon',
    primary: '#00f0ff',
    secondary: '#0070f3',
    glow: 'rgba(0, 240, 255, 0.45)',
    gradient: 'from-cyan-400 via-teal-500 to-blue-600',
    bgLight: '#f0f9ff',
    bgDark: '#080c14',
    borderGlow: 'border-cyan-500/40',
    coneGlow: '#00f0ff',
  },
  aurora: {
    name: 'Aurora Emerald',
    primary: '#10b981',
    secondary: '#06b6d4',
    glow: 'rgba(16, 185, 129, 0.45)',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    bgLight: '#f0fdf4',
    bgDark: '#06130e',
    borderGlow: 'border-emerald-500/40',
    coneGlow: '#10b981',
  },
  sunset: {
    name: 'Sunset Magenta',
    primary: '#f43f5e',
    secondary: '#a855f7',
    glow: 'rgba(244, 63, 94, 0.45)',
    gradient: 'from-rose-500 via-fuchsia-600 to-purple-600',
    bgLight: '#fff1f2',
    bgDark: '#120814',
    borderGlow: 'border-rose-500/40',
    coneGlow: '#f43f5e',
  },
  mono: {
    name: 'Mono Titanium',
    primary: '#e2e8f0',
    secondary: '#94a3b8',
    glow: 'rgba(226, 232, 240, 0.3)',
    gradient: 'from-slate-200 via-slate-400 to-zinc-600',
    bgLight: '#f8fafc',
    bgDark: '#0f172a',
    borderGlow: 'border-slate-400/40',
    coneGlow: '#e2e8f0',
  },
};

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return '--';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
