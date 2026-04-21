import { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { AppShellFallback } from "./layout/AppShellFallback";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAdminAccess, loading: adminLoading } = useAdmin();

  if (authLoading || adminLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasAdminAccess) {
    return <Navigate to="/app" replace />;
  }

  // Render the persistent app shell while the destination route's lazy
  // chunk downloads — prevents the brief blank screen between navigations.
  return <Suspense fallback={<AppShellFallback />}>{children}</Suspense>;
};

export default ProtectedAdminRoute;
