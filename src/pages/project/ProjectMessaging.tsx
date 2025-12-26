import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams, useLocation } from "react-router-dom";
import { SalesPageCopyBuilder } from "@/components/SalesPageCopyBuilder";
import { SocialBioBuilder } from "@/components/SocialBioBuilder";
import { EmailSequencesSection } from "@/components/messaging/EmailSequencesSection";
import { PlanPageHeader } from "@/components/PlanPageHeader";

const sectionMap: Record<string, React.ComponentType<{ projectId: string }>> = {
  "sales-copy": SalesPageCopyBuilder,
  "social-bio": SocialBioBuilder,
  emails: EmailSequencesSection,
};

const sectionConfig: Record<string, { title: string; description: string }> = {
  "sales-copy": {
    title: "Sales Page Copy",
    description: "Build copy for all pages in your funnel",
  },
  "social-bio": {
    title: "Social Media Bio",
    description: "Create engaging bios for your social profiles",
  },
  emails: {
    title: "Email Sequences",
    description: "Build nurture sequences, launch emails, and follow-ups",
  },
};

const ProjectMessaging = () => {
  const { id } = useParams();
  const location = useLocation();

  if (!id) return null;

  // Extract section from path: /projects/:id/sales-copy → sales-copy
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
