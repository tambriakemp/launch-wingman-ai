import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsNativeApp } from "@/hooks/useIsNativeApp";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import {
  A_HAIR,
  A_INK,
  A_INK_60,
  A_PAPER,
  A_TERRA,
  FONT_BODY_NATIVE,
} from "./tokens";

interface MobileChromeProps {
  title?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  bottomSlot?: ReactNode;
  /** Show no top nav (e.g. assessment list which has its own large title). */
  bareTop?: boolean;
  children: ReactNode;
}

const MobileChrome = ({ title, onBack, rightSlot, bottomSlot, bareTop, children }: MobileChromeProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: A_PAPER, color: A_INK, fontFamily: FONT_BODY_NATIVE }}
    >
      {!bareTop && (
        <div
          className="shrink-0"
          style={{
            paddingTop: "env(safe-area-inset-top, 12px)",
            background: "rgba(251,247,241,0.92)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderBottom: `0.5px solid ${A_HAIR}`,
          }}
        >
          <div className="flex items-center justify-between px-3 h-11">
            {onBack ? (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-0.5 px-2 py-2"
                style={{ color: A_TERRA, fontSize: 16, fontWeight: 500 }}
              >
                <ChevronLeft size={20} strokeWidth={2.4} />
                Back
              </button>
            ) : (
              <span className="w-12" />
            )}
            <span style={{ fontSize: 14, fontWeight: 600, color: A_INK_60 }}>{title}</span>
            <span className="w-12 flex justify-end">{rightSlot}</span>
          </div>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: "touch",
          paddingTop: bareTop ? "calc(env(safe-area-inset-top, 12px) + 16px)" : 8,
          paddingBottom: bottomSlot ? 120 : "calc(env(safe-area-inset-bottom, 12px) + 24px)",
        }}
      >
        {children}
      </div>

      {bottomSlot && (
        <div
          className="shrink-0"
          style={{
            background: "rgba(251,247,241,0.92)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderTop: `0.5px solid ${A_HAIR}`,
            padding: "12px 16px",
            paddingBottom: "calc(env(safe-area-inset-bottom, 12px) + 16px)",
          }}
        >
          {bottomSlot}
        </div>
      )}
    </div>
  );
};

interface AssessmentShellProps {
  /** Mobile/native chrome props */
  mobile?: Omit<MobileChromeProps, "children">;
  /** Desktop content gets wrapped inside ProjectLayout. */
  children: ReactNode;
  /** Optional desktop max-width override (CSS value). */
  desktopMaxWidth?: number;
}

export const AssessmentShell = ({ mobile, children, desktopMaxWidth = 880 }: AssessmentShellProps) => {
  const isMobile = useIsMobile();
  const isNative = useIsNativeApp();

  if (isMobile || isNative) {
    return <MobileChrome {...mobile}>{children}</MobileChrome>;
  }

  return (
    <ProjectLayout>
      <div
        style={{
          maxWidth: desktopMaxWidth,
          margin: "0 auto",
          padding: "32px 8px 96px",
          color: A_INK,
        }}
      >
        {children}
      </div>
    </ProjectLayout>
  );
};

export const useAssessmentLayout = () => {
  const isMobile = useIsMobile();
  const isNative = useIsNativeApp();
  return { isMobile: isMobile || isNative };
};
