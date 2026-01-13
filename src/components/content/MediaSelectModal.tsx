import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaUploader } from "./MediaUploader";

interface MediaSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  mediaUrl: string | null;
  mediaType: string | null;
  onMediaChange: (url: string | null, type: string | null) => void;
}

export function MediaSelectModal({
  open,
  onOpenChange,
  projectId,
  mediaUrl,
  mediaType,
  onMediaChange,
}: MediaSelectModalProps) {
  const handleMediaChange = (url: string | null, type: string | null) => {
    console.log("MediaSelectModal handleMediaChange:", { url, type });
    onMediaChange(url, type);
    // Auto-close modal after successful upload with a small delay to ensure state updates
    if (url) {
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <MediaUploader
            projectId={projectId}
            mediaUrl={mediaUrl}
            mediaType={mediaType}
            onMediaChange={handleMediaChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
