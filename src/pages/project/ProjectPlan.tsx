import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams, useLocation } from "react-router-dom";
import ProjectFunnelOverviewContent from "./plan/FunnelOverviewContent";
import ProjectFunnelTypeContent from "./plan/FunnelTypeContent";
import ProjectAudienceContent from "./plan/AudienceContent";
import ProjectTransformationContent from "./plan/TransformationContent";
import ProjectOffersContent from "./plan/OffersContent";
import TechStackContent from "./plan/TechStackContent";

const sectionMap: Record<string, React.ComponentType<{ projectId: string }>> = {
  offer: ProjectFunnelOverviewContent,
  "funnel-type": ProjectFunnelTypeContent,
  audience: ProjectAudienceContent,
  transformation: ProjectTransformationContent,
  offers: ProjectOffersContent,
  "tech-stack": TechStackContent,
};

const ProjectPlan = () => {
  const { id } = useParams();
  const location = useLocation();

  if (!id) return null;

  // Extract section from path: /projects/:id/offer → offer
  const pathParts = location.pathname.split("/");
  const section = pathParts[pathParts.length - 1];
  
  // Default to "offer" (funnel overview) if on base project path
  const SectionComponent = sectionMap[section] || sectionMap["offer"];

  if (!SectionComponent) return null;

  return (
    <ProjectLayout>
      <SectionComponent projectId={id} />
    </ProjectLayout>
  );
};

export default ProjectPlan;
