import React from 'react';
import { VlcConeIcon } from '../VlcConeIcon';
import { Play, HardDrive, Upload, Sparkles, Sliders, Volume2, Tv, ShieldCheck } from 'lucide-react';

interface HeroBannerProps {
  onPlayDemo: () => void;
  onOpenDrive: () => void;
  onPickLocalFile: () => void;
  accentColor?: string;
  hasActiveAccount: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onPlayDemo,
  onOpenDrive,
  onPickLocalFile,
  accentColor = '#ff6b00',
  hasActiveAccount,
}) => {
  return (
    <div className="w-full relative overflow-hidden rounded-3xl p-6 sm:p-10 mb-8 border border-white/10 shadow-2xl bg-gradient-to-br from-neutral-900/90 via-neutral-950/80 to-neutral-900/90">
      {/* Background ambient lighting accents */}
      <div
        className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-40 -z-10"
        style={{ backgroundColor: accentColor }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-[120px] pointer-events-none opacity-20 -z-10"
        style={{ backgroundColor: '#00f0ff' }}
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left Column: Bold Copy */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold mb-4 text-neutral-300">
            <VlcConeIcon size={16} glowColor={accentColor} />
            <span>Inspired by VLC Media Player Desktop Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-3">
            Stream with{' '}
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r"
              style={{
                backgroundImage: `linear-gradient(to right, ${accentColor}, #ff9d00, #ff5e62)`,
              }}
            >
              VLC Precision.
            </span>
          </h1>

          <p className="text-neutral-400 text-sm sm:text-base max-w-xl mb-6 leading-relaxed">
            Instant Google Drive cloud streaming via HTTP range requests, 200% Web Audio gain boost,
            10-band hardware EQ, dynamic ambient TV lighting, and multi-track subtitles.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              onClick={onPlayDemo}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-xl transition-all hover:scale-[1.03] active:scale-[0.98]"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 20px ${accentColor}77`,
              }}
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Watch 4K Demo Movie</span>
            </button>

            <button
              onClick={onOpenDrive}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all hover:scale-[1.03]"
            >
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>{hasActiveAccount ? 'Browse Drive Files' : 'Connect Google Drive'}</span>
            </button>

            <button
              onClick={onPickLocalFile}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white bg-transparent hover:bg-white/5 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Open Local Video</span>
            </button>
          </div>
        </div>

        {/* Right Column: Visual Feature Badges Card */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
            <Volume2 className="w-5 h-5 text-amber-400 mb-2" />
            <div>
              <span className="text-lg font-mono font-black text-white">200%</span>
              <p className="text-[11px] text-neutral-400 font-medium">Web Audio Gain Boost</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
            <Sliders className="w-5 h-5 text-cyan-400 mb-2" />
            <div>
              <span className="text-lg font-mono font-black text-white">10-Band</span>
              <p className="text-[11px] text-neutral-400 font-medium">Biquad Equalizer</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
            <Tv className="w-5 h-5 text-emerald-400 mb-2" />
            <div>
              <span className="text-lg font-mono font-black text-white">Ambilight</span>
              <p className="text-[11px] text-neutral-400 font-medium">Dynamic Frame Glow</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
            <ShieldCheck className="w-5 h-5 text-purple-400 mb-2" />
            <div>
              <span className="text-lg font-mono font-black text-white">Multi-Acc</span>
              <p className="text-[11px] text-neutral-400 font-medium">Google Drive OAuth</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
