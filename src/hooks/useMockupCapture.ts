import { useState, useCallback } from 'react';
import { toPng } from 'html-to-image';

interface CaptureOptions {
  scale?: number;
  backgroundColor?: string;
}

export function useMockupCapture() {
  const [isCapturing, setIsCapturing] = useState<string | null>(null);

  const captureElement = useCallback(async (
    element: HTMLElement,
    options: CaptureOptions = {}
  ): Promise<string> => {
    const { scale = 2, backgroundColor = '#ffffff' } = options;

    const dataUrl = await toPng(element, {
      pixelRatio: scale,
      backgroundColor,
      cacheBust: true,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      },
    });

    return dataUrl;
  }, []);

  const downloadImage = useCallback((dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }, []);

  const captureAndDownload = useCallback(async (
    element: HTMLElement,
    filename: string,
    options: CaptureOptions = {}
  ) => {
    try {
      const dataUrl = await captureElement(element, options);
      downloadImage(dataUrl, filename);
      return dataUrl;
    } catch (error) {
      console.error('Failed to capture mockup:', error);
      throw error;
    }
  }, [captureElement, downloadImage]);

  return {
    isCapturing,
    setIsCapturing,
    captureElement,
    downloadImage,
    captureAndDownload,
  };
}
