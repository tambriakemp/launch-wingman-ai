import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";

interface TikTokPrivacySelectorProps {
  value: string;
  onChange: (value: string) => void;
  privacyOptions: string[];
  isSandbox: boolean;
  disabled?: boolean;
}

const PRIVACY_LABELS: Record<string, string> = {
  PUBLIC_TO_EVERYONE: "Everyone",
  MUTUAL_FOLLOW_FRIENDS: "Friends",
  FOLLOWER_OF_CREATOR: "Followers",
  SELF_ONLY: "Only Me",
};

export function TikTokPrivacySelector({
  value,
  onChange,
  privacyOptions,
  isSandbox,
  disabled = false,
}: TikTokPrivacySelectorProps) {
  // For sandbox, always show SELF_ONLY as the only option
  const options = isSandbox ? ["SELF_ONLY"] : privacyOptions;
  
  // Ensure the current value is valid for the options
  const effectiveValue = options.includes(value) ? value : options[0];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Who can view this video</Label>
      </div>
      <Select
        value={effectiveValue}
        onValueChange={onChange}
        disabled={disabled || isSandbox}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select privacy level" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {PRIVACY_LABELS[option] || option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
