import { cn } from "@/lib/utils";

interface EditorialPageHeaderProps {
  /** Small uppercase terracotta label printed above the title (e.g. "Goals", "WEDNESDAY · MAY 14"). */
  eyebrow: React.ReactNode;
  /**
   * The big Fraunces display title. Pass a string or JSX so an inline `<em>`
   * can carry the italic terracotta accent (e.g. `Good morning, <em>there</em>.`).
   */
  title: React.ReactNode;
  /** Optional supporting paragraph below the title (max ~520px width). */
  description?: React.ReactNode;
  /** Optional action cluster aligned to the bottom-right (buttons, pills, etc.). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Canonical page-level header. The same editorial rhythm everywhere:
 * terracotta eyebrow → Fraunces 48px title → 15px description, with an
 * optional actions cluster on the right. Sits flush above whatever page
 * chrome follows (tabs, filter strip, content). One component so the
 * type sizes, colors, and weights never drift between pages.
 *
 * Used by: Goals page, Habit Tracker, … (rolling out across pages).
 *
 * The component is presentational only — no outer width/padding —
 * so it adapts to whatever container the page uses.
 */
export function EditorialPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: EditorialPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-6 pb-7",
        className,
      )}
      style={{ borderBottom: "1px solid hsl(var(--border-hairline))" }}
    >
      <div className="min-w-0 flex-1" style={{ flexBasis: 420 }}>
        <div
          className="font-semibold uppercase"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            letterSpacing: "0.14em",
            color: "hsl(var(--terracotta-500))",
          }}
        >
          {eyebrow}
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 48,
            letterSpacing: "-0.025em",
            color: "hsl(var(--ink-900))",
            margin: "6px 0 0",
            lineHeight: 1.05,
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 15,
              lineHeight: 1.6,
              color: "hsl(var(--fg-secondary))",
              marginTop: 12,
              maxWidth: 520,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-shrink-0 items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}
