import { PlayCircle } from "lucide-react";

interface VideoInstructionsSectionProps {
  videoUrl: string;
}

// Converts various video URLs (YouTube, Vimeo, Loom, etc.) to embeddable format
const getEmbedUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    
    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // Vimeo
    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.split('/').pop();
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
    
    // Loom
    if (urlObj.hostname.includes('loom.com')) {
      const videoId = urlObj.pathname.split('/').pop();
      if (videoId) {
        return `https://www.loom.com/embed/${videoId}`;
      }
    }
    
    // Wistia
    if (urlObj.hostname.includes('wistia.com')) {
      const videoId = urlObj.pathname.split('/').pop();
      if (videoId) {
        return `https://fast.wistia.net/embed/iframe/${videoId}`;
      }
    }
    
    // If it's already an embed URL or direct video file, return as-is
    if (url.includes('/embed/') || url.endsWith('.mp4') || url.endsWith('.webm')) {
      return url;
    }
    
    return null;
  } catch {
    return null;
  }
};

export function VideoInstructionsSection({ videoUrl }: VideoInstructionsSectionProps) {
  const embedUrl = getEmbedUrl(videoUrl);
  
  if (!embedUrl) {
    return null;
  }
  
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <PlayCircle className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-medium text-foreground">Video Instructions</h3>
      </div>
      <div className="relative w-full rounded-lg overflow-hidden border border-border bg-muted/30" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video Instructions"
        />
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Watch this tutorial to help you complete this task.
      </p>
    </div>
  );
}
