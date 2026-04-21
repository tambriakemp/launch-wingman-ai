import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  className?: string;
  /** Override container height. Defaults to h-64 to match the dashboard pattern. */
  containerClassName?: string;
}

/**
 * Standard page loader. Matches the dashboard (FunnelOverviewContent) loading style:
 * a centered terracotta spinner inside a content area — never a full-screen takeover.
 *
 * Usage: render this *below* the page header so the page chrome stays visible
 * during data loading, mirroring the dashboard.
 */
export const PageLoader = ({ className, containerClassName }: PageLoaderProps) => (
  <div
    className={cn(
      "flex items-center justify-center h-64",
      containerClassName,
    )}
  >
    <Loader2
      className={cn("w-8 h-8 animate-spin text-[hsl(var(--terracotta))]", className)}
    />
  </div>
);

export default PageLoader;
