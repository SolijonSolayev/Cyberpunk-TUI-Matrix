import { useEffect, useRef } from 'react';
import { createNoise3D } from 'simplex-noise';
import { cn } from '@/lib/utils';

interface VelarisProps {
  active?: boolean;
  className?: string;
  intensity?: number;
}

const seededRandom = (seed: number) => () => {
  seed |= 0;
  seed = seed + 0x6d2b79f5 | 0;
  let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
  value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function Velaris({ active = true, className, intensity = 0.72 }: VelarisProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context) return;

    const buffer = document.createElement('canvas');
    const bufferContext = buffer.getContext('2d', { alpha: false });
    if (!bufferContext) return;

    const noise = createNoise3D(seededRandom(0x56454c41));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const frameInterval = 1000 / 10;
    let animationFrame: number | null = null;
    let lastFrame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      buffer.width = clamp(Math.ceil(rect.width / 22), 40, 64);
      buffer.height = clamp(Math.ceil(rect.height / 22), 28, 42);
      canvas.width = buffer.width;
      canvas.height = buffer.height;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
    };

    const paint = (timestamp: number) => {
      const width = buffer.width;
      const height = buffer.height;
      if (!width || !height) return;

      const image = bufferContext.createImageData(width, height);
      const time = timestamp * 0.000055;
      for (let y = 0; y < height; y++) {
        const ny = y / height;
        for (let x = 0; x < width; x++) {
          const nx = x / width;
          const broad = (noise(nx * 2.1, ny * 1.9, time) + 1) * 0.5;
          const ripple = (Math.sin((nx * 2.8 - ny * 1.7 + time * 2.4 + broad) * Math.PI) + 1) * 0.5;
          const cyan = broad * broad;
          const emerald = (1 - Math.abs(broad - 0.54) * 1.85) * (0.38 + ripple * 0.62);
          const violet = (1 - broad) * (1 - broad) * (0.4 + (1 - ripple) * 0.6);
          const index = (y * width + x) * 4;

          image.data[index] = Math.round(3 + intensity * (cyan * 5 + emerald * 12 + violet * 38));
          image.data[index + 1] = Math.round(7 + intensity * (cyan * 116 + emerald * 100 + violet * 28));
          image.data[index + 2] = Math.round(10 + intensity * (cyan * 145 + emerald * 67 + violet * 92));
          image.data[index + 3] = 255;
        }
      }

      bufferContext.putImageData(image, 0, 0);
      context.drawImage(buffer, 0, 0, canvas.width, canvas.height);
    };

    const schedule = () => {
      if (animationFrame !== null || !active || document.hidden || reducedMotion.matches) return;
      animationFrame = requestAnimationFrame(loop);
    };

    const loop = (timestamp: number) => {
      animationFrame = null;
      if (timestamp - lastFrame >= frameInterval) {
        paint(timestamp);
        lastFrame = timestamp;
      }
      schedule();
    };

    const stop = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
    };

    const syncAnimation = () => {
      if (!active || document.hidden || reducedMotion.matches) {
        stop();
        paint(0);
      } else {
        schedule();
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      paint(lastFrame);
    });
    resizeObserver.observe(canvas);
    document.addEventListener('visibilitychange', syncAnimation);
    reducedMotion.addEventListener('change', syncAnimation);
    resize();
    paint(0);
    syncAnimation();

    return () => {
      stop();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', syncAnimation);
      reducedMotion.removeEventListener('change', syncAnimation);
    };
  }, [active, intensity]);

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <canvas
        ref={canvasRef}
        data-velaris="true"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <div className="velaris-glow absolute inset-0" />
      <div className="velaris-vignette absolute inset-0" />
      <div className="velaris-grain absolute inset-[-20%]" />
    </div>
  );
}
