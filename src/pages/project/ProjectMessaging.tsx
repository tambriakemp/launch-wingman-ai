import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams, useLocation } from "react-router-dom";
import { SalesPageCopyBuilder } from "@/components/SalesPageCopyBuilder";
import { SocialBioBuilder } from "@/components/SocialBioBuilder";
import { EmailSequencesSection } from "@/components/messaging/EmailSequencesSection";
import { DeliverableCopySection } from "@/components/messaging/DeliverableCopySection";

const sectionMap: Record<string, React.ComponentType<{ projectId: string }>> = {
  "sales-copy": SalesPageCopyBuilder,
  "social-bio": SocialBioBuilder,
  emails: EmailSequencesSection,
  deliverables: DeliverableCopySection,
};

const ProjectMessaging = () => {
  const { id } = useParams();
  const location = useLocation();

  if (!id) return null;

  // Extract section from path: /projects/:id/sales-copy → sales-copy
  const pathParts = location.pathname.split("/");
  const section = pathParts[pathParts.length - 1];
  const SectionComponent = sectionMap[section];

  if (!SectionComponent) return null;

  return (
    <ProjectLayout>
      <SectionComponent projectId={id} />
    </ProjectLayout>
  );
};

export default ProjectMessaging;
