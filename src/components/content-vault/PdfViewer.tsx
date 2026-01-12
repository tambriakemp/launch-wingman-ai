import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source - using import.meta.url for Vite/ES module compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  url: string;
  title?: string;
}

export const PdfViewer = ({ url, title }: PdfViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch PDF via vault-preview to handle CORS
        const { data, error: fetchError } = await supabase.functions.invoke('vault-preview', {
          body: { url }
        });

        if (fetchError) throw fetchError;

        // Convert response to ArrayBuffer
        let arrayBuffer: ArrayBuffer;
        if (data instanceof Blob) {
          arrayBuffer = await data.arrayBuffer();
        } else if (data instanceof ArrayBuffer) {
          arrayBuffer = data;
        } else if (typeof data === 'string') {
          // If it's a base64 string, decode it
          const binaryString = atob(data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer;
        } else {
          throw new Error('Unexpected response format');
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [url]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      // Calculate viewport with rotation
      const viewport = page.getViewport({ scale, rotation });
      
      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Failed to render page:', err);
    }
  }, [pdfDoc, currentPage, scale, rotation]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        goToPrevPage();
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        goToNextPage();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-lg">
        <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
        <p className="text-white/70">Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-lg p-8">
        <p className="text-red-400 text-center mb-4">Failed to load PDF</p>
        <p className="text-white/60 text-sm text-center">{error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-slate-800 rounded-lg overflow-hidden">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="text-white hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-white text-sm min-w-[80px] text-center">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="text-white hover:bg-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom and rotate controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="text-white hover:bg-slate-700"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-white text-sm min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3}
            className="text-white hover:bg-slate-700"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={rotate}
            className="text-white hover:bg-slate-700 ml-2"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas container with scrolling */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-slate-700">
        <canvas
          ref={canvasRef}
          className="shadow-2xl"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
};
