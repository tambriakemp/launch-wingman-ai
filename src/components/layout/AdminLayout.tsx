import { AdminSidebar } from "./AdminSidebar";
import { TopBar } from "./TopBar";
import { MobileSidebarProvider } from "@/contexts/MobileSidebarContext";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { useAuth } from "@/contexts/AuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { isImpersonating } = useAuth();

  return (
    <MobileSidebarProvider>
      <ImpersonationBanner />
      <div className={`app-cream font-sans min-h-screen flex w-full ${isImpersonating ? 'pt-10' : ''}`}>
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 px-2.5 py-4 md:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </MobileSidebarProvider>
  );
};
