import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AppRedirect from "./pages/AppRedirect";
import Projects from "./pages/Projects";
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
import ProjectFunnelOverview from "./pages/project/ProjectFunnelOverview";
import ProjectFunnelType from "./pages/project/ProjectFunnelType";
import ProjectAudience from "./pages/project/ProjectAudience";
import ProjectTransformation from "./pages/project/ProjectTransformation";
import ProjectOffers from "./pages/project/ProjectOffers";
import ProjectBrand from "./pages/project/ProjectBrand";
import ProjectMessaging from "./pages/project/ProjectMessaging";
import ProjectExecute from "./pages/project/ProjectExecute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            {/* Smart redirect to last used project */}
            <Route path="/app" element={<ProtectedRoute><AppRedirect /></ProtectedRoute>} />
            {/* Legacy redirect */}
            <Route path="/dashboard" element={<Navigate to="/app" replace />} />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            
            {/* Project-specific routes - Funnel Overview is the landing page */}
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectFunnelOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/offer"
              element={
                <ProtectedRoute>
                  <ProjectFunnelOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/funnel-type"
              element={
                <ProtectedRoute>
                  <ProjectFunnelType />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/audience"
              element={
                <ProtectedRoute>
                  <ProjectAudience />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/transformation"
              element={
                <ProtectedRoute>
                  <ProjectTransformation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/offers"
              element={
                <ProtectedRoute>
                  <ProjectOffers />
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
              path="/projects/:id/content"
              element={
                <ProtectedRoute>
                  <ProjectExecute />
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
