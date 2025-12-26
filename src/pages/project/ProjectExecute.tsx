import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { TasksBoard } from "@/components/TasksBoard";
import { supabase } from "@/integrations/supabase/client";

const ProjectExecute = () => {
  const { id } = useParams();
  const [projectType, setProjectType] = useState<"launch" | "prelaunch">("launch");

  useEffect(() => {
    const fetchProjectType = async () => {
      if (!id) return;
      const { data } = await supabase
        .from("projects")
        .select("project_type")
        .eq("id", id)
        .maybeSingle();
      if (data?.project_type) {
        setProjectType(data.project_type as "launch" | "prelaunch");
      }
    };
    fetchProjectType();
  }, [id]);

  if (!id) return null;

  return (
    <ProjectLayout>
      <TasksBoard projectId={id} projectType={projectType} />
    </ProjectLayout>
  );
};

export default ProjectExecute;
