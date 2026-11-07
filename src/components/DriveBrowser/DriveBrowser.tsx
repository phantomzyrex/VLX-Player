import React, { useState, useEffect, useRef } from 'react';
import { DriveAccount, DriveFile, PlaylistItem } from '../../types';
import { GoogleDriveService, DEMO_VIDEOS } from '../../services/googleDriveService';
import { formatBytes, formatTime } from '../../utils/theme';
import { VlcConeIcon } from '../VlcConeIcon';
import {
  Folder,
  FileVideo,
  Search,
  Grid,
  List,
  Star,
  Clock,
  ChevronRight,
  HardDrive,
  RefreshCw,
  Plus,
  Play,
  Upload,
  AlertCircle,
  Film,
  Sparkles,
  ExternalLink,
  Key,
} from 'lucide-react';

interface DriveBrowserProps {
  accounts: DriveAccount[];
  activeAccount: DriveAccount | null;
  onSelectAccount: (accountId: string) => void;
  onOpenSettings: () => void;
  onPlayVideo: (item: PlaylistItem) => void;
  onAddToQueue: (item: PlaylistItem) => void;
  onOpenLocalFile: (file: File) => void;
  accentColor?: string;
  clientId: string;
}

export const DriveBrowser: React.FC<DriveBrowserProps> = ({
  accounts,
  activeAccount,
  onSelectAccount,
  onOpenSettings,
  onPlayVideo,
  onAddToQueue,
  onOpenLocalFile,
  accentColor = '#ff6b00',
  clientId,
}) => {
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'My Drive' },
  ]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'recent' | 'starred'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  const filePickerRef = useRef<HTMLInputElement | null>(null);

  const currentFolder = folderPath[folderPath.length - 1];

  // Fetch files from Drive
  const loadDriveFiles = async (resetList: boolean = true, pageToken?: string) => {
    if (!activeAccount) return;
    setIsLoading(true);
    setError(null);

    try {
      const validToken = await GoogleDriveService.ensureValidToken(activeAccount, clientId);
      const res = await GoogleDriveService.listFiles({
        accessToken: validToken,
        folderId: currentFolder.id,
        searchQuery: searchQuery.trim() || undefined,
        filterMode,
        pageToken,
        pageSize: 30,
      });

      if (resetList) {
        setFiles(res.files);
      } else {
        setFiles((prev) => [...prev, ...res.files]);
      }
      setNextPageToken(res.nextPageToken);
    } catch (err: any) {
      console.warn('Notice loading drive files:', err?.message || err);
      setError(err?.message || 'Failed to load files from Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeAccount) {
      loadDriveFiles(true);
    } else {
      setFiles([]);
    }
  }, [activeAccount, currentFolder.id, filterMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDriveFiles(true);
  };

  const handleOpenFolder = (folderId: string, folderName: string) => {
    setFolderPath((prev) => [...prev, { id: folderId, name: folderName }]);
    setSearchQuery('');
  };

  const handleBreadcrumbClick = (index: number) => {
    setFolderPath((prev) => prev.slice(0, index + 1));
    setSearchQuery('');
  };

  // Convert DriveFile to PlaylistItem and launch playback
  const handlePlayDriveFile = async (file: DriveFile) => {
    if (!activeAccount) return;
    setIsLoading(true);

    try {
      const validToken = await GoogleDriveService.ensureValidToken(activeAccount, clientId);
      const { streamUrl, embeddedUrl } = await GoogleDriveService.createDriveMediaStreamUrl(
        file.id,
        validToken
      );

      // Search for subtitles in same folder
      let subtitleFiles: Array<{ name: string; url: string; content?: string }> = [];
      if (currentFolder.id !== 'root') {
        subtitleFiles = await GoogleDriveService.findSubtitlesInFolder(
          validToken,
          currentFolder.id,
          file.name
        );
      }

      const item: PlaylistItem = {
        id: file.id,
        title: file.name,
        url: streamUrl || `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        type: 'drive',
        driveFileId: file.id,
        accountId: activeAccount.id,
        duration: file.durationMillis ? Math.round(file.durationMillis / 1000) : undefined,
        thumbnail: file.thumbnailLink,
        size: file.size,
        mimeType: file.mimeType,
        embeddedUrl,
        subtitleFiles,
      };

      onPlayVideo(item);
    } catch (err: any) {
      console.warn('Direct media stream fetch failed, switching to embedded fallback:', err?.message || err);
      // Fallback: embedded URL
      const item: PlaylistItem = {
        id: file.id,
        title: file.name,
        url: '',
        type: 'drive',
        driveFileId: file.id,
        embeddedUrl: `https://drive.google.com/file/d/${file.id}/preview`,
        size: file.size,
        mimeType: file.mimeType,
      };
      onPlayVideo(item);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToQueueDriveFile = (file: DriveFile) => {
    if (!activeAccount) return;
    const item: PlaylistItem = {
      id: file.id,
      title: file.name,
      url: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      type: 'drive',
      driveFileId: file.id,
      accountId: activeAccount.id,
      duration: file.durationMillis ? Math.round(file.durationMillis / 1000) : undefined,
      thumbnail: file.thumbnailLink,
      size: file.size,
      mimeType: file.mimeType,
      embeddedUrl: `https://drive.google.com/file/d/${file.id}/preview`,
    };
    onAddToQueue(item);
  };

  // Drag and Drop files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      onOpenLocalFile(droppedFile);
    }
  };

  // Saved progress helper for thumbnail progress bar
  const getSavedProgressPercent = (fileId: string, durationMillis?: number) => {
    const saved = localStorage.getItem(`vlx_pos_${fileId}`);
    if (!saved) return 0;
    const pos = parseFloat(saved);
    const dur = durationMillis ? durationMillis / 1000 : 0;
    if (dur > 0) {
      return Math.min(100, (pos / dur) * 100);
    }
    return pos > 0 ? 50 : 0;
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full min-h-[70vh] flex flex-col rounded-2xl glass-panel p-4 sm:p-6 text-white border transition-all duration-200 relative ${
        isDragging ? 'border-amber-500 shadow-2xl ring-4 ring-amber-500/20' : 'border-white/10'
      }`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-40 bg-neutral-950/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center pointer-events-none">
          <Upload className="w-16 h-16 text-amber-400 animate-bounce mb-3" />
          <h3 className="text-xl font-bold">Drop your video file to play</h3>
          <p className="text-sm text-neutral-400">Supports MP4, WebM, MKV, AVI, MOV, TS</p>
        </div>
      )}

      {/* Header Row: Title, Accounts & Local File Picker */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
          >
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              Google Drive Cloud Vault
              {activeAccount && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                  Connected
                </span>
              )}
            </h2>
            <p className="text-xs text-neutral-400">
              Instant HTTP range streaming, multi-account sync & auto-transcoder
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Local File Picker Button */}
          <input
            type="file"
            ref={filePickerRef}
            accept="video/*,.mkv,.avi,.ts,.m4v"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onOpenLocalFile(file);
            }}
          />
          <button
            onClick={() => filePickerRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-neutral-200 transition"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Open Local File</span>
          </button>

          {/* Accounts Selector Pill / Add Account */}
          {accounts.length > 0 ? (
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-white/10 rounded-xl p-1">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => onSelectAccount(acc.id)}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs transition ${
                    activeAccount?.id === acc.id
                      ? 'bg-amber-500 text-white font-semibold shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: activeAccount?.id === acc.id ? accentColor : undefined,
                  }}
                  title={acc.email}
                >
                  {acc.avatarUrl ? (
                    <img src={acc.avatarUrl} alt={acc.name} className="w-4 h-4 rounded-full" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center text-[9px] font-bold">
                      {acc.name.charAt(0)}
                    </div>
                  )}
                  <span className="max-w-[90px] truncate">{acc.name}</span>
                </button>
              ))}

              <button
                onClick={onOpenSettings}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10"
                title="Manage accounts"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition hover:scale-[1.02]"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 14px ${accentColor}66`,
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Connect Google Drive</span>
            </button>
          )}
        </div>
      </div>

      {/* If No Google Account Connected Banner */}
      {!activeAccount && (
        <div className="my-6 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 text-center flex flex-col items-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
            style={{ backgroundColor: `${accentColor}25` }}
          >
            <VlcConeIcon size={36} glowColor={accentColor} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Connect Your Google Drive Accounts</h3>
          <p className="text-xs text-neutral-400 max-w-md mb-4 leading-relaxed">
            Link one or multiple Google accounts to browse your video folders, stream high-bitrate media
            instantly without full downloads, and continue watching across devices.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenSettings}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg flex items-center gap-2 transition hover:scale-[1.02]"
              style={{ backgroundColor: accentColor }}
            >
              <Key className="w-4 h-4" />
              <span>Connect via OAuth Client ID</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-neutral-200 bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-2 transition hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>30-Second Instant Token (OAuth Playground)</span>
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumbs & Navigation Controls Bar */}
      {activeAccount && (
        <div className="flex flex-wrap items-center justify-between gap-3 my-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs text-neutral-400 overflow-x-auto py-1 max-w-full">
            {folderPath.map((folder, idx) => (
              <React.Fragment key={folder.id}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />}
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={`px-2 py-1 rounded-lg transition hover:bg-white/10 shrink-0 font-medium ${
                    idx === folderPath.length - 1 ? 'text-white font-semibold bg-white/5' : 'text-neutral-400'
                  }`}
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search & View Mode Switcher */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search form */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </form>

            {/* Filter Tabs */}
            <div className="flex items-center bg-neutral-900 border border-white/10 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterMode === 'all' ? 'bg-white/10 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('recent')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  filterMode === 'recent' ? 'bg-white/10 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Clock className="w-3 h-3 text-blue-400" />
                <span>Recent</span>
              </button>
              <button
                onClick={() => setFilterMode('starred')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  filterMode === 'starred' ? 'bg-white/10 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Star className="w-3 h-3 text-amber-400" />
                <span>Starred</span>
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => loadDriveFiles(true)}
              className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/5 transition"
              title="Refresh files"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* View Mode */}
            <div className="flex items-center bg-neutral-900 border border-white/10 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
                }`}
                title="Grid view"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
                }`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="my-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-red-300 mb-0.5">Google Drive Notice</h4>
            <p className="text-red-200/80 mb-2">{error}</p>
            <button
              onClick={onOpenSettings}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg font-semibold transition"
            >
              Check OAuth Client ID Settings
            </button>
          </div>
        </div>
      )}

      {/* Files Display Area */}
      <div className="flex-1 overflow-y-auto min-h-[300px]">
        {isLoading && files.length === 0 ? (
          // Animated Loading Skeletons
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white/5 rounded-2xl p-3 border border-white/5">
                <div className="w-full aspect-video bg-white/10 rounded-xl mb-2" />
                <div className="h-3 bg-white/10 rounded w-3/4 mb-1.5" />
                <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : files.length === 0 && activeAccount ? (
          // Empty state
          <div className="py-16 text-center flex flex-col items-center justify-center text-neutral-400">
            <Film className="w-12 h-12 text-neutral-600 mb-3" />
            <p className="text-sm font-medium">No video files or folders found</p>
            <p className="text-xs text-neutral-500 mt-1">
              Upload videos to this folder in Google Drive or drop a file directly into VLX.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {files.map((file) => {
              if (file.isFolder) {
                return (
                  <div
                    key={file.id}
                    onClick={() => handleOpenFolder(file.id, file.name)}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                      <Folder className="w-5 h-5 fill-current" />
                    </div>
                    <div className="truncate flex-1">
                      <h4 className="text-xs font-semibold text-white truncate group-hover:text-amber-300">
                        {file.name}
                      </h4>
                      <span className="text-[10px] text-neutral-400">Folder</span>
                    </div>
                  </div>
                );
              }

              const progressPct = getSavedProgressPercent(file.id, file.durationMillis);

              return (
                <div
                  key={file.id}
                  className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all overflow-hidden flex flex-col group relative"
                >
                  {/* Thumbnail container */}
                  <div
                    onClick={() => handlePlayDriveFile(file)}
                    className="relative w-full aspect-video bg-neutral-900 cursor-pointer overflow-hidden"
                  >
                    {file.thumbnailLink ? (
                      <img
                        src={file.thumbnailLink.replace('=s220', '=s640')}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
                        <VlcConeIcon size={32} glowColor={accentColor} />
                      </div>
                    )}

                    {/* Play Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div
                        className="p-3 rounded-full text-white shadow-xl transform scale-75 group-hover:scale-100 transition-transform"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Duration badge */}
                    {file.durationMillis && (
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] font-semibold text-white">
                        {formatTime(Math.round(file.durationMillis / 1000))}
                      </div>
                    )}

                    {/* Starred badge */}
                    {file.starred && (
                      <div className="absolute top-2 left-2 p-1 rounded-full bg-black/70 text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                    )}

                    {/* Continue Watching Progress bar */}
                    {progressPct > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                        <div
                          className="h-full"
                          style={{
                            width: `${progressPct}%`,
                            backgroundColor: accentColor,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Card Content & Action Buttons */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => handlePlayDriveFile(file)}
                        className="text-xs font-semibold text-white truncate cursor-pointer hover:text-amber-300"
                        title={file.name}
                      >
                        {file.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400">
                        <span>{formatBytes(file.size)}</span>
                        {file.modifiedTime && (
                          <span>• {new Date(file.modifiedTime).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleAddToQueueDriveFile(file)}
                        className="text-[10px] font-medium text-neutral-300 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 flex items-center gap-1 transition"
                        title="Add to queue"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Queue</span>
                      </button>

                      <button
                        onClick={() => handlePlayDriveFile(file)}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition hover:scale-105"
                        style={{ backgroundColor: accentColor }}
                      >
                        Play
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="space-y-1.5">
            {files.map((file) => {
              if (file.isFolder) {
                return (
                  <div
                    key={file.id}
                    onClick={() => handleOpenFolder(file.id, file.name)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Folder className="w-4 h-4 text-amber-400 fill-current shrink-0" />
                      <span className="text-xs font-semibold text-white truncate">{file.name}</span>
                    </div>
                    <span className="text-[11px] text-neutral-400">Folder</span>
                  </div>
                );
              }

              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition group"
                >
                  <div
                    onClick={() => handlePlayDriveFile(file)}
                    className="flex items-center gap-3 truncate cursor-pointer flex-1"
                  >
                    <FileVideo className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-medium text-white truncate group-hover:text-amber-300">
                      {file.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-[11px] font-mono text-neutral-400">
                      {file.durationMillis ? formatTime(Math.round(file.durationMillis / 1000)) : '--'}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400 w-16 text-right">
                      {formatBytes(file.size)}
                    </span>

                    <button
                      onClick={() => handleAddToQueueDriveFile(file)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white"
                      title="Add to queue"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handlePlayDriveFile(file)}
                      className="p-1.5 rounded-lg text-white"
                      style={{ backgroundColor: accentColor }}
                      title="Play video"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Pagination */}
        {nextPageToken && (
          <div className="py-6 text-center">
            <button
              onClick={() => loadDriveFiles(false, nextPageToken)}
              disabled={isLoading}
              className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition disabled:opacity-50"
            >
              {isLoading ? 'Loading more...' : 'Load More Videos'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
