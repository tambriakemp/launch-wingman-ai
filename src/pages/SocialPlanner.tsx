import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { ContentTab } from "@/components/content/ContentTab";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const SocialPlanner = () => {
  const { user } = useAuth();

  const { data: defaultProjectId } = useQuery({
    queryKey: ["default-project", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      return data?.id ?? null;
    },
    enabled: !!user?.id,
  });

  return (
    <ProjectLayout>
      <div className="-m-4 md:-m-6 h-[calc(100vh-theme(spacing.16))]">
        <ContentTab projectId={defaultProjectId ?? null} />
      </div>
    </ProjectLayout>
  );
};

export default SocialPlanner;
