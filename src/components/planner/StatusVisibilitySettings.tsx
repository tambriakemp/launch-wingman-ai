import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_STATUSES } from "@/hooks/useStatusVisibility";

interface StatusVisibilitySettingsProps {
  visibility: Record<string, boolean>;
  onToggle: (statusId: string) => void;
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
}: StatusVisibilitySettingsProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3">
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
      </PopoverContent>
    </Popover>
  );
};
