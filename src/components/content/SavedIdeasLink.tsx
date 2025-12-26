import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SavedIdeasLinkProps {
  projectId: string;
  onOpen: () => void;
}

export const SavedIdeasLink = ({ projectId, onOpen }: SavedIdeasLinkProps) => {
  const { user } = useAuth();

  // Fetch counts
  const { data: counts } = useQuery({
    queryKey: ["saved-content-counts", projectId],
    queryFn: async () => {
      const [ideasResult, draftsResult] = await Promise.all([
        supabase
          .from("content_ideas")
          .select("id", { count: "exact", head: true })
          .eq("project_id", projectId)
          .eq("is_saved", true),
        supabase
          .from("content_drafts")
          .select("id", { count: "exact", head: true })
          .eq("project_id", projectId),
      ]);
      
      return {
        ideas: ideasResult.count || 0,
        drafts: draftsResult.count || 0,
      };
    },
    enabled: !!user,
  });

  const totalCount = (counts?.ideas || 0) + (counts?.drafts || 0);

  if (totalCount === 0) {
    return null;
  }

  return (
    <button
      onClick={onOpen}
      className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <FileText className="w-4 h-4" />
      <span>
        View saved ideas & drafts
        <span className="ml-1.5 text-xs opacity-70">({totalCount})</span>
      </span>
      <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
    </button>
  );
};
