import React, { useEffect, useRef } from 'react';
export const MatrixRainCanvas: React.FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!active) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);
    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%<>!&#';
    const alphabet = katakana + latin;
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    let rainDrops: number[] = Array.from({ length: columns }).fill(1) as number[];
    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      rainDrops = Array.from({length: Math.floor(width / fontSize)}, () => 1);
    };
    window.addEventListener('resize', handleResize);
    let lastFrame = 0;
    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (document.hidden || motion.matches || time - lastFrame < 50) return;
      lastFrame = time;
      ctx.fillStyle = 'rgba(5, 10, 8, 0.12)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#10b981';
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < rainDrops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        const x = i * fontSize;
        const y = rainDrops[i] * fontSize;
        if (Math.random() > 0.85) {
          ctx.fillStyle = '#a7f3d0';
        } else {
          ctx.fillStyle = '#059669';
        }
        ctx.fillText(text, x, y);
        if (y > height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
    };
    animationFrameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);
  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none opacity-[0.12] z-0"
    />
  );
};
