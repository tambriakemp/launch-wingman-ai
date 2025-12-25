import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { RelaunchFlow } from "@/components/relaunch";
import { ProjectState } from "@/types/projectLifecycle";

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
    if (projectStatus && !["launched", "completed"].includes(projectStatus)) {
      navigate(`/projects/${id}`);
    }
  }, [projectStatus, id, navigate]);

  if (isLoading || !id) {
    return (
      <ProjectLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
