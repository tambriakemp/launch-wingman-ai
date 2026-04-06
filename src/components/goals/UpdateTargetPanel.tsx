import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Minus, Plus, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GoalTarget } from "@/pages/Goals";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "CA$", AUD: "A$",
  CHF: "CHF", CNY: "¥", INR: "₹", MXN: "MX$", BRL: "R$", KRW: "₩",
  SGD: "S$", HKD: "HK$", NOK: "kr", SEK: "kr", DKK: "kr", NZD: "NZ$",
  ZAR: "R", RUB: "₽", TRY: "₺", AED: "د.إ", SAR: "﷼", PLN: "zł",
  THB: "฿", IDR: "Rp", PHP: "₱", COP: "COL$", NGN: "₦", EGP: "E£",
};

function getCurrencySymbol(unit: string | null): string {
  if (!unit) return "$";
  return CURRENCY_SYMBOLS[unit] || unit;
}

interface UpdateTargetPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: GoalTarget | null;
  onSave: (targetId: string, newCurrentValue: number, newStartValue: number, newTargetValue: number, note: string) => Promise<void>;
}

export function UpdateTargetPanel({ open, onOpenChange, target, onSave }: UpdateTargetPanelProps) {
  const [currentValue, setCurrentValue] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const [targetValue, setTargetValue] = useState(0);
  const [adjustAmount, setAdjustAmount] = useState("1");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (target && open) {
      setCurrentValue(Number(target.current_value));
      setStartValue(Number(target.start_value));
      setTargetValue(Number(target.target_value));
      setAdjustAmount("1");
      setNote("");
    }
  }, [target, open]);

  if (!target) return null;

  const isCurrency = target.target_type === "currency";
  const symbol = isCurrency ? getCurrencySymbol(target.unit) : "";
  const range = targetValue - startValue;
  const progress = range > 0 ? Math.min(100, Math.round(((currentValue - startValue) / range) * 100)) : 0;

  const handleDecrease = () => {
    const amt = Number(adjustAmount) || 1;
    setCurrentValue(prev => prev - amt);
  };

  const handleIncrease = () => {
    const amt = Number(adjustAmount) || 1;
    setCurrentValue(prev => prev + amt);
  };

  const handleSave = async () => {
    if (!target) return;
    setIsSaving(true);
    try {
      await onSave(target.id, currentValue, startValue, targetValue, note.trim());
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l border-border [&>button]:hidden">
        {/* Close */}
        <div className="flex justify-end p-4 pb-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pb-8 pt-2 space-y-8 flex-1 overflow-y-auto">
          {/* Target name */}
          <div className="text-center space-y-1">
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{target.name}</h3>
            <p className="text-sm text-muted-foreground">{progress}%</p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>

          {/* Start / Current / Target row */}
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Start</p>
              <input
                type="number"
                value={startValue}
                onChange={(e) => setStartValue(Number(e.target.value) || 0)}
                className="w-20 text-center text-sm font-semibold text-foreground bg-transparent border-b border-border focus:border-primary focus:outline-none transition-colors py-1"
              />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current</p>
              <div className="inline-flex items-center gap-1 bg-primary/10 rounded-full px-4 py-1.5">
                <span className="text-sm font-bold text-primary">
                  {symbol}{currentValue.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Target</p>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value) || 1)}
                className="w-20 text-center text-sm font-semibold text-foreground bg-transparent border-b border-border focus:border-primary focus:outline-none transition-colors py-1"
              />
            </div>
          </div>

          {/* Increase / Decrease buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleDecrease}
            >
              <Minus className="w-4 h-4" /> Decrease
            </Button>
            <Button
              type="button"
              className="flex-1 gap-2"
              onClick={handleIncrease}
            >
              <Plus className="w-4 h-4" /> Increase
            </Button>
          </div>

          {/* Adjust amount */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">#</p>
            <input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="1"
              className="w-full h-11 border-0 border-b border-border bg-transparent px-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Note (optional)</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this update..."
              rows={3}
              className="resize-none text-sm"
              maxLength={500}
            />
          </div>

          {/* Save */}
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save update"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
