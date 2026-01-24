import { useState, useCallback } from 'react';
import { toPng } from 'html-to-image';

interface CaptureOptions {
  scale?: number;
  backgroundColor?: string;
}

interface CaptureAtSizeOptions {
  width: number;
  height: number;
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

  const captureAtSize = useCallback(async (
    element: HTMLElement,
    options: CaptureAtSizeOptions
  ): Promise<string> => {
    const { width, height, backgroundColor = '#ffffff' } = options;

    // Wait for any animations to settle
    await new Promise(resolve => setTimeout(resolve, 100));

    const dataUrl = await toPng(element, {
      width,
      height,
      backgroundColor,
      cacheBust: true,
      pixelRatio: 1, // We're specifying exact dimensions, so 1:1 ratio
      style: {
        width: `${width}px`,
        height: `${height}px`,
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

  const captureAtSizeAndDownload = useCallback(async (
    element: HTMLElement,
    filename: string,
    options: CaptureAtSizeOptions
  ) => {
    try {
      const dataUrl = await captureAtSize(element, options);
      downloadImage(dataUrl, filename);
      return dataUrl;
    } catch (error) {
      console.error('Failed to capture sized mockup:', error);
      throw error;
    }
  }, [captureAtSize, downloadImage]);

  return {
    isCapturing,
    setIsCapturing,
    captureElement,
    captureAtSize,
    downloadImage,
    captureAndDownload,
    captureAtSizeAndDownload,
  };
}
