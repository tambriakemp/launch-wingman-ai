import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isToday,
  isSameDay,
  parseISO,
} from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useHaptics } from "@/hooks/useHaptics";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import {
  PreviewCalendar,
  PreviewDailyPage,
  PreviewHabits,
  PreviewGoals,
  PreviewReview,
} from "@/components/planner/PlannerHubPreviews";
import { SF, SERIF, COLORS, TILE_BG } from "@/components/marketing/marketingHubTokens";

const PlannerHub = () => {
  const { user } = useAuth();
  const uid = user?.id;
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Week events
  const { data: weekEvents = [] } = useQuery({
    queryKey: ["hub-week-events", uid],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, start_at, end_at, category")
        .eq("user_id", uid!)
        .eq("task_scope", "planner")
        .not("start_at", "is", null)
        .gte("start_at", weekStart.toISOString())
        .lte("start_at", weekEnd.toISOString())
        .limit(20);
      return (data || []) as Array<{ id: string; start_at: string }>;
    },
    enabled: !!uid,
  });

  // Daily page
  const { data: dailyPage } = useQuery({
    queryKey: ["hub-daily-page", uid, todayStr],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_pages" as any)
        .select(
          "intention, priority_1, priority_1_done, priority_2, priority_2_done, priority_3, priority_3_done"
        )
        .eq("user_id", uid!)
        .eq("page_date", todayStr)
        .maybeSingle();
      return data as {
        intention?: string;
        priority_1?: string;
        priority_1_done?: boolean;
        priority_2?: string;
        priority_2_done?: boolean;
        priority_3?: string;
        priority_3_done?: boolean;
      } | null;
    },
    enabled: !!uid,
  });

  // Habits + today's completions
  const { data: habits = [] } = useQuery({
    queryKey: ["hub-habits", uid],
    queryFn: async () => {
      const { data } = await supabase
        .from("habits" as any)
        .select("id")
        .eq("user_id", uid!)
        .eq("is_archived", false);
      return ((data || []) as unknown) as Array<{ id: string }>;
    },
    enabled: !!uid,
  });
  const { data: todayCompletions = [] } = useQuery({
    queryKey: ["hub-habit-completions", uid, todayStr],
    queryFn: async () => {
      const { data } = await supabase
        .from("habit_completions" as any)
        .select("habit_id")
        .eq("user_id", uid!)
        .eq("completed_date", todayStr);
      return ((data || []) as unknown) as Array<{ habit_id: string }>;
    },
    enabled: !!uid,
  });

  // Goals
  const { data: goals = [] } = useQuery({
    queryKey: ["hub-goals", uid],
    queryFn: async () => {
      const { data } = await supabase
        .from("goals" as any)
        .select("id, target_date")
        .eq("user_id", uid!)
        .eq("status", "active")
        .order("target_date", { ascending: true });
      return ((data || []) as unknown) as Array<{ id: string; target_date: string | null }>;
    },
    enabled: !!uid,
  });

  // Derived
  const completedIds = new Set(todayCompletions.map((c) => c.habit_id));
  const habitsDone = habits.filter((h) => completedIds.has(h.id)).length;
  const habitsTotal = habits.length;

  const priorities = dailyPage
    ? [dailyPage.priority_1, dailyPage.priority_2, dailyPage.priority_3].filter(Boolean) as string[]
    : [];
  const prioritiesWithDone = dailyPage
    ? [
        { text: dailyPage.priority_1, done: dailyPage.priority_1_done },
        { text: dailyPage.priority_2, done: dailyPage.priority_2_done },
        { text: dailyPage.priority_3, done: dailyPage.priority_3_done },
      ].filter((p) => p.text)
    : [];

  // Calendar preview data — current week with real event counts
  const calendarDays = weekDays.map((d) => {
    const eventCount = weekEvents.filter((e) => isSameDay(parseISO(e.start_at), d)).length;
    return {
      letter: format(d, "EEEEE"),
      num: parseInt(format(d, "d"), 10),
      isToday: isToday(d),
      eventCount,
    };
  });

  // Goals status string
  const nearestGoalDate = goals.length > 0 && goals[0].target_date
    ? format(parseISO(goals[0].target_date), "MMM d")
    : null;
  const goalsStatus = goals.length === 0
    ? "No active goals"
    : goals.length === 1
    ? `1 goal · by ${nearestGoalDate}`
    : `${goals.length} goals · nearest ${nearestGoalDate}`;

  const habitsStatus = habitsTotal === 0
    ? "No habits set up yet"
    : habitsDone === habitsTotal && habitsTotal > 0
    ? `All ${habitsTotal} done — well done`
    : `${habitsDone} of ${habitsTotal} done — easing in`;

  const dailyStatus = dailyPage?.intention
    ? `Intention set · ${prioritiesWithDone.filter((p) => p.done).length} of ${prioritiesWithDone.length} priorities`
    : `Set today's intention →`;

  const eventsStatus = weekEvents.length === 0
    ? "Clear week ahead"
    : weekEvents.length === 1
    ? "1 event this week"
    : `${weekEvents.length} events this week`;

  return (
    <ProjectLayout>
      <div className="max-w-2xl mx-auto pb-12">
        <MobileTopBar />

        {/* Title block */}
        <header style={{ padding: "4px 22px 18px" }}>
          <div className="eyebrow">Planner</div>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: 32,
              color: COLORS.ink,
              letterSpacing: -0.6,
              lineHeight: 1.05,
              marginTop: 8,
            }}
          >
            Your <em style={{ color: COLORS.terracotta, fontWeight: 400 }}>week</em>, on paper.
          </h1>
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 15,
              color: COLORS.inkMid,
              marginTop: 8,
              lineHeight: 1.4,
              maxWidth: 320,
            }}
          >
            Calendar, daily page, habits, goals — quietly in their place.
          </p>
        </header>

        {/* Today hero */}
        <TodayHero
          dateLabel={format(now, "EEEE, MMM d")}
          intention={dailyPage?.intention || null}
          priorityCount={prioritiesWithDone.length}
          habitsLabel={habitsTotal > 0 ? `${habitsDone}/${habitsTotal}` : "—"}
          eventCount={weekEvents.length}
          goalsOpen={goals.length}
        />

        {/* THIS WEEK */}
        <SectionHeader
          label="This week"
          hint={`${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            padding: "0 16px 24px",
          }}
        >
          <TileWrap fullWidth>
            <Tile
              name="Calendar"
              status={eventsStatus}
              bg={TILE_BG.oat}
              previewAlign="flex-start"
              wide
              href="/planner"
            >
              <PreviewCalendar days={calendarDays} />
            </Tile>
          </TileWrap>
          <Tile
            name="Daily Page"
            status={dailyStatus}
            bg={TILE_BG.blush}
            href="/daily"
          >
            <PreviewDailyPage dateLabel={format(now, "MMM d")} />
          </Tile>
          <Tile
            name="Habits"
            status={habitsStatus}
            bg={TILE_BG.cream}
            href="/habits"
          >
            <PreviewHabits done={habitsDone} total={habitsTotal || 6} />
          </Tile>
        </div>

        {/* LONG ARC */}
        <SectionHeader label="Long arc" hint="Where you're heading" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            padding: "0 16px 24px",
          }}
        >
          <Tile
            name="Goals"
            status={goalsStatus}
            bg={TILE_BG.oat}
            href="/goals"
          >
            <PreviewGoals />
          </Tile>
          <Tile
            name="Weekly Review"
            status="Sunday's reflection waits"
            bg={TILE_BG.blush}
            href="/weekly"
          >
            <PreviewReview />
          </Tile>
        </div>

        {/* QUIET PROMISES — today's priorities if set, otherwise a soft empty state */}
        <SectionHeader label="Quiet promises" hint="The notes you'd leave yourself" />
        <QuietPromises priorities={prioritiesWithDone} />

        {/* Editorial closer */}
        <Closer />
      </div>
    </ProjectLayout>
  );
};

// ─────────────────────────────────────────────────────────────
// TODAY HERO — date eyebrow, intention, glance row, CTAs
// ─────────────────────────────────────────────────────────────
const TodayHero = ({
  dateLabel,
  intention,
  priorityCount,
  habitsLabel,
  eventCount,
  goalsOpen,
}: {
  dateLabel: string;
  intention: string | null;
  priorityCount: number;
  habitsLabel: string;
  eventCount: number;
  goalsOpen: number;
}) => (
  <div
    style={{
      margin: "0 16px 24px",
      borderRadius: 22,
      overflow: "hidden",
      background: COLORS.ink,
      color: COLORS.paper,
      position: "relative",
      boxShadow: "0 14px 32px -16px rgba(31,27,23,0.4)",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: -40,
        right: -40,
        width: 220,
        height: 220,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(198,90,62,0.32), transparent 70%)",
        pointerEvents: "none",
      }}
    />
    <div style={{ position: "relative", padding: "18px 18px 16px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.terracotta }} />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: COLORS.terracottaSoft,
            whiteSpace: "nowrap",
          }}
        >
          {dateLabel}
        </span>
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: 28,
          letterSpacing: -0.6,
          lineHeight: 1.1,
          marginTop: 12,
          color: COLORS.paper,
        }}
      >
        {intention ? (
          <>{intention}</>
        ) : (
          <>
            Set today's <em style={{ color: COLORS.terracottaSoft }}>intention</em>.
          </>
        )}
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 13,
          color: COLORS.tan,
          marginTop: 6,
        }}
      >
        {intention ? "Today's one quiet promise." : "One quiet sentence is enough."}
      </div>

      <div
        style={{
          display: "flex",
          gap: 0,
          marginTop: 16,
          background: "rgba(251,247,241,0.06)",
          borderRadius: 12,
          padding: "10px 14px",
          border: "1px solid rgba(251,247,241,0.08)",
        }}
      >
        {[
          { v: String(priorityCount), l: "Priorities" },
          { v: habitsLabel, l: "Habits done" },
          { v: String(eventCount), l: "Events" },
          { v: String(goalsOpen), l: "Goals open" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              paddingLeft: i ? 10 : 0,
              borderLeft: i ? "1px solid rgba(251,247,241,0.12)" : "none",
            }}
          >
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 18,
                fontWeight: 500,
                color: COLORS.paper,
                letterSpacing: -0.3,
              }}
            >
              {s.v}
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: COLORS.tan,
                marginTop: 2,
              }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
        <Link
          to="/daily"
          style={{
            padding: "9px 14px",
            background: COLORS.terracotta,
            color: COLORS.paper,
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            fontFamily: SF,
          }}
        >
          Open daily page
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
        <Link
          to="/daily"
          style={{
            padding: "9px 12px",
            color: COLORS.tan,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
            whiteSpace: "nowrap",
            fontFamily: SF,
          }}
        >
          {intention ? "Edit intention" : "Set intention"}
        </Link>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// SECTION HEADER — eyebrow + italic hint
// ─────────────────────────────────────────────────────────────
const SectionHeader = ({ label, hint }: { label: string; hint: string }) => (
  <div
    style={{
      padding: "0 22px",
      marginBottom: 10,
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
    }}
  >
    <div className="eyebrow">{label}</div>
    <div
      style={{
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: 12,
        color: COLORS.inkSoft,
        whiteSpace: "nowrap",
      }}
    >
      {hint}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// TILE — same vocabulary as Marketing hub
// ─────────────────────────────────────────────────────────────
const TileWrap = ({ children, fullWidth }: { children: React.ReactNode; fullWidth?: boolean }) => (
  <div style={fullWidth ? { gridColumn: "1 / -1" } : undefined}>{children}</div>
);

const Tile = ({
  name,
  status,
  bg,
  previewAlign = "center",
  wide,
  href,
  children,
}: {
  name: string;
  status: string;
  bg: string;
  previewAlign?: "center" | "flex-start";
  wide?: boolean;
  href: string;
  children: React.ReactNode;
}) => {
  const { trigger: haptic } = useHaptics();
  return (
    <Link
      to={href}
      onClick={() => haptic("selection")}
      className="transition-transform duration-150 active:scale-[0.985] no-underline"
      style={{
        background: "#FFFFFF",
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 18,
        padding: 14,
        height: 168,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 2px rgba(31,27,23,0.04)",
        position: "relative",
        overflow: "hidden",
        color: COLORS.ink,
        textDecoration: "none",
        fontFamily: SF,
      }}
    >
      <div
        style={{
          height: 76,
          background: bg,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: previewAlign,
          padding: previewAlign === "flex-start" ? "8px 10px" : wide ? "8px 14px" : 0,
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      <div
        style={{
          fontWeight: 600,
          fontSize: 15,
          color: COLORS.ink,
          letterSpacing: -0.2,
          marginBottom: 2,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 12,
          color: COLORS.inkMid,
          lineHeight: 1.35,
        }}
      >
        {status}
      </div>
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "rgba(251,247,241,0.92)",
          border: `1px solid ${COLORS.hairline}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.inkMid,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  );
};

// ─────────────────────────────────────────────────────────────
// QUIET PROMISES — single card with up-to-3 priority rows
// Falls back to a soft empty state when the user has no priorities yet.
// ─────────────────────────────────────────────────────────────
const QuietPromises = ({
  priorities,
}: {
  priorities: { text?: string; done?: boolean }[];
}) => {
  const isEmpty = priorities.length === 0;
  return (
    <div style={{ padding: "0 16px 32px" }}>
      <div
        style={{
          background: "#FFFFFF",
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 18,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxShadow: "0 1px 2px rgba(31,27,23,0.04)",
        }}
      >
        {isEmpty ? (
          <Link
            to="/daily"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "4px 0",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: `1.5px dashed ${COLORS.tan}`,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: COLORS.inkMid,
                }}
              >
                No promises yet — open today's page and write the first.
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: COLORS.terracotta,
                background: "#FAEDE7",
                padding: "4px 10px",
                borderRadius: 999,
              }}
            >
              Set
            </div>
          </Link>
        ) : (
          priorities.map((p, i) => {
            const isLast = i === priorities.length - 1;
            return (
              <Link
                key={i}
                to="/daily"
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  paddingBottom: isLast ? 0 : 12,
                  borderBottom: isLast ? "none" : "1px solid rgba(31,27,23,0.06)",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: p.done ? "0" : `1.5px solid ${COLORS.tan}`,
                    background: p.done ? COLORS.terracotta : "transparent",
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {p.done && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: SF,
                      fontSize: 14,
                      fontWeight: 500,
                      color: COLORS.ink,
                      opacity: p.done ? 0.55 : 1,
                      textDecoration: p.done ? "line-through" : "none",
                    }}
                  >
                    {p.text}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: p.done ? COLORS.inkSoft : COLORS.terracotta,
                    background: p.done ? "#F7F1E8" : "#FAEDE7",
                    padding: "4px 10px",
                    borderRadius: 999,
                  }}
                >
                  {p.done ? "Done" : "Today"}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// EDITORIAL CLOSER
// ─────────────────────────────────────────────────────────────
const Closer = () => (
  <div style={{ padding: "8px 32px 36px", textAlign: "center" }}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
      }}
    >
      <div style={{ width: 32, height: 1, background: "rgba(31,27,23,0.25)" }} />
      <div style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.terracotta }} />
      <div style={{ width: 32, height: 1, background: "rgba(31,27,23,0.25)" }} />
    </div>
    <div
      style={{
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: 14,
        color: COLORS.inkSoft,
        lineHeight: 1.5,
      }}
    >
      Need a quieter week?
      <br />
      <Link
        to="/weekly"
        style={{
          color: COLORS.terracotta,
          textDecoration: "underline",
          textDecorationColor: "rgba(198,90,62,0.4)",
          textUnderlineOffset: 3,
        }}
      >
        Plan a week of three things
      </Link>
    </div>
  </div>
);

export default PlannerHub;
