import { useState } from "react";
import { Bookmark, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TalkingPointCardProps {
  id: string;
  title: string;
  description: string;
  projectId: string;
  contentType: string;
  phase: string;
  funnelType: string | null;
  isSaved?: boolean;
  onSave?: () => void;
  onTurnIntoPost: () => void;
}

export const TalkingPointCard = ({
  id,
  title,
  description,
  projectId,
  contentType,
  phase,
  funnelType,
  isSaved = false,
  onSave,
  onTurnIntoPost,
}: TalkingPointCardProps) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.from("content_ideas").insert({
        project_id: projectId,
        user_id: user.id,
        title,
        description,
        content_type: contentType,
        phase,
        funnel_type: funnelType,
        is_saved: true,
      });

      if (error) throw error;
      
      setSaved(true);
      toast.success("Idea saved");
      queryClient.invalidateQueries({ queryKey: ["saved-content-counts", projectId] });
      onSave?.();
    } catch (error) {
      console.error("Error saving idea:", error);
      toast.error("Failed to save idea");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-xl border border-border bg-card hover:border-border/80 transition-colors">
      <h3 className="text-base font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{description}</p>
      
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onTurnIntoPost}
          className="text-sm"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Turn into a post
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={saving || saved}
          className={cn(
            "text-sm text-muted-foreground",
            saved && "text-primary"
          )}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Bookmark className={cn("w-4 h-4 mr-2", saved && "fill-primary")} />
          )}
          {saved ? "Saved" : "Save"}
        </Button>
      </div>
    </div>
  );
};
