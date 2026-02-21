import { useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { ContentTab } from "@/components/content/ContentTab";

const ProjectContent = () => {
  const { id: projectId } = useParams<{ id: string }>();

  if (!projectId) {
    return null;
  }

  return (
    <ProjectLayout>
      <div className="-m-4 md:-m-6 h-[calc(100vh-theme(spacing.16))]">
        <ContentTab projectId={projectId} />
      </div>
    </ProjectLayout>
  );
};

export default ProjectContent;
