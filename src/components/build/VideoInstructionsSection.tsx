import { useState, useEffect } from "react";
import { PlayCircle, Save, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTaskVideoInstruction } from "@/hooks/useTaskVideoInstruction";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoInstructionsSectionProps {
  taskId: string;
  isAdmin: boolean;
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

export function VideoInstructionsSection({ taskId, isAdmin }: VideoInstructionsSectionProps) {
  const { videoUrl, isLoading, isSaving, saveVideoUrl, deleteVideoUrl } = useTaskVideoInstruction(taskId);
  const [inputUrl, setInputUrl] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Sync input with fetched URL
  useEffect(() => {
    if (videoUrl) {
      setInputUrl(videoUrl);
    }
  }, [videoUrl]);

  // Track changes
  useEffect(() => {
    setHasChanges(inputUrl !== videoUrl);
  }, [inputUrl, videoUrl]);

  const handleSave = async () => {
    if (!inputUrl.trim()) return;
    await saveVideoUrl(inputUrl.trim());
  };

  const handleDelete = async () => {
    await deleteVideoUrl();
    setInputUrl('');
  };

  const embedUrl = getEmbedUrl(videoUrl);

  // Show loading state
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <PlayCircle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Video Instructions</h3>
        </div>
        <Skeleton className="w-full h-12" />
      </div>
    );
  }

  // For non-admins, only show the video player if a URL exists
  if (!isAdmin) {
    if (!videoUrl || !embedUrl) {
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

  // Admin view - show input field and video preview
  const previewEmbedUrl = getEmbedUrl(inputUrl);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <PlayCircle className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-medium text-foreground">Video Instructions</h3>
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
      </div>
      
      {/* Admin input section */}
      <div className="flex gap-2 mb-4">
        <Input
          type="url"
          placeholder="Enter video URL (YouTube, Vimeo, Loom, etc.)"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={handleSave}
          disabled={!inputUrl.trim() || isSaving || !hasChanges}
          size="sm"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="ml-1">Save</span>
        </Button>
        {videoUrl && (
          <Button
            onClick={handleDelete}
            disabled={isSaving}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Video preview */}
      {previewEmbedUrl && (
        <>
          <div className="relative w-full rounded-lg overflow-hidden border border-border bg-muted/30" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={previewEmbedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video Instructions Preview"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            This video will be shown to users to help them complete this task.
          </p>
        </>
      )}

      {!previewEmbedUrl && inputUrl && (
        <p className="text-sm text-destructive">
          Unable to embed this URL. Please use a valid YouTube, Vimeo, Loom, or Wistia link.
        </p>
      )}

      {!inputUrl && (
        <p className="text-sm text-muted-foreground">
          Add a video URL to provide visual guidance for users completing this task.
        </p>
      )}
    </div>
  );
}
