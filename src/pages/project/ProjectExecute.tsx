import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ListTodo } from "lucide-react";
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
      <div className="max-w-7xl mx-auto px-2.5 md:px-6 py-8">
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 bg-orange-100/50 dark:bg-orange-900/20 rounded-xl shrink-0">
            <ListTodo className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Launch Tasks</h1>
            <p className="text-muted-foreground">Manage and track your launch tasks.</p>
          </div>
        </div>
        <TasksBoard projectId={id} projectType={projectType} />
      </div>
    </ProjectLayout>
  );
};

export default ProjectExecute;
