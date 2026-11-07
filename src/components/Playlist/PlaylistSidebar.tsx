import React from 'react';
import { PlaylistItem } from '../../types';
import { formatTime } from '../../utils/theme';
import {
  ListMusic,
  Play,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Sparkles,
  Film,
} from 'lucide-react';
import { DEMO_VIDEOS } from '../../services/googleDriveService';

interface PlaylistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: PlaylistItem[];
  currentVideo: PlaylistItem | null;
  onSelectVideo: (item: PlaylistItem) => void;
  onRemoveItem: (id: string) => void;
  onMoveItem: (fromIdx: number, toIdx: number) => void;
  onClearPlaylist: () => void;
  onAddDemos: () => void;
  accentColor?: string;
}

export const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
  isOpen,
  onClose,
  playlist,
  currentVideo,
  onSelectVideo,
  onRemoveItem,
  onMoveItem,
  onClearPlaylist,
  onAddDemos,
  accentColor = '#ff6b00',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 glass-panel border-l border-white/10 text-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
          >
            <ListMusic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Playlist Queue</h3>
            <p className="text-xs text-neutral-400">
              {playlist.length} {playlist.length === 1 ? 'item' : 'items'} in queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {playlist.length > 0 && (
            <button
              onClick={onClearPlaylist}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-white/10 transition"
              title="Clear entire playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Playlist List Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {playlist.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center text-neutral-400">
            <Film className="w-12 h-12 text-neutral-600 mb-2" />
            <p className="text-sm font-medium">Your playlist is empty</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs mb-4">
              Add videos from Google Drive, drop files or load open-source 4K test samples.
            </p>
            <button
              onClick={onAddDemos}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition hover:scale-[1.02]"
              style={{ backgroundColor: accentColor }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Load 4K Test Demos</span>
            </button>
          </div>
        ) : (
          playlist.map((item, idx) => {
            const isCurrent = currentVideo?.id === item.id;
            return (
              <div
                key={item.id}
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-2.5 group ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/40 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border-white/5'
                }`}
              >
                {/* Index / Playing icon */}
                <div
                  onClick={() => onSelectVideo(item)}
                  className="w-6 text-center cursor-pointer shrink-0 font-mono text-xs"
                >
                  {isCurrent ? (
                    <Play
                      className="w-4 h-4 fill-current mx-auto animate-pulse"
                      style={{ color: accentColor }}
                    />
                  ) : (
                    <span className="text-neutral-500 group-hover:text-white">{idx + 1}</span>
                  )}
                </div>

                {/* Title and metadata */}
                <div
                  onClick={() => onSelectVideo(item)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <h4
                    className={`text-xs font-semibold truncate ${
                      isCurrent ? 'text-amber-300' : 'text-neutral-200'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                    <span className="font-mono">
                      {item.duration ? formatTime(item.duration) : '--:--'}
                    </span>
                    <span>•</span>
                    <span className="uppercase font-mono text-[9px] px-1 py-0.2 rounded bg-white/10">
                      {item.type}
                    </span>
                  </div>
                </div>

                {/* Move & Remove Controls */}
                <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    disabled={idx === 0}
                    onClick={() => onMoveItem(idx, idx - 1)}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === playlist.length - 1}
                    onClick={() => onMoveItem(idx, idx + 1)}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-red-400"
                    title="Remove from playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {playlist.length > 0 && (
        <div className="p-3 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={onAddDemos}
            className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Demos</span>
          </button>
          <span className="text-[11px] font-mono text-neutral-500">Auto-play next: ON</span>
        </div>
      )}
    </div>
  );
};
