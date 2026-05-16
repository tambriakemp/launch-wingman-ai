import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, X } from "lucide-react";
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
          "inset-y-0 right-0 h-full w-full md:w-[560px] md:max-w-[560px] border-l border-[hsl(var(--ink-900))] data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
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

/* ============================================================
   Editorial sheet primitives — shared building blocks every
   right-side panel in the web app should compose from. Imported
   from the same module so consumers grab everything in one go.
   ============================================================ */

interface SheetSectionHeadProps {
  /** Two-digit ordinal printed before the label, e.g. "01" → "§ 01". */
  n: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Section divider — mono "§ NN" terracotta marker + Fraunces italic label,
 * with a top hairline. The Launchely-native way to separate panel sections.
 */
const SheetSectionHead = ({ n, children, className }: SheetSectionHeadProps) => (
  <div
    className={cn(
      "flex items-baseline gap-3 border-t border-[hsl(var(--border-hairline))] pt-4 mt-5 mb-2.5",
      className,
    )}
  >
    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(var(--terracotta-500))] whitespace-nowrap">
      § {n}
    </span>
    <span className="font-display italic text-[16px] font-medium tracking-[-0.01em] text-[hsl(var(--ink-900))]">
      {children}
    </span>
  </div>
);
SheetSectionHead.displayName = "SheetSectionHead";

interface SheetTokenCellProps {
  /** Icon name (rendered as lucide-react), e.g. <Flag /> */
  icon?: React.ReactNode;
  /** Color dot instead of an icon (e.g. status / category dot color). */
  dot?: string;
  /** Small label on the left (e.g. "Status"). */
  label: string;
  /** Selected value text on the right (or undefined → placeholder). */
  value?: string | null;
  /** Placeholder shown when value is empty. */
  placeholder?: string;
  /** Override the value text color (e.g. priority hue). */
  accent?: string;
  onClick?: () => void;
  className?: string;
  /** Optional render override for the value slot (e.g. when wrapping in a popover trigger). */
  children?: React.ReactNode;
}

/**
 * Selector cell — the canonical "attribute" tile used in editorial panels.
 * Renders as a button with: dot/icon · label · value · chevron. Hover lifts
 * the border to ink-400. Wrap multiple in a 2-col grid for the attributes row.
 */
const SheetTokenCell = React.forwardRef<HTMLButtonElement, SheetTokenCellProps>(
  ({ icon, dot, label, value, placeholder, accent, onClick, className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg border border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-50))] px-3 py-2.5 text-left transition-colors hover:border-[hsl(var(--ink-400))]",
        className,
      )}
      {...props}
    >
      <span className="inline-flex shrink-0 items-center text-[hsl(var(--fg-muted))]">
        {dot ? (
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: dot }} />
        ) : (
          icon
        )}
      </span>
      <span className="shrink-0 font-body text-[12.5px] font-semibold text-[hsl(var(--ink-700))]">
        {label}
      </span>
      <span
        className={cn(
          "flex-1 truncate font-body text-[13px] tracking-[-0.005em]",
          value ? "font-medium" : "font-normal",
        )}
        style={{ color: value ? accent || "hsl(var(--ink-900))" : "hsl(var(--fg-muted))" }}
      >
        {children ?? value ?? placeholder ?? "Select…"}
      </span>
      <span className="shrink-0 text-[hsl(var(--fg-muted))]">
        <ChevronDown className="h-3.5 w-3.5" />
      </span>
    </button>
  ),
);
SheetTokenCell.displayName = "SheetTokenCell";

/**
 * Large Fraunces italic title input — the panel's "lead" field. Borderless
 * except a bottom hairline; matches the editorial drawer reference.
 */
const SheetTitleInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full border-0 border-b border-[hsl(var(--border-hairline))] bg-transparent px-0 pb-3 pt-1.5 font-display italic tracking-[-0.015em] text-[hsl(var(--ink-900))] placeholder:text-[hsl(var(--fg-muted))] focus:outline-none focus:border-[hsl(var(--ink-900))]",
      "text-[24px] font-normal",
      className,
    )}
    {...props}
  />
));
SheetTitleInput.displayName = "SheetTitleInput";

/** Small mono keyboard hint, e.g. ⌘↵. Used in the footer left-rail. */
const SheetKbd = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <kbd
    className={cn(
      "rounded border border-[hsl(var(--border-hairline))] bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[hsl(var(--ink-800))]",
      className,
    )}
  >
    {children}
  </kbd>
);
SheetKbd.displayName = "SheetKbd";

/**
 * Soft terracotta-tinted advisory block — for AI suggestions, gentle nudges,
 * and "one thought" follow-ups inside a panel body.
 */
const SheetFootnote = ({
  className,
  children,
  icon,
}: {
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) => (
  <div
    className={cn(
      "mt-4 flex items-start gap-2.5 rounded-[10px] border border-[hsl(var(--terracotta-500)/0.18)] bg-[hsl(var(--terracotta-500)/0.05)] px-3 py-2.5 font-body text-[12.5px] leading-[1.45] text-[hsl(var(--terracotta-700))]",
      className,
    )}
  >
    {icon && <span className="mt-0.5 text-[hsl(var(--terracotta-500))]">{icon}</span>}
    <div className="flex-1">{children}</div>
  </div>
);
SheetFootnote.displayName = "SheetFootnote";

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
  SheetSectionHead,
  SheetTokenCell,
  SheetTitleInput,
  SheetKbd,
  SheetFootnote,
};
