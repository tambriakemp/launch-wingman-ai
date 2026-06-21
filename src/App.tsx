import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TikTokEnvironmentProvider } from "@/contexts/TikTokEnvironmentContext";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import ScrollToTop from "@/components/ScrollToTop";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NativeBridge } from "@/components/NativeBridge";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { initGA, trackPageView } from "@/lib/analytics";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import { Cre8BrainShellFallback } from "./components/layout/Cre8BrainShellFallback";
import { AppShellFallback } from "./components/layout/AppShellFallback";
import { usePushRegistration } from "@/hooks/usePushRegistration";
import { FEATURE_FLAGS } from "@/config/featureFlags";

function PushRegistrar() {
  usePushRegistration();
  return null;
}

const Auth = lazy(() => import("./pages/Auth"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));

const Settings = lazy(() => import("./pages/Settings"));
const Assessments = lazy(() => import("./pages/Assessments"));
const Assessment = lazy(() => import("./pages/Assessment"));
const CoachAssessment = lazy(() => import("./pages/CoachAssessment"));
const WhyStatementAssessment = lazy(() => import("./pages/WhyStatementAssessment"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminContentVault = lazy(() => import("./pages/AdminContentVault"));
const AdminDocs = lazy(() => import("./pages/AdminDocs"));
const AdminVideoInstructions = lazy(() => import("./pages/AdminVideoInstructions"));
const AdminBrandKit = lazy(() => import("./pages/AdminBrandKit"));
const AdminLinkInBio = lazy(() => import("./pages/AdminLinkInBio"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminActivityLogs = lazy(() => import("./pages/admin/AdminActivityLogs"));
const AdminMonitoring = lazy(() => import("./pages/admin/AdminMonitoring"));
const AdminConfig = lazy(() => import("./pages/admin/AdminConfig"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminAssets = lazy(() => import("./pages/admin/AdminAssets"));
const AdminLayout = lazy(() => import("./components/layout/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const UTMBuilder = lazy(() => import("./pages/UTMBuilder"));
const UTMRedirect = lazy(() => import("./pages/UTMRedirect"));
const CampaignAnalytics = lazy(() => import("./pages/CampaignAnalytics"));
const CampaignPlanner = lazy(() => import("./pages/CampaignPlanner"));
const MarketingHub = lazy(() => import("./pages/MarketingHub"));
const MeHub = lazy(() => import("./pages/MeHub"));
const CampaignDetail = lazy(() => import("./pages/CampaignDetail"));
const SocialPlanner = lazy(() => import("./pages/SocialPlanner"));

// Feature flag — set to true to re-enable the Hook Generator tool everywhere.
// Surfaced in the Marketing hub's "Create" group.
const FEATURE_HOOK_GENERATOR = true;
const HookGenerator = lazy(() => import("./pages/HookGenerator"));
const SalesPageWriter = lazy(() => import("./pages/SalesPageWriter"));
const EmailSequenceGenerator = lazy(() => import("./pages/EmailSequenceGenerator"));
const CarouselBuilder = lazy(() => import("./pages/CarouselBuilder"));
const ProjectPlan = lazy(() => import("./pages/project/ProjectPlan"));
const ProjectExecute = lazy(() => import("./pages/project/ProjectExecute"));
const OffersLibrary = lazy(() => import("./pages/project/OffersLibrary"));
const TaskDetail = lazy(() => import("./pages/project/TaskDetail"));
const OfferSnapshotTask = lazy(() => import("./pages/project/OfferSnapshotTask"));
const SocialBioTask = lazy(() => import("./pages/project/SocialBioTask"));
const SalesCopyTask = lazy(() => import("./pages/project/SalesCopyTask"));
const StartingPointTask = lazy(() => import("./pages/project/StartingPointTask"));
const VisualDirectionTask = lazy(() => import("./pages/project/VisualDirectionTask"));
const PhaseSnapshot = lazy(() => import("./pages/project/PhaseSnapshot"));
const Relaunch = lazy(() => import("./pages/project/Relaunch"));
const Playbook = lazy(() => import("./pages/project/Playbook"));
const ProjectContent = lazy(() => import("./pages/project/ProjectContent"));
const ContentVault = lazy(() => import("./pages/ContentVault"));
const ContentVaultCategory = lazy(() => import("./pages/ContentVaultCategory"));
const CheckIns = lazy(() => import("./pages/CheckIns"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const HelpSupportTicket = lazy(() => import("./pages/HelpSupportTicket"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const AIStudio = lazy(() => import("./pages/AIStudio"));
const AIStudioDashboard = lazy(() => import("./pages/AIStudioDashboard"));
const AIStudioCharacters = lazy(() => import("./pages/AIStudioCharacters"));
const AIStudioEnvironments = lazy(() => import("./pages/AIStudioEnvironments"));
const OutfitSwap = lazy(() => import("./pages/OutfitSwap"));
const Planner = lazy(() => import("./pages/Planner"));
const PlannerHub = lazy(() => import("./pages/PlannerHub"));
const HabitTracker = lazy(() => import("./pages/HabitTracker"));
const HabitReview = lazy(() => import("./pages/HabitReview"));
const HabitStats = lazy(() => import("./pages/HabitStats"));
const DailyPage = lazy(() => import("./pages/DailyPage"));
const Goals = lazy(() => import("./pages/Goals"));
const GoalDetail = lazy(() => import("./pages/GoalDetail"));
const GoalFolderDetail = lazy(() => import("./pages/GoalFolderDetail"));

const WeeklyReview = lazy(() => import("./pages/WeeklyReview"));
const LinkInBio = lazy(() => import("./pages/LinkInBio"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 10, // 10 minutes — avoids re-fetching on every navigation
      gcTime: 1000 * 60 * 15,    // keep in memory 15 minutes
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

// No global route fallback — each page renders its own loader.
// Returning null prevents a flash of a "Loading…" screen during lazy chunk loads.
const RouteFallback = () => null;

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TikTokEnvironmentProvider>
          <NativeBridge />
          <PushRegistrar />
          <PageViewTracker />
          <ScrollToTop />
          <ImpersonationBanner />
          <Suspense fallback={<RouteFallback />}>
          <MobileTabBar />
          <Routes>
            {/* Public auth + utility routes */}
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/links" element={<LinkInBio />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />

            {/* Legacy marketing redirects -> launchely.com */}
            <Route path="/how-it-works" element={<Navigate to="/auth" replace />} />
            <Route path="/privacy" element={<Navigate to="/auth" replace />} />
            <Route path="/terms" element={<Navigate to="/auth" replace />} />
            <Route path="/about" element={<Navigate to="/auth" replace />} />
            <Route path="/blog" element={<Navigate to="/auth" replace />} />
            <Route path="/blog/:slug" element={<Navigate to="/auth" replace />} />
            <Route path="/contact" element={<Navigate to="/auth" replace />} />
            <Route path="/go" element={<Navigate to="/auth" replace />} />
            <Route path="/ai-twin-formula" element={<Navigate to="/auth" replace />} />
            <Route path="/ai-twin-formula/thank-you" element={<Navigate to="/auth" replace />} />
            <Route path="/features/*" element={<Navigate to="/auth" replace />} />

            {/* Onboarding flow (shown once after registration) */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* New Cre8 Brain dashboard — replaces old per-project dashboard */}
            <Route path="/app" element={<ProtectedRoute fallback={<Cre8BrainShellFallback />}><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute fallback={<Cre8BrainShellFallback />}><Dashboard /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute fallback={<Cre8BrainShellFallback />}><Tasks /></ProtectedRoute>} />
            <Route path="/projects" element={<Navigate to="/dashboard" replace />} />

            {/* Project-specific routes - Plan section uses unified ProjectPlan */}
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectPlan />
                </ProtectedRoute>
              }
            />
            {FEATURE_FLAGS.launchBrief && (
              <Route
                path="/projects/:id/summary"
                element={
                  <ProtectedRoute>
                    <PhaseSnapshot />
                  </ProtectedRoute>
                }
              />
            )}
            <Route
              path="/projects/:id/dashboard"
              element={<Navigate to="/app" replace />}
            />
            {/* Standalone Offers library */}
            {FEATURE_FLAGS.offer && (
              <Route
                path="/projects/:id/offer"
                element={
                  <ProtectedRoute>
                    <OffersLibrary />
                  </ProtectedRoute>
                }
              />
            )}
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
            {FEATURE_FLAGS.playbook && (
              <Route
                path="/playbook"
                element={
                  <ProtectedRoute>
                    <Playbook />
                  </ProtectedRoute>
                }
              />
            )}
            <Route
              path="/projects/:id/content"
              element={
                <ProtectedRoute>
                  <ProjectContent />
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

            {/* Me hub — mobile tab destination for account, resources, and help */}
            <Route
              path="/me"
              element={
                <ProtectedRoute>
                  <MeHub />
                </ProtectedRoute>
              }
            />

            {/* Check-in journal */}
            <Route
              path="/check-ins"
              element={
                <ProtectedRoute>
                  <CheckIns />
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
            {FEATURE_FLAGS.assessments && (
              <Route
                path="/assessments"
                element={
                  <ProtectedRoute>
                    <Assessments />
                  </ProtectedRoute>
                }
              />
            )}
            {FEATURE_FLAGS.assessments && (
              <Route
                path="/assessments/launch"
                element={
                  <ProtectedRoute>
                    <Assessment />
                  </ProtectedRoute>
                }
              />
            )}
            {FEATURE_FLAGS.assessments && (
              <Route
                path="/assessments/coach"
                element={
                  <ProtectedRoute>
                    <CoachAssessment />
                  </ProtectedRoute>
                }
              />
            )}
            {FEATURE_FLAGS.assessments && (
              <Route
                path="/assessments/why-statement"
                element={
                  <ProtectedRoute>
                    <WhyStatementAssessment />
                  </ProtectedRoute>
                }
              />
            )}
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
            {/* Admin routes - all wrapped in AdminLayout */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminOverview /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminDashboard defaultTab="users" /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/users/:id"
              element={
                <ProtectedAdminRoute>
                  <AdminUserDetail />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminAnalytics /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminActivityLogs /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/monitoring"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminMonitoring /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/coupons"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminCoupons /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/support"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminSupport /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/config"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminConfig /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/content-vault"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminContentVault /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/assets"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminAssets /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/brand-kit"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminBrandKit /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/link-in-bio"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminLinkInBio /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/docs"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminDocs /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/video-instructions"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout><AdminVideoInstructions /></AdminLayout>
                </ProtectedAdminRoute>
              }
            />
            {/* Marketing hub landing — mobile tab destination, surfaces the
                full Marketing suite (campaigns, analytics, AI tools, social,
                content). Sub-pages live at their existing routes below. */}
            <Route
              path="/marketing-hub"
              element={
                <ProtectedRoute>
                  <MarketingHub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-hub/utm-builder"
              element={
                <ProtectedRoute>
                  <UTMBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-hub/analytics"
              element={
                <ProtectedAdminRoute>
                  <CampaignAnalytics />
                </ProtectedAdminRoute>
              }
            />

            {/* Campaign Planner routes (Pro+) */}
            <Route
              path="/marketing-hub/campaigns"
              element={
                <ProtectedRoute>
                  <CampaignPlanner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-hub/campaigns/:campaignId"
              element={
                <ProtectedRoute>
                  <CampaignDetail />
                </ProtectedRoute>
              }
            />

            {/* AI Studio */}
            <Route
              path="/app/ai-studio"
              element={
                <ProtectedRoute>
                  <AIStudioDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/ai-studio/create"
              element={
                <ProtectedRoute>
                  <AIStudio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/ai-studio/characters"
              element={
                <ProtectedRoute>
                  <AIStudioCharacters />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/ai-studio/environments"
              element={
                <ProtectedRoute>
                  <AIStudioEnvironments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/ai-studio/outfit-swap"
              element={
                <ProtectedRoute>
                  <OutfitSwap />
                </ProtectedRoute>
              }
            />

            {/* Planner */}
            <Route
              path="/planner-hub"
              element={
                <ProtectedRoute>
                  <PlannerHub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/planner"
              element={
                <ProtectedRoute>
                  <Planner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/planner/tasks"
              element={
                <ProtectedRoute>
                  <Planner />
                </ProtectedRoute>
              }
            />
            {FEATURE_FLAGS.socialPlanner && (
              <Route
                path="/social-planner"
                element={
                  <ProtectedRoute>
                    <SocialPlanner />
                  </ProtectedRoute>
                }
              />
            )}
            {FEATURE_HOOK_GENERATOR && (
              <Route
                path="/app/ai-studio/hooks"
                element={
                  <ProtectedRoute>
                    <HookGenerator />
                  </ProtectedRoute>
                }
              />
            )}
            {FEATURE_FLAGS.salesPageWriter && (
              <Route
                path="/app/ai-studio/sales-page"
                element={
                  <ProtectedRoute>
                    <SalesPageWriter />
                  </ProtectedRoute>
                }
              />
            )}
            {FEATURE_FLAGS.emailSequence && (
              <Route
                path="/app/ai-studio/email-sequence"
                element={
                  <ProtectedRoute>
                    <EmailSequenceGenerator />
                  </ProtectedRoute>
                }
              />
            )}
            <Route
              path="/carousel-builder"
              element={
                <ProtectedRoute>
                  <CarouselBuilder />
                </ProtectedRoute>
              }
            />

            <Route
              path="/habits"
              element={
                <ProtectedRoute>
                  <HabitTracker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/habits/stats"
              element={
                <ProtectedRoute>
                  <HabitStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/habits/review"
              element={
                <ProtectedRoute>
                  <HabitReview />
                </ProtectedRoute>
              }
            />

            {/* Daily Page */}
            <Route
              path="/daily"
              element={
                <ProtectedRoute>
                  <DailyPage />
                </ProtectedRoute>
              }
            />

            {/* Goals */}
            <Route
              path="/goals"
              element={
                <ProtectedRoute>
                  <Goals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/goals/folder/:folderId"
              element={
                <ProtectedRoute>
                  <GoalFolderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/goals/:goalId"
              element={
                <ProtectedRoute>
                  <GoalDetail />
                </ProtectedRoute>
              }
            />
            {/* Weekly Review */}
            <Route
              path="/weekly"
              element={
                <ProtectedRoute>
                  <WeeklyReview />
                </ProtectedRoute>
              }
            />

            {/* Public short link redirect */}
            <Route path="/r/:code" element={<UTMRedirect />} />
            <Route path="/r/:code" element={<UTMRedirect />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </TikTokEnvironmentProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
