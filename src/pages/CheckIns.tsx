import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useCheckIn, OrientationChoice } from "@/hooks/useCheckIn";
import { Button } from "@/components/ui/button";
import { MessageSquare, Compass, RotateCcw, RefreshCw, Sparkles, HelpCircle, BookOpen } from "lucide-react";

const ORIENTATION_LABELS: Record<OrientationChoice, { label: string; icon: typeof Compass }> = {
  continue_current: { label: "Continuing", icon: Compass },
  revisit_past: { label: "Revisiting", icon: RotateCcw },
  plan_relaunch: { label: "Relaunching", icon: RefreshCw },
  start_new: { label: "Starting new", icon: Sparkles },
  not_sure: { label: "Sitting with it", icon: HelpCircle },
};

const CheckIns = () => {
  const { checkIns, isLoading } = useCheckIn();

  return (
    <ProjectLayout>
      <div className="max-w-2xl mx-auto px-4 md:px-0 py-6 md:py-0 space-y-8">
        <div>
          <p className="eyebrow">Reflections</p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground mt-2 tracking-tight">
            Check-In Journal
          </h1>
          <p className="text-muted-foreground mt-2">
            Past check-ins, in your own words.
          </p>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : checkIns.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {checkIns.map((c) => {
              const choice = c.orientation_choice as OrientationChoice | null;
              const orientation = choice ? ORIENTATION_LABELS[choice] : null;
              const OrientIcon = orientation?.icon;

              return (
                <article
                  key={c.id}
                  className="card-soft p-5 md:p-6 space-y-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <time
                      className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--terracotta-500))]"
                      dateTime={c.created_at}
                    >
                      {format(parseISO(c.created_at), "EEEE · MMM d, yyyy")}
                    </time>
                    {orientation && OrientIcon && (
                      <span
                        className="inline-flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: "rgba(198,90,62,0.10)",
                          color: "hsl(var(--terracotta-700))",
                        }}
                      >
                        <OrientIcon size={12} strokeWidth={2.4} />
                        {orientation.label}
                      </span>
                    )}
                  </div>

                  {c.reflection_prompt && (
                    <p className="font-serif italic text-[17px] leading-snug text-foreground tracking-tight">
                      {c.reflection_prompt}
                    </p>
                  )}

                  {c.reflection_response ? (
                    <p className="text-[15px] leading-relaxed text-[hsl(var(--ink-700))] whitespace-pre-wrap">
                      {c.reflection_response}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No reflection written this time.
                    </p>
                  )}
                </article>
              );
            })}

            {checkIns.length >= 10 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                Showing your most recent 10 check-ins.
              </p>
            )}
          </div>
        )}
      </div>
    </ProjectLayout>
  );
};

const EmptyState = () => (
  <div className="card-soft p-8 text-center space-y-4">
    <div
      className="mx-auto inline-flex items-center justify-center rounded-2xl"
      style={{
        width: 56,
        height: 56,
        background: "rgba(198,90,62,0.10)",
      }}
    >
      <BookOpen size={24} color="hsl(var(--terracotta-500))" strokeWidth={1.8} />
    </div>
    <div className="space-y-2">
      <h2 className="font-serif text-xl text-foreground tracking-tight">
        Nothing here yet
      </h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        When you do your first check-in from the dashboard, your reflections will live here.
      </p>
    </div>
    <Button asChild className="mt-2">
      <Link to="/app">
        <MessageSquare className="w-4 h-4 mr-1.5" />
        Go to Dashboard
      </Link>
    </Button>
  </div>
);

export default CheckIns;
