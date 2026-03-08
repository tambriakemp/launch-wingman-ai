import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { useMemoryReview } from "@/hooks/useMemoryReview";
import { MemoryReviewSheet } from "./MemoryReviewSheet";

interface MemoryReviewBannerProps {
  projectId: string;
}

export function MemoryReviewBanner({ projectId }: MemoryReviewBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(`memory-review-dismissed-${projectId}`) === 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem(`memory-review-dismissed-${projectId}`, 'true');
    setDismissed(true);
  };
  const [sheetOpen, setSheetOpen] = useState(false);
  const { 
    itemsNeedingReview, 
    isLoading, 
    markReviewed, 
    markAllReviewed, 
    isMarkingReviewed 
  } = useMemoryReview({ projectId });

  if (isLoading || dismissed || itemsNeedingReview.length === 0) return null;

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <ClipboardCheck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {itemsNeedingReview.length} {itemsNeedingReview.length === 1 ? "item" : "items"} to review
                </p>
                <p className="text-xs text-muted-foreground">
                  Quick check from your last launch
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSheetOpen(true)}
                className="gap-1"
              >
                Review
                <ArrowRight className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <MemoryReviewSheet
        projectId={projectId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        items={itemsNeedingReview}
        onMarkReviewed={markReviewed}
        onMarkAllReviewed={markAllReviewed}
        isLoading={isMarkingReviewed}
      />
    </>
  );
}
