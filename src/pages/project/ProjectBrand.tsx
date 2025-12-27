import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams, useLocation, Navigate } from "react-router-dom";
import LogosSection from "@/components/branding/LogosSection";

const ProjectBrand = () => {
  const { id } = useParams();
  const location = useLocation();

  if (!id) return null;

  // Extract section from path: /projects/:id/logos → logos
  const pathParts = location.pathname.split("/");
  const section = pathParts[pathParts.length - 1];

  // Redirect colors, fonts, photos to the visual direction task
  if (section === "colors" || section === "fonts" || section === "photos") {
    return <Navigate to={`/projects/${id}/tasks/messaging_visual_direction`} replace />;
  }

  // Only logos section remains here
  if (section !== "logos") return null;

  return (
    <ProjectLayout>
      <LogosSection projectId={id} />
    </ProjectLayout>
  );
};

export default ProjectBrand;
