import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SalesPagePreview } from "./SalesPagePreview";
import type { SalesCopySection, SectionDraft } from "./types";

interface SalesPagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: SalesCopySection[];
  drafts: Record<string, SectionDraft>;
  offerTitle: string;
  onEditSection?: (section: SalesCopySection) => void;
}

export const SalesPagePreviewDialog = ({
  open,
  onOpenChange,
  sections,
  drafts,
  offerTitle,
  onEditSection,
}: SalesPagePreviewDialogProps) => {
  const handleEditSection = (section: SalesCopySection) => {
    onOpenChange(false);
    onEditSection?.(section);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Sales Page Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <SalesPagePreview
            sections={sections}
            drafts={drafts}
            offerTitle={offerTitle}
            onEditSection={handleEditSection}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
