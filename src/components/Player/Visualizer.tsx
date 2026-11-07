import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../../services/audioEngine';

interface VisualizerProps {
  isPlaying: boolean;
  accentColor?: string;
  mode?: 'bars' | 'wave';
}

export const Visualizer: React.FC<VisualizerProps> = ({
  isPlaying,
  accentColor = '#ff6b00',
  mode = 'bars',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    let isDestroyed = false;

    const draw = () => {
      if (isDestroyed) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (isPlaying && analyser) {
        if (mode === 'bars') {
          audioEngine.getVisualizerData(dataArray);

          const barCount = 36;
          const barWidth = (width / barCount) * 0.75;
          const gap = (width / barCount) * 0.25;

          for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
            const value = dataArray[dataIndex] || 0;
            const percent = value / 255;
            const barHeight = Math.max(3, percent * height * 0.9);

            const x = i * (barWidth + gap);
            const y = height - barHeight;

            // Gradient for bar
            const grad = ctx.createLinearGradient(0, height, 0, 0);
            grad.addColorStop(0, `${accentColor}44`);
            grad.addColorStop(0.7, accentColor);
            grad.addColorStop(1, '#ffffff');

            ctx.fillStyle = grad;
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
            ctx.fill();
          }
        } else {
          // Waveform mode
          audioEngine.getWaveformData(dataArray);

          ctx.lineWidth = 2.5;
          ctx.strokeStyle = accentColor;
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 10;
          ctx.beginPath();

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }

          ctx.lineTo(width, height / 2);
          ctx.stroke();
        }
      } else {
        // Idle ambient gentle wave
        const time = Date.now() * 0.002;
        ctx.strokeStyle = `${accentColor}44`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < width; x += 4) {
          const y = height / 2 + Math.sin(x * 0.03 + time) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      isDestroyed = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, accentColor, mode]);

  return (
    <div className="w-full h-16 pointer-events-none overflow-hidden flex items-end">
      <canvas
        ref={canvasRef}
        width={400}
        height={64}
        className="w-full h-full object-cover opacity-80"
      />
    </div>
  );
};
