import { useEffect, useRef } from 'react';
import type { ChartFingerprint } from '../../engines/chart-fingerprint-engine';
import { drawImprintTotem } from '../../utils/draw-imprint-totem';
import { loadImage } from '../../utils/load-image';

export default function ChartFingerprintArt({ fingerprint }: { fingerprint: ChartFingerprint }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const size = fingerprint.size;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const paint = async () => {
      const backgroundSrc = `${import.meta.env.BASE_URL}art/imprint/${fingerprint.theme}.webp`;
      const motifSrc = `${import.meta.env.BASE_URL}art/imprint/motif-${fingerprint.theme}.webp`;
      const [backgroundResult, motifResult] = await Promise.allSettled([
        loadImage(backgroundSrc),
        loadImage(motifSrc),
      ]);
      if (cancelled) return;

      context.clearRect(0, 0, size, size);
      const fallback = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.7);
      fallback.addColorStop(0, '#14233a');
      fallback.addColorStop(1, '#070b16');
      context.fillStyle = fallback;
      context.fillRect(0, 0, size, size);

      if (backgroundResult.status === 'fulfilled') {
        context.drawImage(backgroundResult.value, 0, 0, size, size);
      }

      const veil = context.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size * 0.58);
      veil.addColorStop(0, 'rgba(4,8,18,.5)');
      veil.addColorStop(0.58, 'rgba(4,8,18,.22)');
      veil.addColorStop(1, 'rgba(4,8,18,.06)');
      context.fillStyle = veil;
      context.fillRect(0, 0, size, size);

      drawImprintTotem(context, fingerprint, {
        x: 0,
        y: 0,
        size,
        motif: motifResult.status === 'fulfilled' ? motifResult.value : undefined,
      });
    };

    void paint();
    return () => { cancelled = true; };
  }, [fingerprint]);

  return (
    <div className="chart-enter imprint-art imprint-canvas-shell mx-auto w-full max-w-[420px]">
      <canvas
        ref={canvasRef}
        className="block h-auto w-full"
        style={{ aspectRatio: '1' }}
        role="img"
        aria-label={`由命盤生成的${fingerprint.theme}元素命之圖騰，第 ${fingerprint.hexagramIndex} 卦`}
      >
        由你的命盤與五行意象生成的獨一無二命之圖騰
      </canvas>
    </div>
  );
}
