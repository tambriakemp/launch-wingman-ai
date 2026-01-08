import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChildProject {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export function useChildProjects(projectId: string | undefined) {
  return useQuery({
    queryKey: ["child-projects", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, created_at")
        .eq("parent_project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((p): ChildProject => ({
        id: p.id,
        name: p.name,
        status: p.status,
        createdAt: p.created_at,
      }));
    },
    enabled: !!projectId,
  });
}
