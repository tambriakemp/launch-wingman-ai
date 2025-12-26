import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams, useLocation } from "react-router-dom";
import { SocialBioBuilder } from "@/components/SocialBioBuilder";
import { PlanPageHeader } from "@/components/PlanPageHeader";

const sectionMap: Record<string, React.ComponentType<{ projectId: string }>> = {
  "social-bio": SocialBioBuilder,
};

const sectionConfig: Record<string, { title: string; description: string }> = {
  "social-bio": {
    title: "Social Media Bio",
    description: "Create engaging bios for your social profiles",
  },
};

const ProjectMessaging = () => {
  const { id } = useParams();
  const location = useLocation();

  if (!id) return null;

  // Extract section from path: /projects/:id/social-bio → social-bio
  const pathParts = location.pathname.split("/");
  const section = pathParts[pathParts.length - 1];
  const SectionComponent = sectionMap[section];
  const config = sectionConfig[section];

  if (!SectionComponent || !config) return null;

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <PlanPageHeader title={config.title} description={config.description} />
        <SectionComponent projectId={id} />
      </div>
    </ProjectLayout>
  );
};

export default ProjectMessaging;
