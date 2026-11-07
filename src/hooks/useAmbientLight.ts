import { useEffect, useState, useRef } from 'react';

export function useAmbientLight(videoElement: HTMLVideoElement | null, enabled: boolean = true) {
  const [ambientGlow, setAmbientGlow] = useState<string>('rgba(255, 107, 0, 0.15)');
  const [dominantRgb, setDominantRgb] = useState<{ r: number; g: number; b: number }>({
    r: 255,
    g: 107,
    b: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastSampleRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !videoElement) {
      setAmbientGlow('rgba(255, 107, 0, 0.1)');
      return;
    }

    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 9;
      canvasRef.current = canvas;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let isDestroyed = false;

    const sampleFrame = () => {
      if (isDestroyed) return;

      const now = performance.now();
      // Sample every 120ms to keep CPU minimal and performance high
      if (now - lastSampleRef.current >= 120) {
        lastSampleRef.current = now;

        if (
          videoElement.readyState >= 2 &&
          !videoElement.paused &&
          !videoElement.ended &&
          videoElement.videoWidth > 0
        ) {
          try {
            ctx.drawImage(videoElement, 0, 0, 16, 9);
            const imgData = ctx.getImageData(0, 0, 16, 9).data;

            let rTotal = 0;
            let gTotal = 0;
            let bTotal = 0;
            let count = 0;

            for (let i = 0; i < imgData.length; i += 4) {
              const r = imgData[i];
              const g = imgData[i + 1];
              const b = imgData[i + 2];
              // Give higher weight to colorful / saturated pixels
              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              const saturation = max === 0 ? 0 : (max - min) / max;
              const weight = 1 + saturation * 2;

              rTotal += r * weight;
              gTotal += g * weight;
              bTotal += b * weight;
              count += weight;
            }

            if (count > 0) {
              const r = Math.round(rTotal / count);
              const g = Math.round(gTotal / count);
              const b = Math.round(bTotal / count);

              setDominantRgb({ r, g, b });
              setAmbientGlow(
                `radial-gradient(ellipse at 50% 50%, rgba(${r}, ${g}, ${b}, 0.5) 0%, rgba(${r}, ${g}, ${b}, 0.2) 50%, transparent 80%)`
              );
            }
          } catch {
            // Ignore cross-origin canvas security exceptions gracefully
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(sampleFrame);
    };

    animFrameRef.current = requestAnimationFrame(sampleFrame);

    return () => {
      isDestroyed = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [videoElement, enabled]);

  return { ambientGlow, dominantRgb };
}
