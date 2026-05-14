import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface CheckInCompleteProps {
  onClose: () => void;
}

export function CheckInComplete({ onClose }: CheckInCompleteProps) {
  return (
    <div className="p-6 space-y-6 text-center">
      <div className="space-y-3">
        <h2 className="font-serif text-2xl font-medium text-foreground tracking-tight">
          That's okay.
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          You can come back to this anytime. If you want a moment with someone else's words,
          your Playbook has a few prompts to wander through.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button asChild variant="outline" className="w-full" size="lg">
          <Link to="/playbook" onClick={onClose}>
            <BookOpen className="w-4 h-4 mr-1.5" />
            Open your Playbook
          </Link>
        </Button>
        <Button onClick={onClose} variant="ghost" className="w-full">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
