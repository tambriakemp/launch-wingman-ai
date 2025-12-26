import { useState } from "react";
import { Bookmark, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      onSave?.();
    } catch (error) {
      console.error("Error saving idea:", error);
      toast.error("Failed to save idea");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow">
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={saving || saved}
          className={cn(
            "text-xs",
            saved && "text-primary"
          )}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Bookmark className={cn("w-3.5 h-3.5 mr-1.5", saved && "fill-primary")} />
          )}
          {saved ? "Saved" : "Save"}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onTurnIntoPost}
          className="text-xs"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Turn into a post
        </Button>
      </div>
    </div>
  );
};
