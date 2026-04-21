import { ProjectLayout } from "./ProjectLayout";
import { PageLoader } from "@/components/ui/page-loader";

/**
 * Suspense fallback for protected/app routes.
 *
 * Renders the persistent app shell (sidebar + topbar via ProjectLayout) with
 * a centered dashboard-style loader in the content area while the lazy
 * route chunk downloads. This prevents the brief "blank/grey" flash that
 * happens when a fallback returns null.
 */
export const AppShellFallback = () => (
  <ProjectLayout>
    <PageLoader containerClassName="flex items-center justify-center min-h-[60vh]" />
  </ProjectLayout>
);

export default AppShellFallback;
