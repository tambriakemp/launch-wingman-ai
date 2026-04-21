import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

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
      // Editorial: warm-ink tint with subtle blur
      "fixed inset-0 z-50 bg-[hsl(var(--ink-900)/0.42)] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Editorial shell: paper background, ink-900 hairline border, square corners.
        // Default body gutters are px-8 py-6; structural sub-parts (Header/Footer/Body)
        // break out to the edges with negative horizontal margins so hairlines run full-bleed.
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-0 overflow-hidden border border-[hsl(var(--ink-900))] bg-[hsl(var(--paper-100))] px-8 py-6 text-[hsl(var(--ink-900))] shadow-[0_32px_80px_-24px_rgba(31,27,23,0.35),0_8px_24px_rgba(31,27,23,0.10)] rounded-[4px] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-[6px] text-[hsl(var(--fg-muted))] opacity-80 transition-colors hover:bg-[hsl(var(--ink-900)/0.06)] hover:text-[hsl(var(--ink-900))] hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ink-900))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--paper-100))] disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional editorial eyebrow label, e.g. "AI Studio". When provided, renders
   * a mono uppercase terracotta tag above the title with the editorial № stamp.
   */
  eyebrow?: string;
  /** Optional issue number to render with the eyebrow (e.g. 3 → "№ 03"). */
  eyebrowNumber?: number;
}

const DialogHeader = ({ className, children, eyebrow, eyebrowNumber, ...props }: DialogHeaderProps) => (
  <div
    className={cn(
      // Break out of DialogContent's px-8 py-6 default to render edge-to-edge with hairline border.
      "relative -mx-8 -mt-6 mb-6 flex flex-col gap-2 border-b border-[hsl(var(--ink-900))] bg-[hsl(var(--paper-200))] px-8 pb-5 pt-8 text-left",
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
      // Break out of DialogContent's px-8 py-6 default to render edge-to-edge.
      "-mx-8 -mb-6 mt-6 flex flex-col-reverse gap-2 border-t border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-200))] px-8 py-4 sm:flex-row sm:items-center sm:justify-end",
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
      "font-display text-[26px] font-medium leading-[1.15] tracking-[-0.02em] text-[hsl(var(--ink-900))]",
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
      "font-display text-[15px] font-light italic leading-[1.5] text-[hsl(var(--fg-secondary))]",
      className,
    )}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

/**
 * Editorial body wrapper — gives consistent paper background and 32px gutters
 * matching the spec. Optional, dialogs may also render their own bare content.
 */
const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("-mx-8 -my-6 bg-[hsl(var(--paper-100))] px-8 py-6", className)} {...props} />
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
