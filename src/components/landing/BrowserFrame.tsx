import { forwardRef, ReactNode } from "react";

interface BrowserFrameProps {
  children: ReactNode;
  className?: string;
  tone?: "default" | "cream";
}

export const BrowserFrame = forwardRef<HTMLDivElement, BrowserFrameProps>(
  ({ children, className = "", tone = "default" }, ref) => {
    const isCream = tone === "cream";
    return (
      <div
        ref={ref}
        className={`rounded-2xl overflow-hidden border ${
          isCream ? "hairline float-shadow" : "shadow-2xl border-border/50"
        } ${className}`}
      >
        {/* Browser Header */}
        <div
          className={`px-4 py-3 flex items-center gap-2 border-b ${
            isCream ? "browser-chrome" : "bg-muted/80 border-border/50"
          }`}
        >
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div
              className={`rounded-md px-4 py-1 text-xs ${
                isCream
                  ? "bg-white/70 text-foreground/60"
                  : "bg-background/60 text-muted-foreground"
              }`}
            >
              app.launchely.com
            </div>
          </div>
          <div className="w-16" />
        </div>
        {/* Browser Content */}
        <div className="bg-background">
          {children}
        </div>
      </div>
    );
  }
);

BrowserFrame.displayName = "BrowserFrame";
