import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams } from "react-router-dom";
import { FunnelBuilder } from "@/components/FunnelBuilder";

const ProjectOffer = () => {
  const { id } = useParams();

  if (!id) return null;

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funnel Builder</h1>
          <p className="text-muted-foreground">Design your funnel with offers and track all required assets</p>
        </div>
        <FunnelBuilder projectId={id} />
      </div>
    </ProjectLayout>
  );
};

export default ProjectOffer;
