import { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppShellFallback } from "./layout/AppShellFallback";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Override the Suspense fallback while the destination route's lazy
   * chunk loads. Defaults to `AppShellFallback`, which renders the
   * legacy Launchely chrome — use a different fallback for routes that
   * don't use `ProjectLayout` (e.g. Cre8 Brain routes) to avoid a brief
   * flash of the wrong shell during navigation.
   */
  fallback?: React.ReactNode;
}

const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Suspense fallback={fallback ?? <AppShellFallback />}>{children}</Suspense>;
};

export default ProtectedRoute;
