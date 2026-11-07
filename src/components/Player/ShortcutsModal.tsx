import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  accentColor = '#ff6b00',
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause video' },
    { key: 'F', desc: 'Toggle Fullscreen mode' },
    { key: 'M', desc: 'Mute / Unmute audio' },
    { key: '← / →', desc: 'Seek backward / forward (skip interval)' },
    { key: '↑ / ↓', desc: 'Increase / Decrease volume (up to 200%)' },
    { key: '[  /  ]', desc: 'Slower / Faster playback speed' },
    { key: '=', desc: 'Reset speed to normal (1.0x)' },
    { key: 'S', desc: 'Capture native frame screenshot PNG' },
    { key: 'E', desc: 'Next frame step (+0.04s)' },
    { key: 'N / P', desc: 'Next / Previous track in playlist' },
    { key: 'L', desc: 'Cycle Loop mode (Off / One / All)' },
    { key: 'C', desc: 'Cycle Aspect ratio mode' },
    { key: 'V', desc: 'Toggle Subtitles on / off' },
    { key: 'B', desc: 'Open 10-Band Equalizer' },
    { key: '?', desc: 'Show this shortcuts help dialog' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 text-white shadow-2xl border border-white/10 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">VLC Keyboard Shortcuts</h2>
              <p className="text-xs text-neutral-400">Quick keys matched to VLC Media Player desktop controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="my-4 overflow-y-auto pr-2 space-y-2 flex-1">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-xs"
            >
              <span className="text-neutral-300 font-medium">{sc.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/15 text-amber-300 font-mono text-[11px] font-semibold shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 16px ${accentColor}66`,
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
