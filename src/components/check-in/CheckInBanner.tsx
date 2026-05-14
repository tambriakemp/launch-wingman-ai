import { Clock } from "lucide-react";
import { useCheckIn } from "@/hooks/useCheckIn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface CheckInBannerProps {
  onStartCheckIn: () => void;
}

const SNOOZE_OPTIONS: { label: string; days: number }[] = [
  { label: "Tomorrow", days: 1 },
  { label: "Next week", days: 7 },
  { label: "Next month", days: 30 },
];

export function CheckInBanner({ onStartCheckIn }: CheckInBannerProps) {
  const { shouldShowCheckIn, snoozeCheckIn } = useCheckIn();

  if (!shouldShowCheckIn) return null;

  return (
    <div
      className="relative flex items-center justify-between gap-3.5"
      style={{
        background: "linear-gradient(135deg, #F8E9C5, #F2D9A8)",
        borderRadius: 14,
        padding: "18px 20px",
      }}
    >
      <div className="min-w-0">
        <div
          className="text-[hsl(var(--ink-900))]"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 500,
            fontSize: 16,
            letterSpacing: "-0.01em",
          }}
        >
          Want to do a quick check-in?
        </div>
        <div
          className="text-[hsl(var(--ink-800))] mt-0.5"
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: 12,
          }}
        >
          Three questions. Keeps momentum honest.
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onStartCheckIn}
          className="rounded-full whitespace-nowrap hover:opacity-90 transition-opacity"
          style={{
            background: "hsl(var(--ink-900))",
            color: "hsl(var(--paper-100))",
            border: 0,
            padding: "8px 14px",
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Start check-in
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Remind me later"
            className="h-7 w-7 rounded-full inline-flex items-center justify-center text-[hsl(var(--ink-900))/0.6] hover:bg-black/5 transition-colors"
          >
            <Clock className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Remind me…
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SNOOZE_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.days} onClick={() => snoozeCheckIn(opt.days)}>
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
