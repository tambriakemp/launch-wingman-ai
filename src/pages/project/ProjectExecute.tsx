import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { TasksBoard } from "@/components/TasksBoard";
import { ContentPlanner } from "@/components/ContentPlanner";
import { supabase } from "@/integrations/supabase/client";

const ProjectExecute = () => {
  const { id } = useParams();
  const location = useLocation();
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

  // Extract section from path: /projects/:id/tasks → tasks
  const pathParts = location.pathname.split("/");
  const section = pathParts[pathParts.length - 1];

  return (
    <ProjectLayout>
      {section === "tasks" ? (
        <TasksBoard projectId={id} projectType={projectType} />
      ) : section === "social" ? (
        <ContentPlanner projectId={id} />
      ) : null}
    </ProjectLayout>
  );
};

export default ProjectExecute;
