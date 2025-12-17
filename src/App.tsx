import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import Landing from "./pages/Landing";
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

// Project-specific pages
import ProjectPlan from "./pages/project/ProjectPlan";
import ProjectBrand from "./pages/project/ProjectBrand";
import ProjectMessaging from "./pages/project/ProjectMessaging";
import ProjectExecute from "./pages/project/ProjectExecute";

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
          <ImpersonationBanner />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/auth" element={<Auth />} />
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
              path="/projects/:id/offer"
              element={
                <ProtectedRoute>
                  <ProjectPlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/funnel-type"
              element={
                <ProtectedRoute>
                  <ProjectPlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/audience"
              element={
                <ProtectedRoute>
                  <ProjectPlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/transformation"
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
            <Route
              path="/projects/:id/tech-stack"
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
              path="/projects/:id/social"
              element={
                <ProtectedRoute>
                  <ProjectExecute />
                </ProtectedRoute>
              }
            />
            {/* Legacy redirect */}
            <Route
              path="/projects/:id/content"
              element={<Navigate to={`/projects/:id/social`} replace />}
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
