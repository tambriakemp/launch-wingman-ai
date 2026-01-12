import { useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';

interface CaptureOptions {
  width: number;
  height: number;
  pixelRatio?: number;
}

export const usePostCapture = () => {
  const captureRef = useRef<HTMLDivElement>(null);

  const captureAsBase64 = useCallback(async (options: CaptureOptions = { width: 1080, height: 1350 }): Promise<string> => {
    if (!captureRef.current) {
      throw new Error('Capture ref not attached to element');
    }

    try {
      const dataUrl = await toPng(captureRef.current, {
        width: options.width,
        height: options.height,
        pixelRatio: options.pixelRatio || 1,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
        // Ensure fonts are loaded
        fontEmbedCSS: '',
        skipAutoScale: true,
      });

      return dataUrl;
    } catch (error) {
      console.error('Failed to capture element:', error);
      throw new Error('Failed to capture post image');
    }
  }, []);

  return {
    captureRef,
    captureAsBase64,
  };
};
