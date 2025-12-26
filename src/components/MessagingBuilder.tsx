import { useState } from "react";
import { FileText, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesPageCopyBuilder } from "./SalesPageCopyBuilder";
import { SocialBioBuilder } from "./SocialBioBuilder";

interface MessagingBuilderProps {
  projectId: string;
}

export const MessagingBuilder = ({ projectId }: MessagingBuilderProps) => {
  const [activeTab, setActiveTab] = useState("sales-page");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-auto p-1">
          <TabsTrigger 
            value="sales-page" 
            className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Sales Page</span>
          </TabsTrigger>
          <TabsTrigger 
            value="social-bio" 
            className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Social Bio</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales-page" className="mt-6">
          <SalesPageCopyBuilder projectId={projectId} />
        </TabsContent>

        <TabsContent value="social-bio" className="mt-6">
          <SocialBioBuilder projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
