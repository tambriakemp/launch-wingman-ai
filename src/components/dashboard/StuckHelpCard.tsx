import { HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StuckHelpCardProps {
  onOpenModal: () => void;
}

export const StuckHelpCard = ({ onOpenModal }: StuckHelpCardProps) => {
  return (
    <Card className="border bg-muted/30">
      <CardContent className="p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Feeling stuck?</p>
            <p className="text-xs text-muted-foreground">
              Not sure how to move forward? Get help with this step.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenModal}>
          I'm stuck
        </Button>
      </CardContent>
    </Card>
  );
};
