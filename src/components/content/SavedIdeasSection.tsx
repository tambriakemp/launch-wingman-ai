import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SavedIdeasSectionProps {
  projectId: string;
}

interface SavedIdea {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  created_at: string;
}

interface SavedDraft {
  id: string;
  title: string;
  content: string;
  content_type: string;
  created_at: string;
}

export const SavedIdeasSection = ({ projectId }: SavedIdeasSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch saved ideas
  const { data: savedIdeas = [] } = useQuery({
    queryKey: ["content-ideas", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_ideas")
        .select("id, title, description, content_type, created_at")
        .eq("project_id", projectId)
        .eq("is_saved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavedIdea[];
    },
    enabled: !!user,
  });

  // Fetch saved drafts
  const { data: savedDrafts = [] } = useQuery({
    queryKey: ["content-drafts", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_drafts")
        .select("id, title, content, content_type, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavedDraft[];
    },
    enabled: !!user,
  });

  const handleDeleteIdea = async (id: string) => {
    try {
      const { error } = await supabase
        .from("content_ideas")
        .delete()
        .eq("id", id);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["content-ideas", projectId] });
      toast.success("Idea removed");
    } catch (error) {
      console.error("Error deleting idea:", error);
      toast.error("Failed to remove idea");
    }
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      const { error } = await supabase
        .from("content_drafts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["content-drafts", projectId] });
      toast.success("Draft removed");
    } catch (error) {
      console.error("Error deleting draft:", error);
      toast.error("Failed to remove draft");
    }
  };

  const allItems = [
    ...savedIdeas.map((idea) => ({ ...idea, type: "idea" as const })),
    ...savedDrafts.map((draft) => ({ ...draft, type: "draft" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (allItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 pt-6 border-t border-border">
      <div>
        <h2 className="text-lg font-medium text-foreground">Saved ideas & drafts</h2>
        <p className="text-sm text-muted-foreground">
          Your saved content ideas and drafts for this project.
        </p>
      </div>

      <div className="space-y-2">
        {allItems.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.type === "draft" ? "Draft" : "Idea"} · {format(new Date(item.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => 
                item.type === "idea" 
                  ? handleDeleteIdea(item.id) 
                  : handleDeleteDraft(item.id)
              }
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
