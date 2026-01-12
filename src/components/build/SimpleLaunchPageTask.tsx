import { useState } from "react";
import { ExternalLink, Check, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SimpleLaunchPageTaskProps {
  formData: Record<string, string>;
  checklistItems: string[];
  onChecklistToggle: (value: string) => void;
  onComplete: () => void;
  isCompleting: boolean;
}

const CHECKLIST_OPTIONS = [
  { value: 'page_exists', label: 'My page exists and is accessible' },
  { value: 'explains_offer', label: 'Someone could understand what this is from looking at it' },
  { value: 'clear_next_step', label: 'There\'s one clear next step for interested people' },
];

export function SimpleLaunchPageTask({
  checklistItems,
  onChecklistToggle,
  onComplete,
  isCompleting,
}: SimpleLaunchPageTaskProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isComplete = checklistItems.length === CHECKLIST_OPTIONS.length;

  const handleCompleteClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmComplete = () => {
    setShowConfirmation(false);
    onComplete();
  };

  return (
    <div className="space-y-8">
      {/* Main Framing Copy */}
      <div className="space-y-4">
        <p className="text-lg text-foreground font-medium">
          You don't need a complicated setup to launch.
        </p>
        <p className="text-foreground/80">
          For a minimum viable launch, one simple page is enough.
        </p>
      </div>

      {/* Recommendation */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-foreground">
                If you don't already have a platform, we recommend using{" "}
                <a 
                  href="https://systeme.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary font-medium hover:underline"
                >
                  systeme.io
                </a>{" "}
                because it's simple, all-in-one, and beginner-friendly.
              </p>
              <p className="text-sm text-muted-foreground">
                If you already use another tool, you can keep using it.
                This is just the simplest option if you want to avoid overthinking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optional Template Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Use a simple starting template
          </h3>
          <span className="text-xs text-muted-foreground/70 px-2 py-0.5 bg-muted rounded">
            optional
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          To save time, you can import a ready-to-use launch page and customize it instead of starting from scratch.
        </p>
        
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.open('https://systeme.io/funnel-templates', '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
          Import simple launch page (systeme.io)
        </Button>
      </div>

      {/* "This Is Enough" Clarity Box */}
      <Card className="bg-muted/50 border-border">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-4">
              <div>
                <p className="font-medium text-foreground mb-2">For this launch, you only need:</p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-foreground/80">
                    <Check className="w-4 h-4 text-primary" />
                    One page explaining what this is
                  </li>
                  <li className="flex items-center gap-2 text-foreground/80">
                    <Check className="w-4 h-4 text-primary" />
                    One clear next step for interested people
                  </li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-foreground mb-2">You do not need:</p>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>• multiple pages</li>
                  <li>• automations</li>
                  <li>• sequences</li>
                  <li>• integrations</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Your progress
        </h3>
        
        <div className="space-y-3">
          {CHECKLIST_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                checklistItems.includes(option.value)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
              }`}
              onClick={() => onChecklistToggle(option.value)}
            >
              <Checkbox
                id={option.value}
                checked={checklistItems.includes(option.value)}
                onCheckedChange={() => onChecklistToggle(option.value)}
              />
              <Label htmlFor={option.value} className="font-medium text-foreground cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Is Temporary Framing */}
      <div className="py-4 px-5 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-sm text-muted-foreground text-center">
          You're choosing tech for <span className="text-foreground font-medium">this launch only</span>.
          You can always change or improve it later.
        </p>
      </div>

      {/* Complete Button */}
      <Button
        size="lg"
        className="w-full sm:w-auto"
        onClick={handleCompleteClick}
        disabled={!isComplete || isCompleting}
      >
        {isCompleting ? "Saving..." : "Save & mark complete →"}
      </Button>

      {/* Soft Completion Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick check</DialogTitle>
            <DialogDescription className="text-base pt-2">
              Does your page clearly explain what this is and how someone can move forward?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleConfirmComplete}
              className="w-full sm:w-auto"
            >
              I want to tweak a bit more
            </Button>
            <Button
              onClick={handleConfirmComplete}
              className="w-full sm:w-auto"
            >
              Yes — that's enough
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
