import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { FileText, Sparkles } from "lucide-react";
import { TasksBoard } from "@/components/TasksBoard";
import { supabase } from "@/integrations/supabase/client";

const ProjectExecute = () => {
  const { id } = useParams();
  const [projectType, setProjectType] = useState<"launch" | "prelaunch">("launch");
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      const { data } = await supabase
        .from("projects")
        .select("project_type, name")
        .eq("id", id)
        .maybeSingle();
      if (data?.project_type) {
        setProjectType(data.project_type as "launch" | "prelaunch");
      }
      if (data?.name) setProjectName(data.name);
    };
    fetchProject();
  }, [id]);

  if (!id) return null;

  // Format today's date — "Tue · April 21"
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  }).replace(",", " ·").replace(" ", " ").replace(" ", " · ");

  return (
    <ProjectLayout>
      {/* Editorial cream canvas overrides the dashboard background for this page */}
      <div className="bg-paper-100 min-h-full -mx-2.5 md:-mx-6 px-2.5 md:px-6">
        <div className="max-w-[1080px] mx-auto px-2 md:px-10 pt-9 pb-20">
          {/* Editorial header */}
          <div className="mb-5">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-terracotta">
              {dateLabel}
            </div>
            <h1 className="font-display-hero text-[36px] sm:text-[48px] md:text-[52px] font-normal leading-[1.03] tracking-[-0.025em] text-ink-900 mt-3.5 mb-2.5">
              Your launch,{" "}
              <em className="italic font-light text-terracotta">one quiet step</em> at
              a time.
            </h1>
            <p className="font-sans text-[15px] sm:text-base leading-[1.6] text-fg-secondary max-w-[620px] m-0">
              These tasks were generated for{" "}
              <strong className="text-ink-900 font-semibold">
                {projectName || "your project"}
              </strong>
              . Work through them in order — each one unlocks the next.
            </p>
          </div>

          {/* Phase snapshot CTA */}
          <div className="flex justify-end mb-4">
            <Link
              to={`/projects/${id}/summary`}
              className="inline-flex items-center gap-1.5 bg-white border border-hairline rounded-full px-3.5 py-1.5 font-sans text-[12.5px] text-ink-800 hover:bg-paper-100 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Launch Brief
            </Link>
          </div>

          {/* Phase cards */}
          <TasksBoard projectId={id} projectType={projectType} />

          {/* Footer regen helper */}
          <div className="mt-10 px-6 py-5 rounded-2xl border border-hairline flex items-center gap-5 flex-wrap"
            style={{
              background:
                "linear-gradient(160deg, #ffffff 0%, hsl(var(--clay-200)) 100%)",
            }}
          >
            <div className="w-10 h-10 rounded-full bg-ink-900 inline-flex items-center justify-center text-paper-100 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-[220px]">
              <div className="font-display text-[16px] sm:text-[17px] font-medium text-ink-900 tracking-[-0.01em]">
                Tasks feel off? Regenerate from your latest goal.
              </div>
              <div className="font-sans text-[13px] text-fg-secondary mt-0.5">
                We'll re-read your offer and launch brief, then rebuild the phases below — completed work stays done.
              </div>
            </div>
            <Link
              to={`/projects/${id}/summary`}
              className="bg-ink-900 text-paper-100 hover:bg-ink-800 px-4 py-2.5 rounded-full font-sans text-[13px] font-medium whitespace-nowrap transition-colors"
            >
              Open Launch Brief
            </Link>
          </div>
        </div>
      </div>
    </ProjectLayout>
  );
};

export default ProjectExecute;
