import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, FileText, MessageSquare, Lightbulb, ShoppingBag, Eye } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SavedIdeasSectionProps {
  projectId: string;
  onOpenItem: (item: SavedItem) => void;
}

interface SavedIdea {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  phase: string | null;
  funnel_type: string | null;
  created_at: string;
}

interface SavedDraft {
  id: string;
  title: string;
  content: string;
  content_type: string;
  phase: string | null;
  funnel_type: string | null;
  created_at: string;
}

export interface SavedItem {
  id: string;
  title: string;
  content: string;
  contentType: string;
  phase: string | null;
  funnelType: string | null;
  createdAt: string;
  type: "idea" | "draft";
}

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  general: { label: "General", icon: <MessageSquare className="w-3 h-3" /> },
  stories: { label: "Story", icon: <Lightbulb className="w-3 h-3" /> },
  offer: { label: "Offer", icon: <ShoppingBag className="w-3 h-3" /> },
  "behind-the-scenes": { label: "BTS", icon: <Eye className="w-3 h-3" /> },
};

export const SavedIdeasSection = ({ projectId, onOpenItem }: SavedIdeasSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch saved ideas
  const { data: savedIdeas = [] } = useQuery({
    queryKey: ["content-ideas", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_ideas")
        .select("id, title, description, content_type, phase, funnel_type, created_at")
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
        .select("id, title, content, content_type, phase, funnel_type, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavedDraft[];
    },
    enabled: !!user,
  });

  const handleDeleteIdea = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("content_ideas")
        .delete()
        .eq("id", id);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["content-ideas", projectId] });
      toast.success("Removed");
    } catch (error) {
      console.error("Error deleting idea:", error);
      toast.error("Failed to remove");
    }
  };

  const handleDeleteDraft = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("content_drafts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["content-drafts", projectId] });
      toast.success("Removed");
    } catch (error) {
      console.error("Error deleting draft:", error);
      toast.error("Failed to remove");
    }
  };

  const handleItemClick = (item: typeof allItems[0]) => {
    const savedItem: SavedItem = {
      id: item.id,
      title: item.title,
      content: item.type === "draft" ? (item as any).content : (item as any).description || "",
      contentType: item.content_type,
      phase: item.phase,
      funnelType: item.funnel_type,
      createdAt: item.created_at,
      type: item.type,
    };
    onOpenItem(savedItem);
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
          Click to view or edit. Here when you're ready.
        </p>
      </div>

      <div className="space-y-2">
        {allItems.map((item) => {
          const category = CATEGORY_LABELS[item.content_type] || CATEGORY_LABELS.general;
          
          return (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => handleItemClick(item)}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-xs py-0 h-5 gap-1">
                      {category.icon}
                      {category.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), "MMM d")}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => 
                  item.type === "idea" 
                    ? handleDeleteIdea(e, item.id) 
                    : handleDeleteDraft(e, item.id)
                }
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
