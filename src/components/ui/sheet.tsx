import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      // Editorial overlay: warm-ink tint + slight blur
      "fixed inset-0 z-50 bg-[hsl(var(--ink-900)/0.42)] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  // Editorial drawer base: paper background, ink-900 border on the joined edge
  "fixed z-50 flex flex-col bg-[hsl(var(--paper-100))] text-[hsl(var(--ink-900))] shadow-[-24px_0_60px_-16px_rgba(31,27,23,0.22)] transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b border-[hsl(var(--ink-900))] data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t border-[hsl(var(--ink-900))] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r border-[hsl(var(--ink-900))] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-full border-l border-[hsl(var(--ink-900))] data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = "right", className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-[8px] text-[hsl(var(--fg-muted))] opacity-80 transition-colors hover:bg-[hsl(var(--ink-900)/0.06)] hover:text-[hsl(var(--ink-900))] hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ink-900))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--paper-100))] disabled:pointer-events-none">
          <X className="h-[18px] w-[18px]" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  ),
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional editorial eyebrow label rendered above the title in mono uppercase terracotta. */
  eyebrow?: string;
  /** Optional issue number to render with the eyebrow (e.g. 7 → "№ 07"). */
  eyebrowNumber?: number;
}

const SheetHeader = ({ className, children, eyebrow, eyebrowNumber, ...props }: SheetHeaderProps) => (
  <div
    className={cn(
      "relative flex flex-col gap-2.5 border-b border-[hsl(var(--ink-900))] bg-[hsl(var(--paper-200))] px-7 pb-4 pt-7 text-left",
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
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 border-t border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-200))] px-7 py-3.5 sm:flex-row sm:items-center sm:justify-end",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn(
      "font-display text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-[hsl(var(--ink-900))]",
      className,
    )}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn(
      "font-display text-[14px] font-light italic leading-[1.5] text-[hsl(var(--fg-secondary))]",
      className,
    )}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

/**
 * Editorial body wrapper — paper background, scrollable, with consistent 28px
 * inline padding. Use inside a SheetContent to match the spec layout.
 */
const SheetBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1 overflow-y-auto bg-[hsl(var(--paper-100))] px-7 py-5", className)} {...props} />
);
SheetBody.displayName = "SheetBody";

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  SheetBody,
};
