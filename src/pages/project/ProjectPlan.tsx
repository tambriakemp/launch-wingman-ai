import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams, useLocation } from "react-router-dom";
import FunnelOverviewContent from "./plan/FunnelOverviewContent";
import OfferOverviewContent from "./plan/OfferOverviewContent";

const ProjectPlan = () => {
  const { id } = useParams();
  const location = useLocation();

  if (!id) return null;

  // Extract section from path: /projects/:id/offer → offer
  const pathParts = location.pathname.split("/");
  const section = pathParts[pathParts.length - 1];
  
  // Determine which component to render based on route
  // /projects/:id/dashboard = Dashboard with lifecycle views, next task, progress
  // Base route (/projects/:id) = Offer builder
  const isDashboardRoute = section === "dashboard";

  return (
    <ProjectLayout>
      {isDashboardRoute ? (
        <FunnelOverviewContent projectId={id} />
      ) : (
        <OfferOverviewContent projectId={id} />
      )}
    </ProjectLayout>
  );
};

export default ProjectPlan;
