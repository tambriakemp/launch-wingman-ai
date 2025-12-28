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
  // Base route (/projects/:id) = Dashboard with lifecycle views
  // /projects/:id/dashboard = Offer builder without lifecycle views
  const isDashboardRoute = section === "dashboard";

  return (
    <ProjectLayout>
      {isDashboardRoute ? (
        <OfferOverviewContent projectId={id} />
      ) : (
        <FunnelOverviewContent projectId={id} />
      )}
    </ProjectLayout>
  );
};

export default ProjectPlan;
