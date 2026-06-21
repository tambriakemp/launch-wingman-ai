/**
 * Suspense fallback for Cre8 Brain routes (Dashboard, Tasks, My Brain, etc.).
 *
 * Renders a blank paper-canvas matching the new dashboard's `PAPER` token
 * (#F9F8F6) — no legacy Launchely chrome. This prevents the brief flash of
 * the old TopBar + ProjectSidebar that the default `AppShellFallback` causes
 * for routes that don't use `ProjectLayout`.
 *
 * Use via `ProtectedRoute`'s `fallback` prop:
 *
 *   <Route
 *     path="/tasks"
 *     element={<ProtectedRoute fallback={<Cre8BrainShellFallback />}><Tasks /></ProtectedRoute>}
 *   />
 */
export const Cre8BrainShellFallback = () => (
  <div style={{ minHeight: "100vh", background: "#F9F8F6" }} />
);

export default Cre8BrainShellFallback;
