import { ProjectSidebar } from "./ProjectSidebar";
import { TopBar } from "./TopBar";
import { MobileSidebarProvider } from "@/contexts/MobileSidebarContext";

interface ProjectLayoutProps {
  children: React.ReactNode;
}

export const ProjectLayout = ({ children }: ProjectLayoutProps) => {
  return (
    <MobileSidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <ProjectSidebar />
        <div className="flex-1 md:ml-56 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-4 md:p-6 overflow-auto bg-muted/30">{children}</main>
        </div>
      </div>
    </MobileSidebarProvider>
  );
};
