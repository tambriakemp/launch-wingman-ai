import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, AlertCircle } from "lucide-react";

interface TikTokPrivacySelectorProps {
  value: string;
  onChange: (value: string) => void;
  privacyOptions: string[];
  isSandbox: boolean;
  isBrandedContent?: boolean;
  disabled?: boolean;
}

const PRIVACY_LABELS: Record<string, string> = {
  PUBLIC_TO_EVERYONE: "Everyone",
  MUTUAL_FOLLOW_FRIENDS: "Friends",
  FOLLOWER_OF_CREATOR: "Everyone",
  SELF_ONLY: "Only Me",
};

export function TikTokPrivacySelector({
  value,
  onChange,
  privacyOptions,
  isSandbox,
  isBrandedContent = false,
  disabled = false,
}: TikTokPrivacySelectorProps) {
  // For sandbox, always show SELF_ONLY as the only option
  const options = isSandbox ? ["SELF_ONLY"] : privacyOptions;
  
  // Don't auto-select - require user to choose (unless sandbox)
  const effectiveValue = isSandbox ? "SELF_ONLY" : value;
  const hasSelection = !!effectiveValue && options.includes(effectiveValue);

  // Check if an option should be disabled
  const isOptionDisabled = (option: string) => {
    // Branded content cannot be set to private
    if (isBrandedContent && option === "SELF_ONLY") {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Who can view this post?</Label>
        {isSandbox && (
          <Badge variant="secondary" className="text-xs gap-1">
            <FlaskConical className="w-3 h-3" />
            Only Me (App Unaudited)
          </Badge>
        )}
      </div>
      <Select
        value={effectiveValue}
        onValueChange={onChange}
        disabled={disabled || isSandbox}
      >
        <SelectTrigger className={!hasSelection && !isSandbox ? "text-muted-foreground" : ""}>
          <SelectValue placeholder="Select visibility" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const isDisabled = isOptionDisabled(option);
            
            if (isDisabled) {
              return (
                <TooltipProvider key={option}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative flex cursor-not-allowed select-none items-center rounded-sm px-2 py-1.5 text-sm opacity-50">
                        <span className="flex items-center gap-2">
                          {PRIVACY_LABELS[option] || option}
                          <AlertCircle className="w-3 h-3" />
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Branded content visibility cannot be set to private</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }
            
            return (
              <SelectItem key={option} value={option}>
                {PRIVACY_LABELS[option] || option}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {!hasSelection && !isSandbox && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Please select who can view this post
        </p>
      )}
    </div>
  );
}
