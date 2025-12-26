import { useState } from "react";
import { Bookmark, Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BlueprintIdea, ContentFormat, FORMAT_LABELS } from "@/data/blueprintContent";

interface ContentIdeaCardProps {
  idea: BlueprintIdea;
  projectId: string;
  funnelType: string | null;
  onTurnIntoPost: (idea: BlueprintIdea) => void;
  onSkip?: (ideaId: string) => void;
  formatLabels: typeof FORMAT_LABELS;
}

export const ContentIdeaCard = ({
  idea,
  projectId,
  funnelType,
  onTurnIntoPost,
  onSkip,
  formatLabels,
}: ContentIdeaCardProps) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.from("content_ideas").insert({
        project_id: projectId,
        user_id: user.id,
        title: idea.title,
        description: idea.whyItWorks,
        content_type: idea.contentType,
        phase: idea.phase,
        funnel_type: funnelType,
        is_saved: true,
      });

      if (error) throw error;
      
      setSaved(true);
      toast.success("Idea saved for later");
    } catch (error) {
      console.error("Error saving idea:", error);
      toast.error("Couldn't save that one");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    setSkipped(true);
    onSkip?.(idea.id);
  };

  if (skipped) {
    return null;
  }

  return (
    <div className="p-4 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground mb-1">{idea.title}</h4>
          <p className="text-sm text-muted-foreground mb-3">{idea.whyItWorks}</p>
          
          {/* Format tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {idea.formats.map((format) => (
              <Badge 
                key={format} 
                variant="secondary" 
                className="text-xs font-normal"
              >
                {formatLabels[format]}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTurnIntoPost(idea)}
          className="text-xs"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Turn into a post
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={saving || saved}
          className={cn("text-xs", saved && "text-primary")}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Bookmark className={cn("w-3.5 h-3.5 mr-1.5", saved && "fill-primary")} />
          )}
          {saved ? "Saved" : "Save idea"}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-xs text-muted-foreground ml-auto"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Skip
        </Button>
      </div>
    </div>
  );
};
