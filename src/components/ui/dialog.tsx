import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-[hsl(var(--ink-900)/0.55)] backdrop-blur-[6px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /** Force a particular layout regardless of viewport. */
    layout?: "auto" | "center" | "sheet";
  }
>(({ className, children, layout = "auto", ...props }, ref) => {
  const isMobile = useIsMobile();
  const asSheet = layout === "sheet" || (layout === "auto" && isMobile);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 grid gap-0 overflow-hidden border border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-100))] text-[hsl(var(--ink-900))] shadow-[0_24px_60px_-20px_rgba(31,27,23,0.35),0_8px_24px_rgba(31,27,23,0.08)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          asSheet
            ? // Mobile bottom sheet
              "left-0 right-0 bottom-0 w-full max-h-[92vh] rounded-t-[24px] border-x-0 border-b-0 pb-[env(safe-area-inset-bottom,0px)] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
            : // Desktop centered card
              "left-[50%] top-[50%] w-full max-w-[560px] translate-x-[-50%] translate-y-[-50%] rounded-[20px] data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {asSheet && (
          <div className="flex justify-center pt-2.5 pb-1">
            <span className="block h-[5px] w-9 rounded-full bg-[hsl(var(--ink-900)/0.18)]" />
          </div>
        )}
        <div className="overflow-y-auto p-[3px]" style={{ WebkitOverflowScrolling: "touch" }}>
          {children}
        </div>
        <DialogPrimitive.Close
          className={cn(
            "absolute z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--paper-200))] text-[hsl(var(--fg-secondary))] transition-colors hover:bg-[hsl(var(--ink-900)/0.08)] hover:text-[hsl(var(--terracotta-500))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta-500)/0.4)] disabled:pointer-events-none",
            asSheet ? "right-3 top-3" : "right-4 top-4",
          )}
        >
          <X className="h-4 w-4" strokeWidth={2.4} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Editorial eyebrow label, e.g. "Stuck Help". Renders as small terracotta mono uppercase. */
  eyebrow?: string;
  /** Optional issue number (e.g. 3 → "№ 03"). */
  eyebrowNumber?: number;
}

const DialogHeader = ({ className, children, eyebrow, eyebrowNumber, ...props }: DialogHeaderProps) => (
  <div
    className={cn(
      "relative flex flex-col gap-2 bg-[hsl(var(--paper-100))] px-6 pb-4 pt-7 text-left md:px-8 md:pt-8",
      className,
    )}
    {...props}
  >
    {eyebrow && (
      <div className="font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.2em] text-[hsl(var(--terracotta-500))]">
        {typeof eyebrowNumber === "number" ? `№ ${String(eyebrowNumber).padStart(2, "0")} · ${eyebrow}` : eyebrow}
      </div>
    )}
    {children}
  </div>
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 border-t border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-100))] px-6 py-4 pb-[max(env(safe-area-inset-bottom,0px),1rem)] sm:flex-row sm:items-center sm:justify-end md:px-8",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-display text-[22px] md:text-[26px] font-normal leading-[1.15] tracking-[-0.02em] text-[hsl(var(--ink-900))]",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "font-display text-[14.5px] md:text-[15px] font-light italic leading-[1.5] text-[hsl(var(--fg-secondary))]",
      className,
    )}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("bg-[hsl(var(--paper-100))] px-6 py-5 md:px-8 md:py-6", className)} {...props} />
);
DialogBody.displayName = "DialogBody";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
};
