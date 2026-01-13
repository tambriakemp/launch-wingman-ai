import { useState } from "react";
import { Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PinterestBoardSelector } from "./PinterestBoardSelector";

interface PinterestMediaOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string | null;
  onBoardChange: (boardId: string | null) => void;
  linkUrl: string;
  onLinkUrlChange: (url: string) => void;
}

export function PinterestMediaOptionsModal({
  open,
  onOpenChange,
  boardId,
  onBoardChange,
  linkUrl,
  onLinkUrlChange,
}: PinterestMediaOptionsModalProps) {
  const [tempBoardId, setTempBoardId] = useState<string | null>(boardId);
  const [tempLinkUrl, setTempLinkUrl] = useState(linkUrl);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setTempBoardId(boardId);
      setTempLinkUrl(linkUrl);
    }
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    onBoardChange(tempBoardId);
    onLinkUrlChange(tempLinkUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Pinterest Options
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Board Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Board <span className="text-destructive">*</span>
            </Label>
            <PinterestBoardSelector
              selectedBoard={tempBoardId}
              onBoardChange={setTempBoardId}
            />
            <p className="text-xs text-muted-foreground">
              Select the board where this pin will be saved
            </p>
          </div>

          {/* Link URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Link URL (optional)</Label>
            <Input
              value={tempLinkUrl}
              onChange={(e) => setTempLinkUrl(e.target.value)}
              placeholder="https://yourwebsite.com/page"
            />
            <p className="text-xs text-muted-foreground">
              The URL that viewers will visit when they click your pin
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
