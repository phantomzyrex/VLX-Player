import React from 'react';
import { MediaInfo } from '../../types';
import { formatBytes, formatTime } from '../../utils/theme';
import { Info, X, Film, Activity, Cpu, HardDrive } from 'lucide-react';

interface MediaInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  info: MediaInfo | null;
  accentColor?: string;
}

export const MediaInfoModal: React.FC<MediaInfoModalProps> = ({
  isOpen,
  onClose,
  info,
  accentColor = '#ff6b00',
}) => {
  if (!isOpen || !info) return null;

  const aspectRatio =
    info.videoWidth && info.videoHeight
      ? (info.videoWidth / info.videoHeight).toFixed(2)
      : '16:9';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 text-white shadow-2xl border border-white/10 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Stream & Media Information</h2>
              <p className="text-xs text-neutral-400">VLC Codec & Demuxer Telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content details list */}
        <div className="my-5 space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold mb-1">
              File Title / Source
            </span>
            <span className="font-mono text-neutral-200 text-sm break-all font-medium">
              {info.filename}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
              <Film className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                  Resolution
                </span>
                <span className="font-mono text-sm font-semibold text-white">
                  {info.videoWidth ? `${info.videoWidth} × ${info.videoHeight}` : 'Audio only / Unknown'}
                </span>
                <span className="text-[10px] text-neutral-500 block">Aspect: {aspectRatio}:1</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
              <Activity className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                  Duration
                </span>
                <span className="font-mono text-sm font-semibold text-white">
                  {formatTime(info.duration)}
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  Speed: {info.playbackRate}x
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
              <HardDrive className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                  File Size
                </span>
                <span className="font-mono text-sm font-semibold text-white">
                  {formatBytes(info.fileSize)}
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  {info.fileSize && info.duration
                    ? `~${Math.round((info.fileSize * 8) / (info.duration * 1000))} kbps`
                    : 'Variable bitrate'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                  MIME / Format
                </span>
                <span className="font-mono text-xs font-semibold text-white truncate block max-w-[130px]" title={info.mimeType}>
                  {info.mimeType || 'video/mp4'}
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  Audio: 48 kHz WebAudio
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 16px ${accentColor}66`,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
