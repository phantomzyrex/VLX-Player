import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Sliders,
  SlidersHorizontal,
  Subtitles,
  Repeat,
  Repeat1,
  Shuffle,
  Camera,
  PictureInPicture2,
  Tv,
  Info,
  Ratio,
  Bookmark,
} from 'lucide-react';
import { AspectRatioMode } from '../../types';
import { formatTime } from '../../utils/theme';

interface ControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  currentTime: number;
  duration: number;
  bufferedRanges: { start: number; end: number }[];
  onSeek: (time: number) => void;
  volume: number; // 0 to 2.0
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  skipInterval: number;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  hasNextTrack?: boolean;
  hasPrevTrack?: boolean;
  repeatMode: 'off' | 'one' | 'all';
  onToggleRepeat: () => void;
  shuffle: boolean;
  onToggleShuffle: () => void;
  loopA: number | null;
  loopB: number | null;
  onSetLoopPoint: () => void;
  onClearLoop: () => void;
  aspectRatio: AspectRatioMode;
  onCycleAspectRatio: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isTheater: boolean;
  onToggleTheater: () => void;
  onTogglePip: () => void;
  onCaptureScreenshot: () => void;
  onOpenEqualizer: () => void;
  onOpenFilters: () => void;
  onOpenSubtitles: () => void;
  onOpenMediaInfo: () => void;
  subtitlesEnabled: boolean;
  accentColor?: string;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onStop,
  currentTime,
  duration,
  bufferedRanges,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  playbackSpeed,
  onSpeedChange,
  onSkipBackward,
  onSkipForward,
  skipInterval,
  onNextTrack,
  onPrevTrack,
  hasNextTrack = false,
  hasPrevTrack = false,
  repeatMode,
  onToggleRepeat,
  shuffle,
  onToggleShuffle,
  loopA,
  loopB,
  onSetLoopPoint,
  onClearLoop,
  aspectRatio,
  onCycleAspectRatio,
  isFullscreen,
  onToggleFullscreen,
  isTheater,
  onToggleTheater,
  onTogglePip,
  onCaptureScreenshot,
  onOpenEqualizer,
  onOpenFilters,
  onOpenSubtitles,
  onOpenMediaInfo,
  subtitlesEnabled,
  accentColor = '#ff6b00',
}) => {
  const [showRemainingTime, setShowRemainingTime] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosPercent, setHoverPosPercent] = useState<number>(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = offsetX / rect.width;
    setHoverPosPercent(percent * 100);
    setHoverTime(percent * duration);

    if (isScrubbing) {
      onSeek(percent * duration);
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = offsetX / rect.width;
    onSeek(percent * duration);
  };

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Volume icon determination
  const effectiveVolume = isMuted ? 0 : volume;
  const renderVolumeIcon = () => {
    if (effectiveVolume === 0) return <VolumeX className="w-4 h-4 text-red-400" />;
    if (effectiveVolume <= 0.5) return <Volume className="w-4 h-4 text-neutral-300" />;
    if (effectiveVolume <= 1.0) return <Volume1 className="w-4 h-4 text-neutral-200" />;
    return <Volume2 className="w-4 h-4 text-amber-400" />;
  };

  const speedOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];

  return (
    <div className="w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-6 pb-3 px-3 sm:px-5 select-none pointer-events-auto">
      {/* 1. Seek / Progress Bar */}
      <div className="relative group/seeker mb-3">
        {/* Hover preview timestamp tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute -top-8 -translate-x-1/2 px-2 py-0.5 rounded bg-neutral-900/90 border border-white/20 text-white font-mono text-[11px] shadow-lg pointer-events-none z-30"
            style={{ left: `${hoverPosPercent}%` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}

        <div
          ref={progressBarRef}
          onMouseMove={handleProgressBarMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          onMouseDown={() => setIsScrubbing(true)}
          onMouseUp={() => setIsScrubbing(false)}
          onClick={handleProgressBarClick}
          className="relative h-2 group-hover/seeker:h-3 bg-white/20 rounded-full cursor-pointer transition-all duration-150 overflow-visible"
        >
          {/* Buffered range chunks */}
          {duration > 0 &&
            bufferedRanges.map((chunk, idx) => {
              const startPct = (chunk.start / duration) * 100;
              const widthPct = ((chunk.end - chunk.start) / duration) * 100;
              return (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 bg-white/30 rounded-full"
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                />
              );
            })}

          {/* Played progress fill */}
          <div
            className="absolute top-0 bottom-0 rounded-full transition-all duration-75 relative"
            style={{
              width: `${playedPercent}%`,
              backgroundColor: accentColor,
              boxShadow: `0 0 10px ${accentColor}`,
            }}
          >
            {/* Scrubber thumb */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-orange-500 transform scale-0 group-hover/seeker:scale-100 transition-transform duration-150"
              style={{ borderColor: accentColor }}
            />
          </div>

          {/* A-B Loop markers */}
          {duration > 0 && loopA !== null && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-amber-400 z-10"
              style={{ left: `${(loopA / duration) * 100}%` }}
              title={`Loop Point A: ${formatTime(loopA)}`}
            />
          )}
          {duration > 0 && loopB !== null && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-emerald-400 z-10"
              style={{ left: `${(loopB / duration) * 100}%` }}
              title={`Loop Point B: ${formatTime(loopB)}`}
            />
          )}
        </div>
      </div>

      {/* 2. Main Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-white">
        {/* Left Side: Playback & Volume */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Previous Track */}
          <button
            onClick={onPrevTrack}
            disabled={!hasPrevTrack}
            className="p-1.5 text-neutral-300 hover:text-white disabled:text-neutral-600 disabled:cursor-not-allowed hover:bg-white/10 rounded-lg transition"
            title="Previous video (P)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Skip -10s */}
          <button
            onClick={onSkipBackward}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition flex items-center"
            title={`Skip backward ${skipInterval}s (←)`}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[9px] font-mono ml-0.5">{skipInterval}</span>
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={onTogglePlay}
            className="p-2 sm:p-2.5 rounded-xl text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 14px ${accentColor}88`,
            }}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          {/* Stop Button */}
          <button
            onClick={onStop}
            className="p-1.5 text-neutral-300 hover:text-red-400 hover:bg-white/10 rounded-lg transition"
            title="Stop playback and reset to beginning"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          {/* Skip +10s */}
          <button
            onClick={onSkipForward}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition flex items-center"
            title={`Skip forward ${skipInterval}s (→)`}
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-[9px] font-mono ml-0.5">{skipInterval}</span>
          </button>

          {/* Next Track */}
          <button
            onClick={onNextTrack}
            disabled={!hasNextTrack}
            className="p-1.5 text-neutral-300 hover:text-white disabled:text-neutral-600 disabled:cursor-not-allowed hover:bg-white/10 rounded-lg transition"
            title="Next video (N)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Time Display */}
          <div
            onClick={() => setShowRemainingTime(!showRemainingTime)}
            className="cursor-pointer ml-1 px-2 py-0.5 rounded hover:bg-white/10 text-xs font-mono tracking-tight text-neutral-300"
            title="Click to toggle remaining time"
          >
            <span className="font-semibold text-white">{formatTime(currentTime)}</span>
            <span className="text-neutral-500 mx-1">/</span>
            <span>
              {showRemainingTime && duration > 0
                ? `-${formatTime(Math.max(0, duration - currentTime))}`
                : formatTime(duration)}
            </span>
          </div>

          {/* Volume Group (with 200% VLC Boost) */}
          <div className="flex items-center gap-1.5 ml-2 group/vol">
            <button
              onClick={onToggleMute}
              className="p-1.5 hover:bg-white/10 rounded-lg transition"
              title="Mute / Unmute (M)"
            >
              {renderVolumeIcon()}
            </button>

            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={2.0}
                step={0.05}
                value={effectiveVolume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-16 sm:w-20 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                title={`Volume: ${Math.round(effectiveVolume * 100)}%`}
              />
              {effectiveVolume > 1.0 && (
                <span className="ml-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/40">
                  {Math.round(effectiveVolume * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: VLC Tools & Modes */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* A-B Loop Button */}
          <button
            onClick={loopB !== null ? onClearLoop : onSetLoopPoint}
            className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition ${
              loopA !== null
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
            title={
              loopA === null
                ? 'Set A-B Loop Point A'
                : loopB === null
                ? `Point A at ${formatTime(loopA)}. Click to set Point B`
                : `Looping ${formatTime(loopA)} - ${formatTime(loopB)}. Click to clear`
            }
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {loopA === null ? 'A-B' : loopB === null ? 'A→' : 'A⇄B'}
            </span>
          </button>

          {/* Repeat Mode */}
          <button
            onClick={onToggleRepeat}
            className={`p-1.5 rounded-lg transition ${
              repeatMode !== 'off'
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title={`Repeat mode: ${repeatMode} (L)`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>

          {/* Shuffle Mode */}
          <button
            onClick={onToggleShuffle}
            className={`p-1.5 rounded-lg transition ${
              shuffle ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title={`Shuffle playlist: ${shuffle ? 'ON' : 'OFF'}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Speed Selector Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-2 py-1 text-xs font-mono font-medium rounded-lg hover:bg-white/10 transition text-neutral-200 flex items-center gap-0.5"
              title="Playback speed ([ and ])"
            >
              <span>{playbackSpeed}x</span>
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-9 right-0 glass-panel rounded-xl py-1 text-xs shadow-2xl border border-white/10 w-24 z-40">
                {speedOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onSpeedChange(s);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1 font-mono transition ${
                      playbackSpeed === s ? 'bg-amber-500 text-white font-bold' : 'hover:bg-white/10 text-neutral-300'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Aspect Ratio Button */}
          <button
            onClick={onCycleAspectRatio}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition text-xs font-mono capitalize"
            title={`Aspect ratio: ${aspectRatio} (C)`}
          >
            <Ratio className="w-4 h-4" />
          </button>

          {/* Subtitles Button */}
          <button
            onClick={onOpenSubtitles}
            className={`p-1.5 rounded-lg transition ${
              subtitlesEnabled
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title="Subtitles & Closed Captions (V)"
          >
            <Subtitles className="w-4 h-4" />
          </button>

          {/* Audio Equalizer Button */}
          <button
            onClick={onOpenEqualizer}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="10-Band Graphic Equalizer (B)"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Video Filters Button */}
          <button
            onClick={onOpenFilters}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Video filters & adjustments"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Screenshot Capture Button */}
          <button
            onClick={onCaptureScreenshot}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Take snapshot frame (S)"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Media Info Button */}
          <button
            onClick={onOpenMediaInfo}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Stream & codec information"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Theater Mode */}
          <button
            onClick={onToggleTheater}
            className={`p-1.5 rounded-lg transition hidden md:block ${
              isTheater ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title="Theater mode"
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Picture in Picture */}
          <button
            onClick={onTogglePip}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Picture-in-Picture mode"
          >
            <PictureInPicture2 className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Toggle fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
