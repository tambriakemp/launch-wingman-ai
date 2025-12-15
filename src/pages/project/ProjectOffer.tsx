import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams } from "react-router-dom";
import { OfferBuilder } from "@/components/OfferBuilder";

const ProjectOffer = () => {
  const { id } = useParams();

  if (!id) return null;

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Offer Builder</h1>
          <p className="text-muted-foreground">Design offers that attract and convert your ideal clients</p>
        </div>
        <OfferBuilder projectId={id} />
      </div>
    </ProjectLayout>
  );
};

export default ProjectOffer;
