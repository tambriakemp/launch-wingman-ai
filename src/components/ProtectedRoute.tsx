import { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppShellFallback } from "./layout/AppShellFallback";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Render the persistent app shell while the destination route's lazy
  // chunk downloads — prevents the brief blank screen between navigations.
  return <Suspense fallback={<AppShellFallback />}>{children}</Suspense>;
};

export default ProtectedRoute;
