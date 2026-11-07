import React, { useRef } from 'react';
import { SubtitleSettings, SubtitleTrack } from '../../types';
import { parseSubtitleText } from '../../services/subtitleService';
import { Subtitles, Upload, X, Check, FastForward, Rewind } from 'lucide-react';

interface SubtitlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SubtitleSettings;
  onSettingsChange: (settings: SubtitleSettings) => void;
  tracks: SubtitleTrack[];
  activeTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  onAddTrack: (track: SubtitleTrack) => void;
  accentColor?: string;
}

export const SubtitlesModal: React.FC<SubtitlesModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  tracks,
  activeTrackId,
  onSelectTrack,
  onAddTrack,
  accentColor = '#ff6b00',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const update = (partial: Partial<SubtitleSettings>) => {
    onSettingsChange({ ...settings, ...partial });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const cues = parseSubtitleText(text);
        const newTrack: SubtitleTrack = {
          id: `local_${Date.now()}`,
          label: file.name,
          cues,
          source: 'local',
        };
        onAddTrack(newTrack);
        onSelectTrack(newTrack.id);
        update({ enabled: true });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 text-white shadow-2xl border border-white/10 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              <Subtitles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Subtitles & Closed Captions</h2>
              <p className="text-xs text-neutral-400">Track selection, sync synchronization & typography</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enable Toggle */}
        <div className="flex items-center justify-between py-3 my-2 border-b border-white/5">
          <span className="text-sm font-medium">Display Subtitles</span>
          <button
            onClick={() => update({ enabled: !settings.enabled })}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
              settings.enabled ? 'bg-amber-500' : 'bg-neutral-800'
            }`}
            style={{ backgroundColor: settings.enabled ? accentColor : undefined }}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                settings.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Tracks List */}
        <div className="my-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
            Available Tracks ({tracks.length})
          </label>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            <button
              onClick={() => onSelectTrack(null)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTrackId === null ? 'bg-white/15 text-white' : 'hover:bg-white/5 text-neutral-400'
              }`}
            >
              <span>Disabled / None</span>
              {activeTrackId === null && <Check className="w-4 h-4 text-emerald-400" />}
            </button>
            {tracks.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTrack(t.id);
                  update({ enabled: true });
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTrackId === t.id ? 'bg-white/15 text-white' : 'hover:bg-white/5 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{t.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-400 font-mono">
                    {t.source}
                  </span>
                </div>
                {activeTrackId === t.id && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            ))}
          </div>

          {/* Upload Local SRT/VTT */}
          <div className="mt-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".srt,.vtt"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-xs text-neutral-300 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Load external .srt or .vtt subtitle file</span>
            </button>
          </div>
        </div>

        {/* Sync Delay Offset */}
        <div className="my-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Audio Sync Delay
            </span>
            <span className="font-mono text-xs text-amber-400">
              {settings.delay > 0 ? `+${settings.delay.toFixed(1)}s` : `${settings.delay.toFixed(1)}s`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => update({ delay: Math.max(-10, settings.delay - 0.5) })}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 transition"
              title="-0.5s"
            >
              <Rewind className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={-5}
              max={5}
              step={0.1}
              value={settings.delay}
              onChange={(e) => update({ delay: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
            <button
              onClick={() => update({ delay: Math.min(10, settings.delay + 0.5) })}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 transition"
              title="+0.5s"
            >
              <FastForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => update({ delay: 0 })}
              className="px-2 py-1 rounded bg-white/10 text-[10px] text-neutral-300 hover:text-white"
            >
              0.0s
            </button>
          </div>
        </div>

        {/* Style & Typography */}
        <div className="my-4 pt-3 border-t border-white/10 space-y-3">
          {/* Font Size */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-300 font-medium">Font Size</span>
            <div className="flex gap-1.5">
              {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => update({ fontSize: size })}
                  className={`px-2.5 py-1 text-xs rounded-lg uppercase font-semibold transition ${
                    settings.fontSize === size
                      ? 'bg-amber-500 text-white'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                  }`}
                  style={{ backgroundColor: settings.fontSize === size ? accentColor : undefined }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-300 font-medium">Text Color</span>
            <div className="flex gap-2">
              {[
                { label: 'White', color: '#ffffff' },
                { label: 'Yellow', color: '#facc15' },
                { label: 'Cyan', color: '#22d3ee' },
                { label: 'Green', color: '#4ade80' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => update({ color: c.color })}
                  className={`w-6 h-6 rounded-full border-2 transition transform hover:scale-110 ${
                    settings.color === c.color ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Vertical Position */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-neutral-300 font-medium">Vertical Offset</span>
            <span className="font-mono text-xs text-neutral-400">{settings.verticalPosition}% from bottom</span>
          </div>
          <input
            type="range"
            min={4}
            max={35}
            step={1}
            value={settings.verticalPosition}
            onChange={(e) => update({ verticalPosition: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-4 pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 16px ${accentColor}66`,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
