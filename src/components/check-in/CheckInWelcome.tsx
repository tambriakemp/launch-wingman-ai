import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCheckIn } from "@/hooks/useCheckIn";

interface CheckInWelcomeProps {
  onStart: () => void;
  onSkip: () => void; // kept for back-compat; not directly used by the menu below
}

const SNOOZE_OPTIONS: { label: string; days: number }[] = [
  { label: "Tomorrow", days: 1 },
  { label: "Next week", days: 7 },
  { label: "Next month", days: 30 },
];

export function CheckInWelcome({ onStart, onSkip }: CheckInWelcomeProps) {
  const { snoozeCheckIn } = useCheckIn();

  const handleSnooze = async (days: number) => {
    await snoozeCheckIn(days);
    onSkip();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Quick check-in</p>
        <h2 className="font-serif text-2xl font-medium text-foreground tracking-tight">
          A moment to notice where you are.
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          This isn't a review or a reset. Just a few questions, then back to it.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={onStart} className="w-full" size="lg">
          Start check-in
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring/40">
            Remind me later
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Remind me…
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SNOOZE_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.days} onClick={() => handleSnooze(opt.days)}>
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
