import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  /** Top padding inside the container, in px. Default 0 — pass 36 for the standard page top gap. */
  paddingTop?: number;
  /** Bottom padding inside the container, in px. Default 0 — pass 96 for the standard page bottom gap. */
  paddingBottom?: number;
  className?: string;
}

/**
 * Canonical page content column. Every top-level page in the Launchely
 * app constrains its content to this width so headers, hairlines, tabs,
 * grids, and cards all line up consistently across pages.
 *
 * Width: 1240px max, centered (`mx-auto`).
 * Horizontal gutters: 40px each side (matches the Goals page reference).
 *
 * Vertical padding is opt-in via props so chrome (page header, tabs) can
 * stack flush at top/bottom while content sections breathe.
 *
 * Example:
 *   <PageContainer paddingTop={36} paddingBottom={96}>
 *     <EditorialPageHeader … />
 *     <DesktopTabs … />
 *     <Content />
 *   </PageContainer>
 */
export function PageContainer({
  children,
  paddingTop = 0,
  paddingBottom = 0,
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn("mx-auto", className)}
      style={{
        maxWidth: 1240,
        paddingTop,
        paddingBottom,
        paddingLeft: 40,
        paddingRight: 40,
      }}
    >
      {children}
    </div>
  );
}
