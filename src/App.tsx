import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TikTokEnvironmentProvider } from "@/contexts/TikTokEnvironmentContext";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import ScrollToTop from "@/components/ScrollToTop";
import { initGA, trackPageView } from "@/lib/analytics";
import Landing from "./pages/Landing";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import AppRedirect from "./pages/AppRedirect";
import Settings from "./pages/Settings";
import Assessments from "./pages/Assessments";
import Assessment from "./pages/Assessment";
import CoachAssessment from "./pages/CoachAssessment";
import WhyStatementAssessment from "./pages/WhyStatementAssessment";
import AdminDashboard from "./pages/AdminDashboard";
import AdminContentVault from "./pages/AdminContentVault";
import AdminDocs from "./pages/AdminDocs";
import AdminVideoInstructions from "./pages/AdminVideoInstructions";
import AdminBrandKit from "./pages/AdminBrandKit";
import NotFound from "./pages/NotFound";
import SalesFunnel from "./pages/SalesFunnel";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

// Feature pages
import AssessmentsFeature from "./pages/features/AssessmentsFeature";
import PlanFeature from "./pages/features/PlanFeature";
import BrandingFeature from "./pages/features/BrandingFeature";
import MessagingFeature from "./pages/features/MessagingFeature";
import ExecuteFeature from "./pages/features/ExecuteFeature";
import ContentVaultFeature from "./pages/features/ContentVaultFeature";
import InsightsFeature from "./pages/features/InsightsFeature";
import RelaunchFeature from "./pages/features/RelaunchFeature";

// Additional public pages
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import TermsOfService from "./pages/TermsOfService";

// Project-specific pages
import ProjectPlan from "./pages/project/ProjectPlan";


import ProjectExecute from "./pages/project/ProjectExecute";
import TaskDetail from "./pages/project/TaskDetail";
import OfferSnapshotTask from "./pages/project/OfferSnapshotTask";
import SocialBioTask from "./pages/project/SocialBioTask";
import SalesCopyTask from "./pages/project/SalesCopyTask";
import StartingPointTask from "./pages/project/StartingPointTask";
import VisualDirectionTask from "./pages/project/VisualDirectionTask";
import PhaseSnapshot from "./pages/project/PhaseSnapshot";
import Library from "./pages/project/Library";
import Relaunch from "./pages/project/Relaunch";
import Playbook from "./pages/project/Playbook";
import ProjectContent from "./pages/project/ProjectContent";
import Insights from "./pages/project/Insights";
import ContentVault from "./pages/ContentVault";
import ContentVaultCategory from "./pages/ContentVaultCategory";
import HelpSupport from "./pages/HelpSupport";
import HelpSupportTicket from "./pages/HelpSupportTicket";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

// Initialize GA on app load
initGA();

// Component to track page views on route changes
const PageViewTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TikTokEnvironmentProvider>
          <PageViewTracker />
          <ScrollToTop />
          <ImpersonationBanner />
          <Routes>
            {/* Public marketing pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/go" element={<SalesFunnel />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            
            {/* Onboarding flow (shown once after registration) */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            
            {/* Feature pages */}
            <Route path="/features/assessments" element={<AssessmentsFeature />} />
            <Route path="/features/plan" element={<PlanFeature />} />
            <Route path="/features/branding" element={<BrandingFeature />} />
            <Route path="/features/messaging" element={<MessagingFeature />} />
            <Route path="/features/execute" element={<ExecuteFeature />} />
            <Route path="/features/content-vault" element={<ContentVaultFeature />} />
            <Route path="/features/insights" element={<InsightsFeature />} />
            <Route path="/features/relaunch" element={<RelaunchFeature />} />
            
            {/* Smart redirect to last used project */}
            <Route path="/app" element={<ProtectedRoute><AppRedirect /></ProtectedRoute>} />
            {/* Legacy redirects */}
            <Route path="/dashboard" element={<Navigate to="/app" replace />} />
            <Route path="/projects" element={<Navigate to="/app" replace />} />
            
            {/* Project-specific routes - Plan section uses unified ProjectPlan */}
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectPlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/summary"
              element={
                <ProtectedRoute>
                  <PhaseSnapshot />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/dashboard"
              element={
                <ProtectedRoute>
                  <ProjectPlan />
                </ProtectedRoute>
              }
            />
            {/* Legacy redirect from /offer to /dashboard */}
            <Route
              path="/projects/:id/offer"
              element={<Navigate to="../dashboard" replace />}
            />
            {/* Execute routes */}
            <Route
              path="/projects/:id/tasks"
              element={
                <ProtectedRoute>
                  <ProjectExecute />
                </ProtectedRoute>
              }
            />
            {/* Legacy redirect from /board to /tasks */}
            <Route
              path="/projects/:id/board"
              element={<Navigate to="../tasks" replace />}
            />
            <Route
              path="/projects/:id/tasks/planning_offer_stack"
              element={
                <ProtectedRoute>
                  <OfferSnapshotTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/tasks/messaging_social_bio"
              element={
                <ProtectedRoute>
                  <SocialBioTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/tasks/launch_capture_starting_point"
              element={
                <ProtectedRoute>
                  <StartingPointTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/tasks/messaging_visual_direction"
              element={
                <ProtectedRoute>
                  <VisualDirectionTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/tasks/messaging_sales_copy"
              element={
                <ProtectedRoute>
                  <SalesCopyTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/tasks/:taskId"
              element={
                <ProtectedRoute>
                  <TaskDetail />
                </ProtectedRoute>
              }
            />
            {/* Library route */}
            <Route
              path="/projects/:id/library"
              element={
                <ProtectedRoute>
                  <Library />
                </ProtectedRoute>
              }
            />
            {/* Relaunch route */}
            <Route
              path="/projects/:id/relaunch"
              element={
                <ProtectedRoute>
                  <Relaunch />
                </ProtectedRoute>
              }
            />
            {/* Playbook route */}
            <Route
              path="/playbook"
              element={
                <ProtectedRoute>
                  <Playbook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/content"
              element={
                <ProtectedRoute>
                  <ProjectContent />
                </ProtectedRoute>
              }
            />
            {/* Insights route */}
            <Route
              path="/projects/:id/insights"
              element={
                <ProtectedRoute>
                  <Insights />
                </ProtectedRoute>
              }
            />
            {/* Content Vault routes */}
            <Route
              path="/content-vault"
              element={
                <ProtectedRoute>
                  <ContentVault />
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-vault/:categorySlug"
              element={
                <ProtectedRoute>
                  <ContentVaultCategory />
                </ProtectedRoute>
              }
            />

            {/* Help & Support routes */}
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <HelpSupport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/help/ticket/:id"
              element={
                <ProtectedRoute>
                  <HelpSupportTicket />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments"
              element={
                <ProtectedRoute>
                  <Assessments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments/launch"
              element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments/coach"
              element={
                <ProtectedRoute>
                  <CoachAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments/why-statement"
              element={
                <ProtectedRoute>
                  <WhyStatementAssessment />
                </ProtectedRoute>
              }
            />
            {/* Legacy routes redirect */}
            <Route
              path="/assessment"
              element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach-assessment"
              element={
                <ProtectedRoute>
                  <CoachAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/content-vault"
              element={
                <ProtectedAdminRoute>
                  <AdminContentVault />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/docs"
              element={
                <ProtectedAdminRoute>
                  <AdminDocs />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/video-instructions"
              element={
                <ProtectedAdminRoute>
                  <AdminVideoInstructions />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/brand-kit"
              element={
                <ProtectedAdminRoute>
                  <AdminBrandKit />
                </ProtectedAdminRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </TikTokEnvironmentProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
