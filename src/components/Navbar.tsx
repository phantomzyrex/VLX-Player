import React, { useState } from 'react';
import { VlcConeIcon } from './VlcConeIcon';
import { THEMES } from '../utils/theme';
import { ThemePreset, DriveAccount } from '../types';
import {
  Play,
  HardDrive,
  ListMusic,
  Sparkles,
  Settings,
  HelpCircle,
  Film,
  Moon,
  Sun,
  User,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'player' | 'browser' | 'demos';
  onChangeTab: (tab: 'player' | 'browser' | 'demos') => void;
  hasActiveVideo: boolean;
  onOpenPlaylist: () => void;
  playlistCount: number;
  onOpenSettings: () => void;
  onOpenReadme: () => void;
  theme: ThemePreset;
  onChangeTheme: (theme: ThemePreset) => void;
  activeAccount: DriveAccount | null;
  accentColor?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab,
  hasActiveVideo,
  onOpenPlaylist,
  playlistCount,
  onOpenSettings,
  onOpenReadme,
  theme,
  onChangeTheme,
  activeAccount,
  accentColor = '#ff6b00',
}) => {
  const [showThemePicker, setShowThemePicker] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 sm:px-6 py-2.5 flex items-center justify-between">
      {/* Brand logo & title */}
      <div
        onClick={() => onChangeTab(hasActiveVideo ? 'player' : 'browser')}
        className="flex items-center gap-2.5 cursor-pointer select-none group"
      >
        <div className="transform group-hover:rotate-12 transition-transform duration-300">
          <VlcConeIcon size={32} glowColor={accentColor} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-sans">
              VLX
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white uppercase tracking-wider font-mono shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              PRO
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-medium -mt-1 hidden sm:block">
            VLC Media Studio
          </span>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <nav className="flex items-center bg-neutral-900/90 border border-white/10 rounded-2xl p-1 text-xs font-semibold">
        {hasActiveVideo && (
          <button
            onClick={() => onChangeTab('player')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              currentTab === 'player'
                ? 'text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
            style={{
              backgroundColor: currentTab === 'player' ? accentColor : undefined,
            }}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Player</span>
          </button>
        )}

        <button
          onClick={() => onChangeTab('browser')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
            currentTab === 'browser'
              ? 'text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
          style={{
            backgroundColor: currentTab === 'browser' ? accentColor : undefined,
          }}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Drive Files</span>
        </button>

        <button
          onClick={() => onChangeTab('demos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
            currentTab === 'demos'
              ? 'text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
          style={{
            backgroundColor: currentTab === 'demos' ? accentColor : undefined,
          }}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">4K Demos</span>
        </button>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Playlist Queue Trigger */}
        <button
          onClick={onOpenPlaylist}
          className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5 transition flex items-center gap-1.5 text-xs font-medium"
          title="Open playback queue"
        >
          <ListMusic className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">Queue</span>
          {playlistCount > 0 && (
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full text-white"
              style={{ backgroundColor: accentColor }}
            >
              {playlistCount}
            </span>
          )}
        </button>

        {/* Theme Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5 transition flex items-center gap-1.5"
            title="Switch color accent theme"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/30"
              style={{ backgroundColor: accentColor }}
            />
          </button>

          {showThemePicker && (
            <div className="absolute right-0 top-11 glass-panel rounded-2xl p-2 w-48 shadow-2xl border border-white/10 z-50 animate-in fade-in duration-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 py-1 block">
                Themes
              </span>
              {(Object.keys(THEMES) as ThemePreset[]).map((tKey) => {
                const item = THEMES[tKey];
                return (
                  <button
                    key={tKey}
                    onClick={() => {
                      onChangeTheme(tKey);
                      setShowThemePicker(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition ${
                      theme === tKey ? 'bg-white/15 text-white font-bold' : 'hover:bg-white/5 text-neutral-300'
                    }`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: item.primary }}
                    />
                    <span className="truncate">{item.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Setup / Help Button */}
        <button
          onClick={onOpenReadme}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5 transition"
          title="Google OAuth Setup Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5 transition"
          title="Player & Account Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Active Account Avatar Pill */}
        {activeAccount ? (
          <div
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition"
            title={`Active: ${activeAccount.name} (${activeAccount.email})`}
          >
            {activeAccount.avatarUrl ? (
              <img
                src={activeAccount.avatarUrl}
                alt={activeAccount.name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold">
                {activeAccount.name.charAt(0)}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/5 transition"
            title="Connect Google Account"
          >
            <User className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
