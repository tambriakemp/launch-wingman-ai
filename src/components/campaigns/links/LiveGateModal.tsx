import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateLink: () => void;
  onAttachLink: () => void;
}

export default function LiveGateModal({ open, onOpenChange, onCreateLink, onAttachLink }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Links Required
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Before you launch, attach at least 1 tracking link to this campaign so you can measure performance.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={() => { onOpenChange(false); onCreateLink(); }}>Create a UTM Link Now</Button>
          <Button variant="outline" onClick={() => { onOpenChange(false); onAttachLink(); }}>Attach Existing Link</Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
