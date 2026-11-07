import React from 'react';
import { audioEngine, EQ_FREQUENCIES, EQ_PRESETS } from '../../services/audioEngine';
import { Sliders, RotateCcw, X, Volume2, Sparkles } from 'lucide-react';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gains: number[];
  onGainsChange: (newGains: number[], presetName?: string) => void;
  currentPreset: string;
  accentColor?: string;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  gains,
  onGainsChange,
  currentPreset,
  accentColor = '#ff6b00',
}) => {
  if (!isOpen) return null;

  const handleSliderChange = (index: number, val: number) => {
    const updated = [...gains];
    updated[index] = val;
    audioEngine.setFilterGains(updated);
    onGainsChange(updated, 'Custom');
  };

  const handleSelectPreset = (presetName: string) => {
    const presetGains = EQ_PRESETS[presetName];
    if (presetGains) {
      audioEngine.setFilterGains(presetGains);
      onGainsChange(presetGains, presetName);
    }
  };

  const handleReset = () => {
    handleSelectPreset('Flat');
  };

  const formatFreq = (freq: number) => {
    return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 text-white shadow-2xl border border-white/10 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                10-Band Graphic Equalizer
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-mono text-neutral-300">
                  VLC Studio DSP
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Hardware-accelerated Web Audio biquad peaking filters with ±12dB precision
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Bar */}
        <div className="my-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets:
          </span>
          {Object.keys(EQ_PRESETS).map((p) => (
            <button
              key={p}
              onClick={() => handleSelectPreset(p)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                currentPreset === p
                  ? 'text-white shadow-lg font-semibold'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
              style={{
                backgroundColor: currentPreset === p ? accentColor : undefined,
                boxShadow: currentPreset === p ? `0 0 12px ${accentColor}66` : undefined,
              }}
            >
              {p}
            </button>
          ))}
          {currentPreset === 'Custom' && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Custom
            </span>
          )}
        </div>

        {/* 10-Band Sliders Grid */}
        <div className="bg-neutral-900/80 rounded-xl p-5 border border-white/5 shadow-inner">
          <div className="grid grid-cols-10 gap-2 sm:gap-3 items-end h-56 pb-2">
            {EQ_FREQUENCIES.map((freq, idx) => {
              const gain = gains[idx] ?? 0;
              return (
                <div key={freq} className="flex flex-col items-center justify-end h-full group">
                  {/* Gain readout */}
                  <span
                    className={`text-[10px] font-mono mb-2 transition-colors ${
                      gain > 0
                        ? 'text-amber-400 font-bold'
                        : gain < 0
                        ? 'text-blue-400'
                        : 'text-neutral-500'
                    }`}
                  >
                    {gain > 0 ? `+${gain.toFixed(0)}` : gain.toFixed(0)}
                  </span>

                  {/* Vertical range input container */}
                  <div className="relative flex items-center justify-center h-36 w-6">
                    <div className="absolute inset-y-0 w-1.5 bg-neutral-800 rounded-full" />
                    {/* Zero center indicator */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 z-0" />
                    
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={0.5}
                      value={gain}
                      onChange={(e) => handleSliderChange(idx, parseFloat(e.target.value))}
                      className="w-36 h-2 appearance-none cursor-pointer bg-transparent -rotate-90 origin-center absolute z-10"
                      aria-label={`${formatFreq(freq)} Hz gain`}
                    />
                  </div>

                  {/* Frequency Label */}
                  <span className="text-[11px] font-mono text-neutral-400 mt-2 group-hover:text-white transition">
                    {formatFreq(freq)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/10 text-xs text-neutral-400">
            <span>-12 dB (Cut)</span>
            <span className="text-neutral-500">0 dB (Unity)</span>
            <span>+12 dB (Boost)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-5 pt-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Flat
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
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
