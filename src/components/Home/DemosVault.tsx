import React from 'react';
import { PlaylistItem } from '../../types';
import { DEMO_VIDEOS } from '../../services/googleDriveService';
import { formatBytes, formatTime } from '../../utils/theme';
import { Play, Plus, Sparkles, Film, Subtitles, Check } from 'lucide-react';

interface DemosVaultProps {
  onPlay: (item: PlaylistItem) => void;
  onAddToQueue: (item: PlaylistItem) => void;
  currentVideoId?: string;
  accentColor?: string;
}

export const DemosVault: React.FC<DemosVaultProps> = ({
  onPlay,
  onAddToQueue,
  currentVideoId,
  accentColor = '#ff6b00',
}) => {
  return (
    <div className="w-full rounded-2xl glass-panel p-4 sm:p-6 border border-white/10 text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">4K Open Movie Demo Vault</h2>
            <p className="text-xs text-neutral-400">
              High-definition test films with surround audio & closed captions ready to play
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-neutral-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          No Google Sign-in Required
        </span>
      </div>

      {/* Grid of Demos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DEMO_VIDEOS.map((demo) => {
          const isPlaying = currentVideoId === demo.id;
          return (
            <div
              key={demo.id}
              className={`rounded-2xl border transition-all overflow-hidden flex flex-col group ${
                isPlaying
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-xl'
                  : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20'
              }`}
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => onPlay(demo)}
                className="relative w-full aspect-video bg-neutral-900 cursor-pointer overflow-hidden"
              >
                {demo.thumbnail && (
                  <img
                    src={demo.thumbnail}
                    alt={demo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                {/* Overlay Play */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div
                    className="p-3 rounded-full text-white shadow-xl transform scale-75 group-hover:scale-100 transition-transform"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Duration & Subtitle Badges */}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] font-semibold text-white">
                  {demo.duration ? formatTime(demo.duration) : '00:00'}
                </div>

                {demo.subtitleFiles && demo.subtitleFiles.length > 0 && (
                  <div className="absolute top-2 right-2 p-1 rounded bg-black/75 text-amber-300" title="Includes English Subtitles">
                    <Subtitles className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Info & Action Buttons */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4
                    onClick={() => onPlay(demo)}
                    className="text-xs font-bold text-white truncate cursor-pointer hover:text-amber-300"
                    title={demo.title}
                  >
                    {demo.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400 font-mono">
                    <span>{formatBytes(demo.size)}</span>
                    <span>•</span>
                    <span className="uppercase text-amber-400">1080p / 4K</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
                  <button
                    onClick={() => onAddToQueue(demo)}
                    className="text-[10px] font-medium text-neutral-300 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Queue</span>
                  </button>

                  <button
                    onClick={() => onPlay(demo)}
                    className="text-[10px] font-bold px-3 py-1 rounded-lg text-white transition hover:scale-105 flex items-center gap-1"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isPlaying ? 'Playing' : 'Play Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
