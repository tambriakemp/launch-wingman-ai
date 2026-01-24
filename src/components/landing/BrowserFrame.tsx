import { forwardRef, ReactNode } from "react";

interface BrowserFrameProps {
  children: ReactNode;
  className?: string;
}

export const BrowserFrame = forwardRef<HTMLDivElement, BrowserFrameProps>(
  ({ children, className = "" }, ref) => {
    return (
      <div ref={ref} className={`rounded-xl overflow-hidden shadow-2xl border border-border/50 ${className}`}>
        {/* Browser Header */}
        <div className="bg-muted/80 px-4 py-3 flex items-center gap-2 border-b border-border/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-background/60 rounded-md px-4 py-1 text-xs text-muted-foreground">
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
