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
      <ContentTab projectId={projectId} />
    </ProjectLayout>
  );
};

export default ProjectContent;
