import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { PageLoader } from "@/components/ui/page-loader";
import { supabase } from "@/integrations/supabase/client";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { RelaunchFlow } from "@/components/relaunch";
import { ProjectState } from "@/types/projectLifecycle";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";

export default function Relaunch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState<string>("");
  const [projectStatus, setProjectStatus] = useState<ProjectState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      if (!id) return;

      const { data, error } = await supabase
        .from("projects")
        .select("name, status")
        .eq("id", id)
        .single();

      if (error || !data) {
        navigate(`/projects/${id}`);
        return;
      }

      setProjectName(data.name);
      setProjectStatus(data.status as ProjectState);
      setIsLoading(false);
    }

    fetchProject();
  }, [id, navigate]);

  // Only allow relaunch from launched or completed states
  useEffect(() => {
    if (projectStatus && !["launched", "completed", "post-launch"].includes(projectStatus)) {
      navigate(`/projects/${id}`);
    }
  }, [projectStatus, id, navigate]);

  const { hasAccess, isLoading: accessLoading } = useFeatureAccess();
  const canRelaunch = hasAccess('relaunch_mode');

  if (isLoading || accessLoading || !id) {
    return (
      <ProjectLayout>
        <PageLoader containerClassName="flex items-center justify-center py-16" />
      </ProjectLayout>
    );
  }

  // Show upgrade prompt if user doesn't have access
  if (!canRelaunch) {
    return (
      <ProjectLayout>
        <div className="max-w-md mx-auto py-16 px-4">
          <UpgradePrompt feature="relaunch_mode" variant="card" />
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <RelaunchFlow
        projectId={id}
        projectName={projectName}
        onCancel={() => navigate(`/projects/${id}`)}
      />
    </ProjectLayout>
  );
}
