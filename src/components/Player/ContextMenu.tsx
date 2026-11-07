import React, { useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Maximize,
  Camera,
  Sliders,
  SlidersHorizontal,
  Subtitles,
  Info,
  FastForward,
  Ratio,
  Volume2,
} from 'lucide-react';
import { AspectRatioMode } from '../../types';

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onToggleFullscreen: () => void;
  onScreenshot: () => void;
  onOpenEqualizer: () => void;
  onOpenFilters: () => void;
  onOpenSubtitles: () => void;
  onOpenMediaInfo: () => void;
  playbackSpeed: number;
  onSetSpeed: (speed: number) => void;
  aspectRatio: AspectRatioMode;
  onSetAspectRatio: (ratio: AspectRatioMode) => void;
  accentColor?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  isOpen,
  onClose,
  isPlaying,
  onTogglePlay,
  onToggleFullscreen,
  onScreenshot,
  onOpenEqualizer,
  onOpenFilters,
  onOpenSubtitles,
  onOpenMediaInfo,
  playbackSpeed,
  onSetSpeed,
  aspectRatio,
  onSetAspectRatio,
  accentColor = '#ff6b00',
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
      window.addEventListener('scroll', onClose);
    }
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', onClose);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Constrain position within window bounds
  const menuWidth = 220;
  const menuHeight = 360;
  const posX = Math.min(x, window.innerWidth - menuWidth - 10);
  const posY = Math.min(y, window.innerHeight - menuHeight - 10);

  return (
    <div
      ref={menuRef}
      style={{ left: posX, top: posY }}
      className="fixed z-50 w-56 rounded-xl glass-panel text-white shadow-2xl border border-white/10 p-1.5 text-xs animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-white/10 flex items-center justify-between">
        <span>VLX Player</span>
        <span className="font-mono text-amber-400">{playbackSpeed}x</span>
      </div>

      <div className="py-1">
        <button
          onClick={() => {
            onTogglePlay();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left"
        >
          {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
          <span className="ml-auto text-[10px] text-neutral-500 font-mono">Space</span>
        </button>

        <button
          onClick={() => {
            onToggleFullscreen();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left"
        >
          <Maximize className="w-4 h-4 text-blue-400" />
          <span>Toggle Fullscreen</span>
          <span className="ml-auto text-[10px] text-neutral-500 font-mono">F</span>
        </button>

        <button
          onClick={() => {
            onScreenshot();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left"
        >
          <Camera className="w-4 h-4 text-rose-400" />
          <span>Take Snapshot (PNG)</span>
          <span className="ml-auto text-[10px] text-neutral-500 font-mono">S</span>
        </button>
      </div>

      <div className="my-1 border-t border-white/10" />

      {/* Speed Quick Selector */}
      <div className="px-3 py-1">
        <span className="text-[10px] text-neutral-400 block mb-1 font-semibold flex items-center gap-1">
          <FastForward className="w-3 h-3" /> Playback Speed
        </span>
        <div className="grid grid-cols-4 gap-1">
          {[0.5, 1.0, 1.5, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => {
                onSetSpeed(s);
                onClose();
              }}
              className={`py-1 rounded text-center font-mono ${
                playbackSpeed === s
                  ? 'bg-amber-500 text-white font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio Quick Selector */}
      <div className="px-3 py-1">
        <span className="text-[10px] text-neutral-400 block mb-1 font-semibold flex items-center gap-1">
          <Ratio className="w-3 h-3" /> Aspect Ratio
        </span>
        <div className="grid grid-cols-3 gap-1">
          {(['original', '16:9', 'fill'] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                onSetAspectRatio(r);
                onClose();
              }}
              className={`py-1 rounded text-center capitalize ${
                aspectRatio === r
                  ? 'bg-amber-500 text-white font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="my-1 border-t border-white/10" />

      <div className="py-1">
        <button
          onClick={() => {
            onOpenEqualizer();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left"
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Audio Equalizer (10-Band)</span>
          <span className="ml-auto text-[10px] text-neutral-500 font-mono">B</span>
        </button>

        <button
          onClick={() => {
            onOpenFilters();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left"
        >
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          <span>Video Filters & Adjustments</span>
        </button>

        <button
          onClick={() => {
            onOpenSubtitles();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left"
        >
          <Subtitles className="w-4 h-4 text-yellow-400" />
          <span>Subtitles & Delay</span>
          <span className="ml-auto text-[10px] text-neutral-500 font-mono">V</span>
        </button>

        <button
          onClick={() => {
            onOpenMediaInfo();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left"
        >
          <Info className="w-4 h-4 text-neutral-400" />
          <span>Stream Information</span>
        </button>
      </div>
    </div>
  );
};
