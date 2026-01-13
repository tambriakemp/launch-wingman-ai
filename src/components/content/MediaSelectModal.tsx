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
            onMediaChange={onMediaChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
