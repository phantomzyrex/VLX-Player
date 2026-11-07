/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  PlayerSettings,
  PlaylistItem,
  DriveAccount,
  ContinueWatchingItem,
  ThemePreset,
} from './types';
import { GoogleDriveService, DEMO_VIDEOS } from './services/googleDriveService';
import { THEMES } from './utils/theme';
import { Navbar } from './components/Navbar';
import { Player } from './components/Player/Player';
import { DriveBrowser } from './components/DriveBrowser/DriveBrowser';
import { PlaylistSidebar } from './components/Playlist/PlaylistSidebar';
import { SettingsModal } from './components/Settings/SettingsModal';
import { ReadmeModal } from './components/ReadmeModal';
import { HeroBanner } from './components/Home/HeroBanner';
import { ContinueWatching } from './components/Home/ContinueWatching';
import { DemosVault } from './components/Home/DemosVault';

const DEFAULT_SETTINGS: PlayerSettings = {
  volume: 1.0,
  playbackSpeed: 1.0,
  skipInterval: 10,
  repeatMode: 'off',
  shuffle: false,
  theme: 'inferno',
  isDarkMode: true,
  ambientLighting: true,
  audioVisualizer: false,
  equalizerPreset: 'Flat',
  equalizerGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  videoFilters: {
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    hue: 0,
    gamma: 1.0,
    rotate: 0,
    flipH: false,
    flipV: false,
  },
  aspectRatio: 'original',
  subtitleSettings: {
    enabled: true,
    fontSize: 'md',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.75)',
    delay: 0,
    verticalPosition: 10,
  },
  googleClientId: '',
};

export default function App() {
  // Load persisted settings
  const [settings, setSettings] = useState<PlayerSettings>(() => {
    try {
      const savedTheme = localStorage.getItem('vlx_theme') as ThemePreset;
      const savedClientId = GoogleDriveService.getSavedClientId();
      const savedVolume = localStorage.getItem('vlx_volume');
      const savedSkip = localStorage.getItem('vlx_skip');

      return {
        ...DEFAULT_SETTINGS,
        theme: savedTheme && THEMES[savedTheme] ? savedTheme : 'inferno',
        googleClientId: savedClientId || '',
        volume: savedVolume ? parseFloat(savedVolume) : 1.0,
        skipInterval: savedSkip ? parseInt(savedSkip, 10) : 10,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Google Accounts
  const [accounts, setAccounts] = useState<DriveAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<DriveAccount | null>(null);

  // Playback & Queue
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(DEMO_VIDEOS);
  const [currentVideo, setCurrentVideo] = useState<PlaylistItem | null>(DEMO_VIDEOS[0]);
  const [currentTab, setCurrentTab] = useState<'player' | 'browser' | 'demos'>('player');

  // Continue watching
  const [continueWatchingItems, setContinueWatchingItems] = useState<ContinueWatchingItem[]>(() => {
    try {
      const data = localStorage.getItem('vlx_continue_watching');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  const localFileInputRef = useRef<HTMLInputElement | null>(null);

  // Load accounts on mount
  const refreshAccounts = () => {
    const accs = GoogleDriveService.getAccounts();
    setAccounts(accs);
    const active = GoogleDriveService.getActiveAccount();
    setActiveAccount(active);
  };

  useEffect(() => {
    refreshAccounts();
  }, []);

  // Update Settings
  const handleUpdateSettings = (partial: Partial<PlayerSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      if (partial.theme) {
        localStorage.setItem('vlx_theme', partial.theme);
      }
      if (partial.volume !== undefined) {
        localStorage.setItem('vlx_volume', String(partial.volume));
      }
      if (partial.skipInterval !== undefined) {
        localStorage.setItem('vlx_skip', String(partial.skipInterval));
      }
      return updated;
    });
  };

  const currentThemeConfig = THEMES[settings.theme] || THEMES.inferno;
  const accentColor = currentThemeConfig.primary;

  // Video selection & queue management
  const handlePlayVideo = (item: PlaylistItem) => {
    setCurrentVideo(item);
    setCurrentTab('player');

    // Add to playlist queue if not already there
    setPlaylist((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      return [item, ...prev];
    });
  };

  const handleAddToQueue = (item: PlaylistItem) => {
    setPlaylist((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const handleRemoveFromQueue = (id: string) => {
    setPlaylist((prev) => prev.filter((p) => p.id !== id));
  };

  const handleMoveQueueItem = (fromIdx: number, toIdx: number) => {
    setPlaylist((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
  };

  const handleNextVideo = () => {
    if (!currentVideo || playlist.length <= 1) return;
    const currentIndex = playlist.findIndex((p) => p.id === currentVideo.id);

    if (settings.shuffle) {
      const otherIndices = playlist.map((_, i) => i).filter((i) => i !== currentIndex);
      if (otherIndices.length > 0) {
        const randIndex = otherIndices[Math.floor(Math.random() * otherIndices.length)];
        setCurrentVideo(playlist[randIndex]);
        return;
      }
    }

    if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
      setCurrentVideo(playlist[currentIndex + 1]);
    } else if (settings.repeatMode === 'all') {
      setCurrentVideo(playlist[0]);
    }
  };

  const handlePrevVideo = () => {
    if (!currentVideo || playlist.length <= 1) return;
    const currentIndex = playlist.findIndex((p) => p.id === currentVideo.id);
    if (currentIndex > 0) {
      setCurrentVideo(playlist[currentIndex - 1]);
    } else if (settings.repeatMode === 'all') {
      setCurrentVideo(playlist[playlist.length - 1]);
    }
  };

  // Open Local File
  const handleOpenLocalFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const item: PlaylistItem = {
      id: `local_${Date.now()}`,
      title: file.name,
      url: objectUrl,
      type: 'local',
      size: file.size,
      mimeType: file.type || 'video/mp4',
      localFile: file,
    };
    handlePlayVideo(item);
  };

  // Continue watching tracker
  const handleProgressUpdate = (item: PlaylistItem, currentTime: number, duration: number) => {
    if (currentTime < 5 || duration <= 0) return;

    setContinueWatchingItems((prev) => {
      const filtered = prev.filter((p) => p.id !== item.id);
      const newItem: ContinueWatchingItem = {
        id: item.id,
        title: item.title,
        thumbnail: item.thumbnail,
        duration,
        currentTime,
        lastPlayed: Date.now(),
        type: item.type,
        driveFileId: item.driveFileId,
        accountId: item.accountId,
        sourceUrl: item.url,
      };
      const updated = [newItem, ...filtered].slice(0, 8);
      localStorage.setItem('vlx_continue_watching', JSON.stringify(updated));
      return updated;
    });
  };

  const handleResumeContinueWatching = (cwItem: ContinueWatchingItem) => {
    // Find matching in playlist or construct item
    const matched = playlist.find((p) => p.id === cwItem.id);
    if (matched) {
      handlePlayVideo(matched);
    } else {
      const item: PlaylistItem = {
        id: cwItem.id,
        title: cwItem.title,
        url: cwItem.sourceUrl || '',
        type: cwItem.type,
        driveFileId: cwItem.driveFileId,
        accountId: cwItem.accountId,
        duration: cwItem.duration,
        thumbnail: cwItem.thumbnail,
      };
      handlePlayVideo(item);
    }
  };

  const handleDismissContinueWatching = (id: string) => {
    setContinueWatchingItems((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem('vlx_continue_watching', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 transition-colors duration-300"
      style={{
        // CSS variables for themes
        ['--accent-primary' as any]: accentColor,
        ['--accent-glow' as any]: currentThemeConfig.glow,
      }}
    >
      {/* Hidden file input for open local video */}
      <input
        type="file"
        ref={localFileInputRef}
        accept="video/*,.mkv,.avi,.ts,.m4v"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleOpenLocalFile(file);
        }}
      />

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        hasActiveVideo={!!currentVideo}
        onOpenPlaylist={() => setIsPlaylistOpen(true)}
        playlistCount={playlist.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenReadme={() => setIsReadmeOpen(true)}
        theme={settings.theme}
        onChangeTheme={(theme) => handleUpdateSettings({ theme })}
        activeAccount={activeAccount}
        accentColor={accentColor}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* Tab 1: Video Player */}
        {currentTab === 'player' && (
          <div className="flex-1 flex flex-col items-center">
            <Player
              currentVideo={currentVideo}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onNextVideo={handleNextVideo}
              onPrevVideo={handlePrevVideo}
              hasNextVideo={playlist.length > 1}
              hasPrevVideo={playlist.length > 1}
              onBackToBrowser={() => setCurrentTab('browser')}
              accentColor={accentColor}
              onProgressUpdate={handleProgressUpdate}
            />

            {/* Below player quick discovery rows */}
            <div className="w-full mt-8">
              <ContinueWatching
                items={continueWatchingItems}
                onResume={handleResumeContinueWatching}
                onRemove={handleDismissContinueWatching}
                accentColor={accentColor}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Google Drive Browser */}
        {currentTab === 'browser' && (
          <div className="space-y-6">
            <HeroBanner
              onPlayDemo={() => handlePlayVideo(DEMO_VIDEOS[0])}
              onOpenDrive={() => {
                if (!activeAccount) setIsSettingsOpen(true);
              }}
              onPickLocalFile={() => localFileInputRef.current?.click()}
              accentColor={accentColor}
              hasActiveAccount={!!activeAccount}
            />

            <ContinueWatching
              items={continueWatchingItems}
              onResume={handleResumeContinueWatching}
              onRemove={handleDismissContinueWatching}
              accentColor={accentColor}
            />

            <DriveBrowser
              accounts={accounts}
              activeAccount={activeAccount}
              onSelectAccount={(id) => {
                GoogleDriveService.setActiveAccountId(id);
                refreshAccounts();
              }}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onPlayVideo={handlePlayVideo}
              onAddToQueue={handleAddToQueue}
              onOpenLocalFile={handleOpenLocalFile}
              accentColor={accentColor}
              clientId={settings.googleClientId}
            />
          </div>
        )}

        {/* Tab 3: 4K Demo Vault */}
        {currentTab === 'demos' && (
          <div className="space-y-6">
            <DemosVault
              onPlay={handlePlayVideo}
              onAddToQueue={handleAddToQueue}
              currentVideoId={currentVideo?.id}
              accentColor={accentColor}
            />

            <ContinueWatching
              items={continueWatchingItems}
              onResume={handleResumeContinueWatching}
              onRemove={handleDismissContinueWatching}
              accentColor={accentColor}
            />
          </div>
        )}
      </main>

      {/* Slide-out Playlist Queue Sidebar */}
      <PlaylistSidebar
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        playlist={playlist}
        currentVideo={currentVideo}
        onSelectVideo={handlePlayVideo}
        onRemoveItem={handleRemoveFromQueue}
        onMoveItem={handleMoveQueueItem}
        onClearPlaylist={() => setPlaylist([])}
        onAddDemos={() => setPlaylist((prev) => [...prev, ...DEMO_VIDEOS])}
        accentColor={accentColor}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        accounts={accounts}
        activeAccountId={activeAccount?.id || null}
        onAccountsChange={refreshAccounts}
        onOpenReadme={() => {
          setIsSettingsOpen(false);
          setIsReadmeOpen(true);
        }}
        accentColor={accentColor}
      />

      {/* Readme / Setup Guide Modal */}
      <ReadmeModal
        isOpen={isReadmeOpen}
        onClose={() => setIsReadmeOpen(false)}
        accentColor={accentColor}
      />
    </div>
  );
}
