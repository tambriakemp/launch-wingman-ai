import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import ScrollToTop from "@/components/ScrollToTop";
import Landing from "./pages/Landing";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Auth from "./pages/Auth";
import AppRedirect from "./pages/AppRedirect";
import Settings from "./pages/Settings";
import Assessments from "./pages/Assessments";
import Assessment from "./pages/Assessment";
import CoachAssessment from "./pages/CoachAssessment";
import WhyStatementAssessment from "./pages/WhyStatementAssessment";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

// Feature pages
import AssessmentsFeature from "./pages/features/AssessmentsFeature";
import PlanFeature from "./pages/features/PlanFeature";
import BrandingFeature from "./pages/features/BrandingFeature";
import MessagingFeature from "./pages/features/MessagingFeature";
import ExecuteFeature from "./pages/features/ExecuteFeature";

// Additional public pages
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import TermsOfService from "./pages/TermsOfService";

// Project-specific pages
import ProjectPlan from "./pages/project/ProjectPlan";
import ProjectBrand from "./pages/project/ProjectBrand";
import ProjectMessaging from "./pages/project/ProjectMessaging";
import ProjectExecute from "./pages/project/ProjectExecute";
import TaskDetail from "./pages/project/TaskDetail";
import ProjectSummary from "./pages/project/ProjectSummary";
import Library from "./pages/project/Library";
import Relaunch from "./pages/project/Relaunch";
import Playbook from "./pages/project/Playbook";
import ProjectContent from "./pages/project/ProjectContent";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            
            {/* Feature pages */}
            <Route path="/features/assessments" element={<AssessmentsFeature />} />
            <Route path="/features/plan" element={<PlanFeature />} />
            <Route path="/features/branding" element={<BrandingFeature />} />
            <Route path="/features/messaging" element={<MessagingFeature />} />
            <Route path="/features/execute" element={<ExecuteFeature />} />
            
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
                  <ProjectSummary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/offer"
              element={
                <ProtectedRoute>
                  <ProjectPlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/offers"
              element={
                <ProtectedRoute>
                  <ProjectPlan />
                </ProtectedRoute>
              }
            />
            {/* Brand routes */}
            <Route
              path="/projects/:id/logos"
              element={
                <ProtectedRoute>
                  <ProjectBrand />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/colors"
              element={
                <ProtectedRoute>
                  <ProjectBrand />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/fonts"
              element={
                <ProtectedRoute>
                  <ProjectBrand />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/photos"
              element={
                <ProtectedRoute>
                  <ProjectBrand />
                </ProtectedRoute>
              }
            />
            {/* Messaging routes */}
            <Route
              path="/projects/:id/sales-copy"
              element={
                <ProtectedRoute>
                  <ProjectMessaging />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/social-bio"
              element={
                <ProtectedRoute>
                  <ProjectMessaging />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/emails"
              element={
                <ProtectedRoute>
                  <ProjectMessaging />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/deliverables"
              element={
                <ProtectedRoute>
                  <ProjectMessaging />
                </ProtectedRoute>
              }
            />
            {/* Execute routes */}
            <Route
              path="/projects/:id/board"
              element={
                <ProtectedRoute>
                  <ProjectExecute />
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
            <Route
              path="/projects/:id/social"
              element={
                <ProtectedRoute>
                  <ProjectExecute />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
