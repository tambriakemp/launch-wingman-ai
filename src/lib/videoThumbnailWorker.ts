/**
 * Web Worker-based video thumbnail extraction using WebCodecs API.
 * This approach is resistant to browser tab throttling.
 */

interface WorkerMessage {
  success: boolean;
  blob?: Blob;
  duration?: number;
  error?: string;
}

interface WorkerRequest {
  videoUrl: string;
  seekTime: number | 'middle';
  maxWidth: number;
}

let worker: Worker | null = null;

/**
 * Check if WebCodecs API is supported in this browser
 */
export function supportsWebCodecs(): boolean {
  return 'VideoDecoder' in window && 'OffscreenCanvas' in window;
}

/**
 * Get or create the thumbnail worker
 */
function getWorker(): Worker {
  if (!worker) {
    worker = new Worker('/thumbnail-worker.js');
  }
  return worker;
}

/**
 * Terminate the worker when done with batch processing
 */
export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

/**
 * Extract a thumbnail from a video using the WebCodecs-based Web Worker.
 * This runs in a separate thread and is resistant to tab throttling.
 */
export function extractThumbnailViaWorker(
  videoUrl: string,
  seekTime: number | 'middle' = 1,
  maxWidth: number = 400
): Promise<{ blob: Blob; duration: number }> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    
    const timeout = setTimeout(() => {
      reject(new Error('Worker timeout - video processing took too long'));
    }, 30000);
    
    const handleMessage = (e: MessageEvent<WorkerMessage>) => {
      clearTimeout(timeout);
      w.removeEventListener('message', handleMessage);
      w.removeEventListener('error', handleError);
      
      if (e.data.success && e.data.blob) {
        resolve({ blob: e.data.blob, duration: e.data.duration || 0 });
      } else {
        reject(new Error(e.data.error || 'Unknown worker error'));
      }
    };
    
    const handleError = (e: ErrorEvent) => {
      clearTimeout(timeout);
      w.removeEventListener('message', handleMessage);
      w.removeEventListener('error', handleError);
      reject(new Error(e.message || 'Worker error'));
    };
    
    w.addEventListener('message', handleMessage);
    w.addEventListener('error', handleError);
    
    const request: WorkerRequest = { videoUrl, seekTime, maxWidth };
    w.postMessage(request);
  });
}
