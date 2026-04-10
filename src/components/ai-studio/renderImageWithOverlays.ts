import { TextOverlay } from './types';

export async function renderImageWithOverlays(
  imageUrl: string,
  overlays: TextOverlay[]
): Promise<Blob> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, 0, 0);

  for (const overlay of overlays) {
    const x = (overlay.x / 100) * canvas.width;
    const y = (overlay.y / 100) * canvas.height;
    // Scale font size relative to image height (editor uses viewport-relative sizes)
    const scaledFontSize = (overlay.fontSize / 100) * canvas.height * 0.06;

    ctx.font = `${overlay.fontWeight === 'bold' ? 'bold ' : ''}${scaledFontSize}px sans-serif`;
    ctx.textBaseline = 'top';

    const lines = overlay.text.split('\n');
    const lineHeight = scaledFontSize * 1.3;

    if (overlay.bgColor) {
      const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
      const totalHeight = lines.length * lineHeight;
      const pad = scaledFontSize * 0.4;
      ctx.fillStyle = overlay.bgColor;
      ctx.beginPath();
      const r = scaledFontSize * 0.25;
      const bx = x - pad;
      const by = y - pad;
      const bw = maxWidth + pad * 2;
      const bh = totalHeight + pad * 2;
      ctx.roundRect(bx, by, bw, bh, r);
      ctx.fill();
    }

    ctx.fillStyle = overlay.color;
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + i * lineHeight);
    });
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png'
    );
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
