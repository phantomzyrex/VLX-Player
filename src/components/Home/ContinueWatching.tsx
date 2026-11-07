import React from 'react';
import { ContinueWatchingItem } from '../../types';
import { formatTime } from '../../utils/theme';
import { Play, Clock, Trash2 } from 'lucide-react';
import { VlcConeIcon } from '../VlcConeIcon';

interface ContinueWatchingProps {
  items: ContinueWatchingItem[];
  onResume: (item: ContinueWatchingItem) => void;
  onRemove: (id: string) => void;
  accentColor?: string;
}

export const ContinueWatching: React.FC<ContinueWatchingProps> = ({
  items,
  onResume,
  onRemove,
  accentColor = '#ff6b00',
}) => {
  if (items.length === 0) return null;

  return (
    <div className="w-full my-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Continue Watching</span>
        </h3>
        <span className="text-xs text-neutral-400 font-mono">
          {items.length} {items.length === 1 ? 'saved session' : 'saved sessions'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {items.map((item) => {
          const percent = item.duration > 0 ? (item.currentTime / item.duration) * 100 : 0;
          return (
            <div
              key={item.id}
              className="group rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all overflow-hidden flex flex-col relative"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => onResume(item)}
                className="relative w-full aspect-video bg-neutral-900 cursor-pointer overflow-hidden"
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
                    <VlcConeIcon size={32} glowColor={accentColor} />
                  </div>
                )}

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div
                    className="p-3 rounded-full text-white shadow-xl transform scale-75 group-hover:scale-100 transition-transform"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Progress bar overlay at bottom of thumbnail */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: accentColor,
                      boxShadow: `0 0 8px ${accentColor}`,
                    }}
                  />
                </div>
              </div>

              {/* Title & Info */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4
                    onClick={() => onResume(item)}
                    className="text-xs font-semibold text-white truncate cursor-pointer hover:text-amber-300"
                    title={item.title}
                  >
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1 font-mono">
                    <span>{formatTime(item.currentTime)}</span>
                    <span>{item.duration > 0 ? formatTime(item.duration) : '--:--'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-white/5 transition"
                    title="Dismiss"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onResume(item)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition hover:scale-105"
                    style={{ backgroundColor: accentColor }}
                  >
                    Resume ({Math.round(percent)}%)
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
