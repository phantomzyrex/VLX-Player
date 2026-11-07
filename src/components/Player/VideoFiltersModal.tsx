import React from 'react';
import { VideoFilters } from '../../types';
import { SlidersHorizontal, RotateCcw, X, FlipHorizontal, FlipVertical, RotateCw } from 'lucide-react';

interface VideoFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: VideoFilters;
  onChange: (filters: VideoFilters) => void;
  accentColor?: string;
}

export const VideoFiltersModal: React.FC<VideoFiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  onChange,
  accentColor = '#ff6b00',
}) => {
  if (!isOpen) return null;

  const update = (partial: Partial<VideoFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const handleReset = () => {
    onChange({
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
      hue: 0,
      gamma: 1.0,
      rotate: 0,
      flipH: false,
      flipV: false,
    });
  };

  const handleRotate = () => {
    const nextAngle = ((filters.rotate + 90) % 360) as 0 | 90 | 180 | 270;
    update({ rotate: nextAngle });
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
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Video Adjustments & Filters</h2>
              <p className="text-xs text-neutral-400">Color grading, gamma correction & geometric transforms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders Container */}
        <div className="space-y-4 my-6">
          {/* Brightness */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-neutral-300">Brightness</span>
              <span className="font-mono text-neutral-400">{Math.round(filters.brightness * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={2.0}
              step={0.05}
              value={filters.brightness}
              onChange={(e) => update({ brightness: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-neutral-300">Contrast</span>
              <span className="font-mono text-neutral-400">{Math.round(filters.contrast * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={2.0}
              step={0.05}
              value={filters.contrast}
              onChange={(e) => update({ contrast: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Saturation */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-neutral-300">Saturation (Vibrance)</span>
              <span className="font-mono text-neutral-400">{Math.round(filters.saturation * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={2.5}
              step={0.05}
              value={filters.saturation}
              onChange={(e) => update({ saturation: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Hue Shift */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-neutral-300">Hue Rotation</span>
              <span className="font-mono text-neutral-400">{filters.hue}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={5}
              value={filters.hue}
              onChange={(e) => update({ hue: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Gamma */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-neutral-300">Gamma Curve</span>
              <span className="font-mono text-neutral-400">{filters.gamma.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.8}
              step={0.05}
              value={filters.gamma}
              onChange={(e) => update({ gamma: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Geometry Transformations */}
        <div className="pt-4 border-t border-white/10">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-3">
            Geometry & Orientation
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={handleRotate}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium transition"
            >
              <RotateCw className="w-4 h-4 text-amber-400" />
              <span>Rotate ({filters.rotate}°)</span>
            </button>
            <button
              onClick={() => update({ flipH: !filters.flipH })}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium transition border ${
                filters.flipH
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 hover:bg-white/10 border-transparent text-neutral-300'
              }`}
            >
              <FlipHorizontal className="w-4 h-4" />
              <span>Flip H</span>
            </button>
            <button
              onClick={() => update({ flipV: !filters.flipV })}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium transition border ${
                filters.flipV
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 hover:bg-white/10 border-transparent text-neutral-300'
              }`}
            >
              <FlipVertical className="w-4 h-4" />
              <span>Flip V</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-3 border-t border-white/10">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset All
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 16px ${accentColor}66`,
            }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
