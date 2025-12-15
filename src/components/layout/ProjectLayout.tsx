import { ProjectSidebar } from "./ProjectSidebar";
import { TopBar } from "./TopBar";

interface ProjectLayoutProps {
  children: React.ReactNode;
}

export const ProjectLayout = ({ children }: ProjectLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <ProjectSidebar />
      <div className="ml-56">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};
