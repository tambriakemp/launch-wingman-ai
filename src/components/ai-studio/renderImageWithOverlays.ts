import { TextOverlay, AspectRatio } from './types';

const ASPECT_RATIOS: Record<AspectRatio, { w: number; h: number }> = {
  '1:1': { w: 1, h: 1 },
  '9:16': { w: 9, h: 16 },
  '16:9': { w: 16, h: 9 },
};

export async function renderImageWithOverlays(
  imageUrl: string,
  overlays: TextOverlay[],
  targetAspectRatio?: AspectRatio
): Promise<Blob> {
  const img = await loadImage(imageUrl);
  
  let srcX = 0, srcY = 0, srcW = img.naturalWidth, srcH = img.naturalHeight;
  let outW = srcW, outH = srcH;

  // Enforce aspect ratio by center-cropping the source image
  if (targetAspectRatio && ASPECT_RATIOS[targetAspectRatio]) {
    const { w: aw, h: ah } = ASPECT_RATIOS[targetAspectRatio];
    const targetRatio = aw / ah;
    const currentRatio = srcW / srcH;

    if (Math.abs(currentRatio - targetRatio) > 0.02) {
      if (currentRatio > targetRatio) {
        // Image is too wide — crop sides
        const newW = Math.round(srcH * targetRatio);
        srcX = Math.round((srcW - newW) / 2);
        srcW = newW;
      } else {
        // Image is too tall — crop top/bottom
        const newH = Math.round(srcW / targetRatio);
        srcY = Math.round((srcH - newH) / 2);
        srcH = newH;
      }
      outW = srcW;
      outH = srcH;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

  for (const overlay of overlays) {
    const x = (overlay.x / 100) * canvas.width;
    const y = (overlay.y / 100) * canvas.height;
    const boxWidth = (overlay.width / 100) * canvas.width;
    const scaledFontSize = (overlay.fontSize / 100) * canvas.height * 0.06;
    const fontFamily = overlay.fontFamily || 'sans-serif';

    ctx.font = `${overlay.fontWeight === 'bold' ? 'bold ' : ''}${scaledFontSize}px "${fontFamily}", sans-serif`;
    ctx.textBaseline = 'top';

    // Word-wrap text to fit boxWidth
    const lines = wrapText(ctx, overlay.text, boxWidth);
    const lineHeight = scaledFontSize * 1.3;

    if (overlay.bgColor) {
      const maxLineWidth = Math.max(...lines.map(l => ctx.measureText(l).width), boxWidth);
      const totalHeight = lines.length * lineHeight;
      const pad = scaledFontSize * 0.4;
      ctx.fillStyle = overlay.bgColor;
      ctx.beginPath();
      const r = scaledFontSize * 0.25;
      ctx.roundRect(x - pad, y - pad, Math.min(maxLineWidth, boxWidth) + pad * 2, totalHeight + pad * 2, r);
      ctx.fill();
    }

    ctx.fillStyle = overlay.color;
    const align = overlay.textAlign || 'left';
    lines.forEach((line, i) => {
      let lx = x;
      if (align === 'center') {
        lx = x + (boxWidth - ctx.measureText(line).width) / 2;
      } else if (align === 'right') {
        lx = x + boxWidth - ctx.measureText(line).width;
      }
      ctx.fillText(line, lx, y + i * lineHeight);
    });
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png'
    );
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const result: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        result.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    result.push(line);
  }
  return result;
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
