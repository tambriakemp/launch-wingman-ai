import { ProjectSidebar } from "./ProjectSidebar";
import { TopBar } from "./TopBar";
import { MobileSidebarProvider } from "@/contexts/MobileSidebarContext";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { useAuth } from "@/contexts/AuthContext";

interface ProjectLayoutProps {
  children: React.ReactNode;
}

export const ProjectLayout = ({ children }: ProjectLayoutProps) => {
  const { isImpersonating } = useAuth();

  return (
    <MobileSidebarProvider>
      <ImpersonationBanner />
      <div className={`app-cream font-sans min-h-screen flex w-full ${isImpersonating ? 'pt-10' : ''}`}>
        <ProjectSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <TopBar />
          <main
            className="flex-1 md:px-8 md:py-6 overflow-auto px-0 py-0 pt-safe-t md:pt-6"
            style={{ paddingBottom: "var(--native-tabbar-h, 0px)" }}
          >
            {children}
          </main>
        </div>
      </div>
    </MobileSidebarProvider>
  );
};
