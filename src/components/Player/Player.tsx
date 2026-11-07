import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PlaylistItem,
  PlayerSettings,
  AspectRatioMode,
  VideoFilters,
  SubtitleTrack,
  MediaInfo,
} from '../../types';
import { Controls } from './Controls';
import { Visualizer } from './Visualizer';
import { EqualizerModal } from './EqualizerModal';
import { VideoFiltersModal } from './VideoFiltersModal';
import { SubtitlesModal } from './SubtitlesModal';
import { MediaInfoModal } from './MediaInfoModal';
import { ShortcutsModal } from './ShortcutsModal';
import { ContextMenu } from './ContextMenu';
import { audioEngine } from '../../services/audioEngine';
import { getActiveCue, parseSubtitleText } from '../../services/subtitleService';
import { useAmbientLight } from '../../hooks/useAmbientLight';
import { formatTime } from '../../utils/theme';
import {
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  Maximize2,
  Tv,
  ArrowRight,
  RotateCcw,
  RotateCw,
} from 'lucide-react';

interface PlayerProps {
  currentVideo: PlaylistItem | null;
  settings: PlayerSettings;
  onUpdateSettings: (settings: Partial<PlayerSettings>) => void;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
  hasNextVideo?: boolean;
  hasPrevVideo?: boolean;
  onBackToBrowser?: () => void;
  accentColor?: string;
  onProgressUpdate?: (item: PlaylistItem, currentTime: number, duration: number) => void;
}

export const Player: React.FC<PlayerProps> = ({
  currentVideo,
  settings,
  onUpdateSettings,
  onNextVideo,
  onPrevVideo,
  hasNextVideo = false,
  hasPrevVideo = false,
  onBackToBrowser,
  accentColor = '#ff6b00',
  onProgressUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedRanges, setBufferedRanges] = useState<{ start: number; end: number }[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [useEmbeddedPlayer, setUseEmbeddedPlayer] = useState(false);

  // A-B Loop
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);

  // Subtitles
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [activeSubtitleTrackId, setActiveSubtitleTrackId] = useState<string | null>(null);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');

  // Modals state
  const [showEqualizerModal, setShowEqualizerModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showSubtitlesModal, setShowSubtitlesModal] = useState(false);
  const [showMediaInfoModal, setShowMediaInfoModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Context menu
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Double-tap mobile ripple feedback
  const [rippleFeedback, setRippleFeedback] = useState<{ side: 'left' | 'right'; text: string } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  // Inactivity controls timeout
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ambient light
  const { ambientGlow } = useAmbientLight(videoRef.current, settings.ambientLighting);

  // Load subtitles from video if provided
  useEffect(() => {
    if (currentVideo?.subtitleFiles && currentVideo.subtitleFiles.length > 0) {
      const tracks: SubtitleTrack[] = currentVideo.subtitleFiles.map((sf, index) => {
        let cues: any[] = [];
        if (sf.content) {
          cues = parseSubtitleText(sf.content);
        }
        return {
          id: `track_${index}`,
          label: sf.name,
          cues,
          source: 'drive',
        };
      });
      setSubtitleTracks(tracks);
      if (tracks.length > 0) {
        setActiveSubtitleTrackId(tracks[0].id);
      }
    } else {
      setSubtitleTracks([]);
      setActiveSubtitleTrackId(null);
    }
  }, [currentVideo]);

  // Video source loading & resume position logic
  useEffect(() => {
    setPlaybackError(null);
    setUseEmbeddedPlayer(false);
    setCurrentTime(0);
    setDuration(0);
    setLoopA(null);
    setLoopB(null);

    if (!currentVideo) return;

    // Check if format is likely unsupported by browser (e.g. mkv, avi, wmv)
    const ext = currentVideo.title.slice(currentVideo.title.lastIndexOf('.')).toLowerCase();
    const isUnusualFormat = ['.mkv', '.avi', '.wmv', '.flv', '.ts'].includes(ext);

    if (isUnusualFormat && currentVideo.embeddedUrl && !currentVideo.url) {
      setUseEmbeddedPlayer(true);
      return;
    }

    // Check saved position
    const savedPos = localStorage.getItem(`vlx_pos_${currentVideo.id}`);
    if (savedPos && videoRef.current) {
      const pos = parseFloat(savedPos);
      if (!isNaN(pos) && pos > 5) {
        videoRef.current.currentTime = pos;
        setCurrentTime(pos);
      }
    }

    if (videoRef.current) {
      videoRef.current.playbackRate = settings.playbackSpeed;
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [currentVideo]);

  // Attach Web Audio Engine on mount/user interaction
  const attachAudio = useCallback(() => {
    if (videoRef.current) {
      audioEngine.attach(videoRef.current);
      audioEngine.setVolume(settings.volume);
      audioEngine.setFilterGains(settings.equalizerGains);
      audioEngine.resume();
    }
  }, [settings.volume, settings.equalizerGains]);

  // Controls auto-hide timer
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [isPlaying]);

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  // Play / Pause toggle
  const togglePlay = () => {
    attachAudio();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        console.warn('Play interrupted:', e);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  };

  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // Seeking
  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
    resetControlsTimeout();
  };

  const skipForward = () => {
    if (videoRef.current) {
      const target = Math.min(duration, videoRef.current.currentTime + settings.skipInterval);
      videoRef.current.currentTime = target;
      setCurrentTime(target);
      triggerRipple('right', `+${settings.skipInterval}s`);
    }
    resetControlsTimeout();
  };

  const skipBackward = () => {
    if (videoRef.current) {
      const target = Math.max(0, videoRef.current.currentTime - settings.skipInterval);
      videoRef.current.currentTime = target;
      setCurrentTime(target);
      triggerRipple('left', `-${settings.skipInterval}s`);
    }
    resetControlsTimeout();
  };

  const triggerRipple = (side: 'left' | 'right', text: string) => {
    setRippleFeedback({ side, text });
    setTimeout(() => setRippleFeedback(null), 700);
  };

  // Volume
  const handleVolumeChange = (vol: number) => {
    onUpdateSettings({ volume: vol });
    audioEngine.setVolume(vol);
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(settings.volume);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  // Speed
  const handleSpeedChange = (speed: number) => {
    onUpdateSettings({ playbackSpeed: speed });
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // A-B Loop
  const handleSetLoopPoint = () => {
    if (loopA === null) {
      setLoopA(currentTime);
    } else if (loopB === null && currentTime > loopA) {
      setLoopB(currentTime);
    } else {
      setLoopA(currentTime);
      setLoopB(null);
    }
  };

  const handleClearLoop = () => {
    setLoopA(null);
    setLoopB(null);
  };

  // Aspect Ratio
  const cycleAspectRatio = () => {
    const modes: AspectRatioMode[] = ['original', '16:9', '4:3', 'fill', 'stretch'];
    const nextIdx = (modes.indexOf(settings.aspectRatio) + 1) % modes.length;
    onUpdateSettings({ aspectRatio: modes[nextIdx] });
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Picture in Picture
  const togglePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP error:', e);
    }
  };

  // Screenshot capture PNG
  const captureScreenshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Apply video filters to screenshot if needed
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      const safeTitle = (currentVideo?.title || 'video').replace(/[^a-z0-9_-]/gi, '_');
      a.download = `VLX_Screenshot_${safeTitle}_${Math.floor(video.currentTime)}s.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.warn('Screenshot capture failed (possibly cross-origin frame):', err);
    }
  };

  // Next frame step (~0.04s)
  const stepFrame = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 0.0416);
  };

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // A-B loop check
    if (loopA !== null && loopB !== null && loopB > loopA) {
      if (time >= loopB) {
        videoRef.current.currentTime = loopA;
        return;
      }
    }

    // Subtitles cue lookup
    if (settings.subtitleSettings.enabled && activeSubtitleTrackId) {
      const activeTrack = subtitleTracks.find((t) => t.id === activeSubtitleTrackId);
      if (activeTrack) {
        const cue = getActiveCue(activeTrack.cues, time, settings.subtitleSettings.delay);
        setCurrentSubtitleText(cue ? cue.text : '');
      }
    } else {
      setCurrentSubtitleText('');
    }

    // Save progress periodically
    if (currentVideo && Math.floor(time) % 4 === 0) {
      localStorage.setItem(`vlx_pos_${currentVideo.id}`, String(time));
      if (onProgressUpdate && duration > 0) {
        onProgressUpdate(currentVideo, time, duration);
      }
    }
  };

  const handleProgress = () => {
    if (!videoRef.current) return;
    const buffered = videoRef.current.buffered;
    const ranges: { start: number; end: number }[] = [];
    for (let i = 0; i < buffered.length; i++) {
      ranges.push({ start: buffered.start(i), end: buffered.end(i) });
    }
    setBufferedRanges(ranges);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (settings.repeatMode === 'one' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    } else if (onNextVideo) {
      onNextVideo();
    }
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setIsPlaying(false);
    if (currentVideo?.embeddedUrl) {
      setPlaybackError(
        'Direct browser playback failed for this container/codec. Switch to the Google Drive preview transcoder below.'
      );
    } else {
      setPlaybackError('Playback error occurred. The video stream could not be loaded.');
    }
  };

  // Double-tap on mobile detection
  const handleVideoAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (now - lastTapRef.current.time < 300) {
      // Double tap!
      if (clickX < width * 0.35) {
        skipBackward();
      } else if (clickX > width * 0.65) {
        skipForward();
      } else {
        toggleFullscreen();
      }
    } else {
      // Single tap - toggle controls or play
      togglePlay();
    }
    lastTapRef.current = { time: now, x: clickX };
  };

  // Context Menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  // VLC Keyboard Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(2.0, settings.volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, settings.volume - 0.05));
          break;
        case '[':
          e.preventDefault();
          handleSpeedChange(Math.max(0.25, settings.playbackSpeed - 0.25));
          break;
        case ']':
          e.preventDefault();
          handleSpeedChange(Math.min(4.0, settings.playbackSpeed + 0.25));
          break;
        case '=':
        case 'Backspace':
          e.preventDefault();
          handleSpeedChange(1.0);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          captureScreenshot();
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          stepFrame();
          break;
        case 'n':
        case 'N':
          if (onNextVideo) onNextVideo();
          break;
        case 'p':
        case 'P':
          if (onPrevVideo) onPrevVideo();
          break;
        case 'l':
        case 'L': {
          const nextRep = settings.repeatMode === 'off' ? 'one' : settings.repeatMode === 'one' ? 'all' : 'off';
          onUpdateSettings({ repeatMode: nextRep });
          break;
        }
        case 'c':
        case 'C':
          cycleAspectRatio();
          break;
        case 'v':
        case 'V':
          onUpdateSettings({
            subtitleSettings: {
              ...settings.subtitleSettings,
              enabled: !settings.subtitleSettings.enabled,
            },
          });
          break;
        case 'b':
        case 'B':
          setShowEqualizerModal(true);
          break;
        case '?':
          setShowShortcutsModal(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings, isPlaying, duration, activeSubtitleTrackId, subtitleTracks]);

  // Compute CSS filter style for video
  const videoFilterStyle: React.CSSProperties = {
    filter: `brightness(${settings.videoFilters.brightness}) contrast(${settings.videoFilters.contrast}) saturate(${settings.videoFilters.saturation}) hue-rotate(${settings.videoFilters.hue}deg)`,
    transform: `rotate(${settings.videoFilters.rotate}deg) scaleX(${settings.videoFilters.flipH ? -1 : 1}) scaleY(${settings.videoFilters.flipV ? -1 : 1})`,
    transition: 'filter 0.1s ease, transform 0.2s ease',
  };

  // Aspect ratio classes
  const getAspectRatioClass = () => {
    switch (settings.aspectRatio) {
      case '16:9':
        return 'aspect-video object-contain w-full h-full';
      case '4:3':
        return 'aspect-[4/3] object-contain w-full h-full';
      case 'fill':
        return 'w-full h-full object-cover';
      case 'stretch':
        return 'w-full h-full object-fill';
      case 'original':
      default:
        return 'w-full h-full object-contain';
    }
  };

  // Subtitle styling
  const getSubtitleFontSize = () => {
    switch (settings.subtitleSettings.fontSize) {
      case 'sm':
        return 'text-sm sm:text-base';
      case 'lg':
        return 'text-xl sm:text-2xl';
      case 'xl':
        return 'text-2xl sm:text-3xl font-bold';
      case 'md':
      default:
        return 'text-base sm:text-xl font-medium';
    }
  };

  const mediaInfoData: MediaInfo | null = currentVideo
    ? {
        filename: currentVideo.title,
        videoWidth: videoRef.current?.videoWidth || 1920,
        videoHeight: videoRef.current?.videoHeight || 1080,
        duration: duration || currentVideo.duration || 0,
        fileSize: currentVideo.size,
        mimeType: currentVideo.mimeType,
        playbackRate: settings.playbackSpeed,
      }
    : null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
      className={`relative flex flex-col bg-black text-white overflow-hidden transition-all duration-300 ${
        isTheater ? 'w-full h-[85vh]' : 'w-full aspect-video max-h-[82vh] rounded-2xl shadow-2xl border border-white/10'
      }`}
      style={{
        boxShadow: settings.ambientLighting ? `0 0 80px 10px ${accentColor}33` : undefined,
      }}
    >
      {/* Dynamic Ambient Glow Halo Background */}
      {settings.ambientLighting && (
        <div
          className="absolute inset-[-30%] pointer-events-none transition-all duration-700 blur-3xl opacity-70 -z-10"
          style={{ background: ambientGlow }}
        />
      )}

      {/* Main Video Viewport Area */}
      <div
        onClick={handleVideoAreaClick}
        className="relative flex-1 w-full h-full flex items-center justify-center bg-black cursor-pointer overflow-hidden"
      >
        {useEmbeddedPlayer && currentVideo?.embeddedUrl ? (
          // Google Drive Embedded Preview Player (Transcoded Fallback)
          <div className="w-full h-full relative z-10 bg-black flex flex-col items-center justify-center">
            <iframe
              src={currentVideo.embeddedUrl}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              title={currentVideo.title}
            />
            <div className="absolute top-4 left-4 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUseEmbeddedPlayer(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-xs text-white border border-white/20 flex items-center gap-2 shadow-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return to VLX Native Player</span>
              </button>
            </div>
          </div>
        ) : (
          // Native HTML5 Video Element with Full Audio & Video Effects
          <>
            <video
              ref={videoRef}
              src={currentVideo?.url}
              style={videoFilterStyle}
              className={getAspectRatioClass()}
              onTimeUpdate={handleTimeUpdate}
              onProgress={handleProgress}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration);
                  setIsLoading(false);
                  attachAudio();
                }
              }}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => {
                setIsLoading(false);
                setIsPlaying(true);
                attachAudio();
              }}
              onPause={() => setIsPlaying(false)}
              onEnded={handleEnded}
              onError={handleVideoError}
              playsInline
              crossOrigin="anonymous"
            />

            {/* Audio Visualizer Overlay (toggleable or when paused) */}
            {settings.audioVisualizer && (
              <div className="absolute bottom-16 left-0 right-0 z-20 pointer-events-none px-6">
                <Visualizer isPlaying={isPlaying} accentColor={accentColor} mode="bars" />
              </div>
            )}
          </>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-30">
            <div
              className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: `${accentColor} transparent transparent transparent` }}
            />
          </div>
        )}

        {/* Double-tap ripple feedback (mobile gesture feedback) */}
        {rippleFeedback && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 px-6 py-4 rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 text-white font-bold text-lg pointer-events-none z-40 animate-out fade-out zoom-out duration-500 flex items-center gap-2 ${
              rippleFeedback.side === 'left' ? 'left-12' : 'right-12'
            }`}
          >
            {rippleFeedback.side === 'left' ? <RotateCcw className="w-6 h-6 text-amber-400" /> : <RotateCw className="w-6 h-6 text-amber-400" />}
            <span>{rippleFeedback.text}</span>
          </div>
        )}

        {/* Fallback & Playback Error Alert Overlay */}
        {playbackError && (
          <div className="absolute inset-0 bg-neutral-950/90 z-40 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 max-w-md">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white mb-1">Playback Limitation Encountered</h3>
              <p className="text-xs text-neutral-300 mb-4">{playbackError}</p>

              {currentVideo?.embeddedUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUseEmbeddedPlayer(true);
                    setPlaybackError(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-lg flex items-center justify-center gap-2 transition hover:scale-[1.02]"
                  style={{ backgroundColor: accentColor }}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch Google Drive Cloud Transcoder</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Subtitles Overlay */}
        {settings.subtitleSettings.enabled && currentSubtitleText && (
          <div
            className="absolute left-0 right-0 z-30 flex justify-center pointer-events-none px-6 transition-all duration-150"
            style={{ bottom: `${settings.subtitleSettings.verticalPosition}%` }}
          >
            <div
              className={`vlx-subtitles px-4 py-1.5 rounded-lg text-center max-w-3xl leading-relaxed ${getSubtitleFontSize()}`}
              style={{
                color: settings.subtitleSettings.color,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              {currentSubtitleText.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Top Header Overlay Bar (fades with controls) */}
        <div
          className={`absolute top-0 left-0 right-0 z-40 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 truncate">
            {onBackToBrowser && (
              <button
                onClick={onBackToBrowser}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1.5 text-xs font-semibold"
                title="Back to file browser"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Drive Files</span>
              </button>
            )}

            <div className="truncate">
              <h1 className="text-sm sm:text-base font-bold text-white truncate drop-shadow-md">
                {currentVideo ? currentVideo.title : 'No Video Loaded'}
              </h1>
              {currentVideo?.type && (
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  Source: {currentVideo.type}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick aspect ratio badge */}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-mono capitalize">
              {settings.aspectRatio}
            </span>
            {/* Quick speed badge */}
            {settings.playbackSpeed !== 1 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                {settings.playbackSpeed}x
              </span>
            )}
          </div>
        </div>

        {/* Bottom Controls Overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-40 transition-opacity duration-300 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Controls
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onStop={handleStop}
            currentTime={currentTime}
            duration={duration}
            bufferedRanges={bufferedRanges}
            onSeek={handleSeek}
            volume={settings.volume}
            onVolumeChange={handleVolumeChange}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            playbackSpeed={settings.playbackSpeed}
            onSpeedChange={handleSpeedChange}
            onSkipBackward={skipBackward}
            onSkipForward={skipForward}
            skipInterval={settings.skipInterval}
            onNextTrack={onNextVideo}
            onPrevTrack={onPrevVideo}
            hasNextTrack={hasNextVideo}
            hasPrevTrack={hasPrevVideo}
            repeatMode={settings.repeatMode}
            onToggleRepeat={() => {
              const modes: ('off' | 'one' | 'all')[] = ['off', 'one', 'all'];
              const next = modes[(modes.indexOf(settings.repeatMode) + 1) % modes.length];
              onUpdateSettings({ repeatMode: next });
            }}
            shuffle={settings.shuffle}
            onToggleShuffle={() => onUpdateSettings({ shuffle: !settings.shuffle })}
            loopA={loopA}
            loopB={loopB}
            onSetLoopPoint={handleSetLoopPoint}
            onClearLoop={handleClearLoop}
            aspectRatio={settings.aspectRatio}
            onCycleAspectRatio={cycleAspectRatio}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isTheater={isTheater}
            onToggleTheater={() => setIsTheater(!isTheater)}
            onTogglePip={togglePip}
            onCaptureScreenshot={captureScreenshot}
            onOpenEqualizer={() => setShowEqualizerModal(true)}
            onOpenFilters={() => setShowFiltersModal(true)}
            onOpenSubtitles={() => setShowSubtitlesModal(true)}
            onOpenMediaInfo={() => setShowMediaInfoModal(true)}
            subtitlesEnabled={settings.subtitleSettings.enabled}
            accentColor={accentColor}
          />
        </div>
      </div>

      {/* Modals & Dialogs */}
      <EqualizerModal
        isOpen={showEqualizerModal}
        onClose={() => setShowEqualizerModal(false)}
        gains={settings.equalizerGains}
        onGainsChange={(newGains, preset) => {
          onUpdateSettings({
            equalizerGains: newGains,
            equalizerPreset: preset || settings.equalizerPreset,
          });
        }}
        currentPreset={settings.equalizerPreset}
        accentColor={accentColor}
      />

      <VideoFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        filters={settings.videoFilters}
        onChange={(filters) => onUpdateSettings({ videoFilters: filters })}
        accentColor={accentColor}
      />

      <SubtitlesModal
        isOpen={showSubtitlesModal}
        onClose={() => setShowSubtitlesModal(false)}
        settings={settings.subtitleSettings}
        onSettingsChange={(subtitleSettings) => onUpdateSettings({ subtitleSettings })}
        tracks={subtitleTracks}
        activeTrackId={activeSubtitleTrackId}
        onSelectTrack={(trackId) => setActiveSubtitleTrackId(trackId)}
        onAddTrack={(track) => setSubtitleTracks((prev) => [...prev, track])}
        accentColor={accentColor}
      />

      <MediaInfoModal
        isOpen={showMediaInfoModal}
        onClose={() => setShowMediaInfoModal(false)}
        info={mediaInfoData}
        accentColor={accentColor}
      />

      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        accentColor={accentColor}
      />

      {contextMenuPos && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          isOpen={true}
          onClose={() => setContextMenuPos(null)}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onToggleFullscreen={toggleFullscreen}
          onScreenshot={captureScreenshot}
          onOpenEqualizer={() => setShowEqualizerModal(true)}
          onOpenFilters={() => setShowFiltersModal(true)}
          onOpenSubtitles={() => setShowSubtitlesModal(true)}
          onOpenMediaInfo={() => setShowMediaInfoModal(true)}
          playbackSpeed={settings.playbackSpeed}
          onSetSpeed={handleSpeedChange}
          aspectRatio={settings.aspectRatio}
          onSetAspectRatio={(ratio) => onUpdateSettings({ aspectRatio: ratio })}
          accentColor={accentColor}
        />
      )}
    </div>
  );
};
