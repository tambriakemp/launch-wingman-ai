import { ProjectSidebar } from "./ProjectSidebar";
import { TopBar } from "./TopBar";

interface ProjectLayoutProps {
  children: React.ReactNode;
}

export const ProjectLayout = ({ children }: ProjectLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <ProjectSidebar />
      <div className="flex-1 ml-56 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 overflow-auto bg-muted/30">{children}</main>
      </div>
    </div>
  );
};
