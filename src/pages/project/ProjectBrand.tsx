import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams, useLocation } from "react-router-dom";
import LogosSection from "@/components/branding/LogosSection";
import ColorsSection from "@/components/branding/ColorsSection";
import FontsSection from "@/components/branding/FontsSection";
import PhotosSection from "@/components/branding/PhotosSection";

const sectionMap: Record<string, React.ComponentType<{ projectId: string }>> = {
  logos: LogosSection,
  colors: ColorsSection,
  fonts: FontsSection,
  photos: PhotosSection,
};

const ProjectBrand = () => {
  const { id } = useParams();
  const location = useLocation();

  if (!id) return null;

  // Extract section from path: /projects/:id/logos → logos
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

export default ProjectBrand;
