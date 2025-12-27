import LogosSection from "./branding/LogosSection";

interface BrandingBuilderProps {
  projectId: string;
}

const BrandingBuilder = ({ projectId }: BrandingBuilderProps) => {
  return (
    <div className="space-y-6">
      <LogosSection projectId={projectId} />
    </div>
  );
};

export default BrandingBuilder;
