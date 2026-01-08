import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, ArrowRight, X } from "lucide-react";
import { useState } from "react";

interface MemoryReviewBannerProps {
  itemCount: number;
  onOpenReview: () => void;
}

export function MemoryReviewBanner({ itemCount, onOpenReview }: MemoryReviewBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || itemCount === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <ClipboardCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {itemCount} {itemCount === 1 ? "item" : "items"} to review
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
              onClick={onOpenReview}
              className="gap-1"
            >
              Review
              <ArrowRight className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setDismissed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
