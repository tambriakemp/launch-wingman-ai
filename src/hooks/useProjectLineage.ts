import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectLineageNode {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  isRelaunch: boolean;
  parentProjectId: string | null;
  children: ProjectLineageNode[];
  isCurrent: boolean;
}

interface RawProject {
  id: string;
  name: string;
  status: string;
  created_at: string;
  is_relaunch: boolean;
  parent_project_id: string | null;
}

export function useProjectLineage(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-lineage", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // First, get the current project
      const { data: currentProject, error: currentError } = await supabase
        .from("projects")
        .select("id, name, status, created_at, is_relaunch, parent_project_id, user_id")
        .eq("id", projectId)
        .single();

      if (currentError) throw currentError;

      // Find the root project by following parent_project_id chain
      let rootId = currentProject.id;
      let parentId = currentProject.parent_project_id;
      
      while (parentId) {
        const { data: parent } = await supabase
          .from("projects")
          .select("id, parent_project_id")
          .eq("id", parentId)
          .single();
        
        if (!parent) break;
        rootId = parent.id;
        parentId = parent.parent_project_id;
      }

      // Fetch all projects in this lineage (same user)
      const { data: allProjects, error: allError } = await supabase
        .from("projects")
        .select("id, name, status, created_at, is_relaunch, parent_project_id")
        .eq("user_id", currentProject.user_id)
        .order("created_at");

      if (allError) throw allError;

      // Build the tree from root
      const buildTree = (parentId: string | null): ProjectLineageNode[] => {
        return (allProjects || [])
          .filter((p: RawProject) => p.parent_project_id === parentId)
          .map((p: RawProject): ProjectLineageNode => ({
            id: p.id,
            name: p.name,
            status: p.status,
            createdAt: p.created_at,
            isRelaunch: p.is_relaunch,
            parentProjectId: p.parent_project_id,
            isCurrent: p.id === projectId,
            children: buildTree(p.id),
          }));
      };

      // Find root node
      const rootProject = (allProjects || []).find((p: RawProject) => p.id === rootId);
      if (!rootProject) return null;

      const root: ProjectLineageNode = {
        id: rootProject.id,
        name: rootProject.name,
        status: rootProject.status,
        createdAt: rootProject.created_at,
        isRelaunch: rootProject.is_relaunch,
        parentProjectId: rootProject.parent_project_id,
        isCurrent: rootProject.id === projectId,
        children: buildTree(rootProject.id),
      };

      // Check if there's actually a lineage (more than just current project)
      const hasLineage = root.children.length > 0 || root.id !== projectId;

      return hasLineage ? root : null;
    },
    enabled: !!projectId,
  });
}
