/**
 * Extracts a thumbnail frame from a video URL using the browser's Canvas API.
 * @param videoUrl - The URL of the video to extract a frame from
 * @param seekTime - Time in seconds to seek to for the frame (default: 1). Use 'middle' for middle of video.
 * @param maxWidth - Maximum width of the thumbnail (default: 400)
 * @returns An object containing the Blob and the video duration
 */
export async function extractVideoThumbnail(
  videoUrl: string,
  seekTime: number | 'middle' = 1,
  maxWidth: number = 400
): Promise<{ blob: Blob; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Video load timeout'));
    }, 30000);

    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      video.src = '';
      video.load();
    };

    const onError = () => {
      cleanup();
      reject(new Error('Failed to load video'));
    };

    const onMetadata = () => {
      // Calculate target time based on seekTime parameter
      let targetTime: number;
      if (seekTime === 'middle') {
        targetTime = video.duration / 2;
      } else {
        // Ensure we don't seek past the video duration
        targetTime = Math.min(seekTime, video.duration * 0.9);
      }
      video.currentTime = Math.max(0.1, targetTime);
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          cleanup();
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = video.videoWidth / video.videoHeight;
        const width = Math.min(maxWidth, video.videoWidth);
        const height = width / aspectRatio;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(video, 0, 0, width, height);

        const duration = video.duration;

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              resolve({ blob, duration });
            } else {
              reject(new Error('Failed to create thumbnail blob'));
            }
          },
          'image/jpeg',
          0.85
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);

    video.src = videoUrl;
    video.load();
  });
}

/**
 * Generates a unique filename for a video thumbnail
 */
export function generateThumbnailFilename(videoPath: string): string {
  const timestamp = Date.now();
  const baseName = videoPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'video';
  return `thumbnails/${baseName}-${timestamp}.jpg`;
}
