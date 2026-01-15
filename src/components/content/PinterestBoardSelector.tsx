import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePinterestEnvironmentSetting } from "@/hooks/usePinterestEnvironmentSetting";
import { usePinterestSandboxToken } from "@/hooks/usePinterestSandboxToken";

interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  privacy?: string;
}

interface PinterestBoardSelectorProps {
  selectedBoard: string | null;
  onBoardChange: (boardId: string | null) => void;
}

export function PinterestBoardSelector({ selectedBoard, onBoardChange }: PinterestBoardSelectorProps) {
  const { user } = useAuth();
  const { environment } = usePinterestEnvironmentSetting();
  const { token: sandboxToken } = usePinterestSandboxToken();

  const { data: boardsData, isLoading, error } = useQuery({
    queryKey: ["pinterest-boards", user?.id, environment, sandboxToken],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('pinterest-get-boards', {
        body: { environment, sandboxToken: environment === "sandbox" ? sandboxToken : undefined },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data.boards as PinterestBoard[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Pinterest Board</Label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading boards...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>Pinterest Board</Label>
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          {error instanceof Error ? error.message : "Failed to load boards"}
        </div>
      </div>
    );
  }

  if (!boardsData || boardsData.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Pinterest Board</Label>
        <p className="text-sm text-muted-foreground">
          No Pinterest boards found. Create a board on Pinterest first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Pinterest Board *</Label>
      <Select
        value={selectedBoard || ""}
        onValueChange={(value) => onBoardChange(value || null)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a board" />
        </SelectTrigger>
        <SelectContent>
          {boardsData.map((board) => (
            <SelectItem key={board.id} value={board.id}>
              <div className="flex items-center gap-2">
                <span>{board.name}</span>
                {board.privacy === "SECRET" && (
                  <span className="text-xs text-muted-foreground">(Private)</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
