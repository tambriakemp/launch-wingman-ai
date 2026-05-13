import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_STATUSES } from "@/hooks/useStatusVisibility";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";

interface StatusVisibilitySettingsProps {
  visibility: Record<string, boolean>;
  onToggle: (statusId: string) => void;
  spaces?: PlannerSpace[];
  categories?: SpaceCategory[];
  spaceVisibility?: Record<string, boolean>;
  onToggleSpace?: (id: string) => void;
  categoryVisibility?: Record<string, boolean>;
  onToggleCategory?: (id: string) => void;
}

const STATUS_DOTS: Record<string, string> = {
  todo: "bg-muted-foreground",
  "in-progress": "bg-blue-500",
  "in-review": "bg-purple-500",
  done: "bg-emerald-500",
  blocked: "bg-red-500",
  abandoned: "bg-zinc-400",
};

export const StatusVisibilitySettings = ({
  visibility,
  onToggle,
  spaces = [],
  categories = [],
  spaceVisibility = {},
  onToggleSpace,
  categoryVisibility = {},
  onToggleCategory,
}: StatusVisibilitySettingsProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 max-h-[70vh] overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Show statuses
        </p>
        <div className="space-y-2.5">
          {ALL_STATUSES.map((s) => (
            <label
              key={s.id}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${STATUS_DOTS[s.id] || "bg-muted-foreground"}`} />
                <span className="text-sm">{s.label}</span>
              </div>
              <Switch
                checked={visibility[s.id] !== false}
                onCheckedChange={() => onToggle(s.id)}
                className="scale-75"
              />
            </label>
          ))}
        </div>

        {spaces.length > 0 && onToggleSpace && (
          <>
            <div className="h-px bg-border my-3" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Show spaces
            </p>
            <div className="space-y-2.5">
              {spaces.map((sp) => (
                <label key={sp.id} className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sp.color }} />
                    <span className="text-sm truncate">{sp.name}</span>
                  </div>
                  <Switch
                    checked={spaceVisibility[sp.id] !== false}
                    onCheckedChange={() => onToggleSpace(sp.id)}
                    className="scale-75"
                  />
                </label>
              ))}
            </div>
          </>
        )}

        {categories.length > 0 && onToggleCategory && (
          <>
            <div className="h-px bg-border my-3" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Show categories
            </p>
            <div className="space-y-2.5">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="text-sm truncate">{c.name}</span>
                  </div>
                  <Switch
                    checked={categoryVisibility[c.id] !== false}
                    onCheckedChange={() => onToggleCategory(c.id)}
                    className="scale-75"
                  />
                </label>
              ))}
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0 bg-muted-foreground" />
                  <span className="text-sm truncate text-muted-foreground">Uncategorized</span>
                </div>
                <Switch
                  checked={categoryVisibility["__none__"] !== false}
                  onCheckedChange={() => onToggleCategory("__none__")}
                  className="scale-75"
                />
              </label>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
