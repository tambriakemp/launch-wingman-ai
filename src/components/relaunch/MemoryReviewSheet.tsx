import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Pencil, Loader2 } from "lucide-react";
import { MemoryReviewItem } from "@/hooks/useMemoryReview";
import { MemoryKey } from "@/types/projectMemory";

interface MemoryReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  items: MemoryReviewItem[];
  onMarkReviewed: (id: string) => Promise<void>;
  onMarkAllReviewed: () => Promise<void>;
  isLoading: boolean;
}

// Map memory keys to edit routes
const MEMORY_KEY_ROUTES: Record<MemoryKey, string> = {
  target_audience: "/plan",
  core_problem: "/plan",
  dream_outcome: "/plan",
  offer_format: "/plan",
  messaging: "/execute",
  transformation_statement: "/execute",
  funnel_type: "/plan",
  content_themes: "/content",
  launch_window_length: "/execute",
};

export function MemoryReviewSheet({
  open,
  onOpenChange,
  projectId,
  items,
  onMarkReviewed,
  onMarkAllReviewed,
  isLoading,
}: MemoryReviewSheetProps) {
  const navigate = useNavigate();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const handleMarkReviewed = async (id: string) => {
    setMarkingId(id);
    await onMarkReviewed(id);
    setMarkingId(null);
  };

  const handleMarkAllReviewed = async () => {
    setMarkingAll(true);
    await onMarkAllReviewed();
    setMarkingAll(false);
    onOpenChange(false);
  };

  const handleEdit = (memoryKey: MemoryKey) => {
    const route = MEMORY_KEY_ROUTES[memoryKey] || "/plan";
    navigate(`/projects/${projectId}${route}`);
    onOpenChange(false);
  };

  const needsReviewItems = items.filter((item) => item.needsReview);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Review carried-over items</SheetTitle>
          <SheetDescription>
            These items were copied from your previous launch. 
            Take a quick look to make sure they still feel right.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {needsReviewItems.length === 0 ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-6 text-center">
                <Check className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">All items reviewed!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You're all caught up
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {needsReviewItems.map((item) => (
                <Card key={item.id} className="border-border/50">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{item.label}</p>
                          <Badge variant="secondary" className="text-xs">
                            Needs review
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleEdit(item.memoryKey)}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleMarkReviewed(item.id)}
                          disabled={markingId === item.id}
                        >
                          {markingId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Looks good
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {needsReviewItems.length > 1 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleMarkAllReviewed}
                  disabled={markingAll}
                >
                  {markingAll ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Mark all as reviewed
                </Button>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
