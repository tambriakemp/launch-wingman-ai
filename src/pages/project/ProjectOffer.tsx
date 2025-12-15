import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OfferBuilder } from "@/components/OfferBuilder";

const ProjectOffer = () => {
  const { id } = useParams();

  if (!id) return null;

  return (
    <ProjectLayout>
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Offer Builder</CardTitle>
          <CardDescription>Design offers that attract and convert your ideal clients</CardDescription>
        </CardHeader>
        <CardContent>
          <OfferBuilder projectId={id} />
        </CardContent>
      </Card>
    </ProjectLayout>
  );
};

export default ProjectOffer;
