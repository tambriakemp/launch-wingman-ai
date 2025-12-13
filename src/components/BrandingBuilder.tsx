import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Palette, Type, Camera } from "lucide-react";
import LogosSection from "./branding/LogosSection";
import ColorsSection from "./branding/ColorsSection";
import FontsSection from "./branding/FontsSection";
import PhotosSection from "./branding/PhotosSection";

interface BrandingBuilderProps {
  projectId: string;
}

const BrandingBuilder = ({ projectId }: BrandingBuilderProps) => {
  const [activeTab, setActiveTab] = useState("logos");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="logos" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Logos
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="fonts" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Fonts
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Photos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logos">
          <LogosSection projectId={projectId} />
        </TabsContent>

        <TabsContent value="colors">
          <ColorsSection projectId={projectId} />
        </TabsContent>

        <TabsContent value="fonts">
          <FontsSection projectId={projectId} />
        </TabsContent>

        <TabsContent value="photos">
          <PhotosSection projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrandingBuilder;
