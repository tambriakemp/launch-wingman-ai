import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { format, addDays, subDays, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Sun, Moon, BookOpen, Flame, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

interface DailyPageData {
  id?: string;
  intention: string;
  priority_1: string;
  priority_1_done: boolean;
  priority_2: string;
  priority_2_done: boolean;
  priority_3: string;
  priority_3_done: boolean;
  notes: string;
  evening_reflection: string;
  gratitude: string;
  mood: string;
}

interface HabitWithCompletion {
  id: string;
  name: string;
  color: string;
  completed: boolean;
}

const MOODS = [
  { value: "great", emoji: "🔥", label: "Great" },
  { value: "good", emoji: "😊", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "rough", emoji: "😔", label: "Rough" },
];

const EMPTY_PAGE: DailyPageData = {
  intention: "",
  priority_1: "", priority_1_done: false,
  priority_2: "", priority_2_done: false,
  priority_3: "", priority_3_done: false,
  notes: "",
  evening_reflection: "",
  gratitude: "",
  mood: "",
};

const MORNING_PROMPTS = [
  "What would make today a win?",
  "What's the one thing that must get done today?",
  "Who do you want to show up as today?",
  "What are you most looking forward to today?",
  "What's been on your mind that you need to address today?",
];

const REFLECTION_PROMPTS = [
  "What went well today?",
  "What would you do differently?",
  "What did you learn today?",
  "What are you proud of from today?",
  "What drained your energy today, and what filled it?",
];

function getDayPrompt(date: Date, list: string[]) {
  return list[date.getDate() % list.length];
}

const DailyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [page, setPage] = useState<DailyPageData>(EMPTY_PAGE);
  const [habits, setHabits] = useState<HabitWithCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dateStr = format(currentDate, "yyyy-MM-dd");
  const isCurrentDay = isToday(currentDate);
  const morningPrompt = getDayPrompt(currentDate, MORNING_PROMPTS);
  const reflectionPrompt = getDayPrompt(currentDate, REFLECTION_PROMPTS);

  // Load page data + habits for the selected date
  const loadPage = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    // Load daily page
    const { data: pageData } = await supabase
      .from("daily_pages" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("page_date", dateStr)
      .maybeSingle();

    if (pageData) {
      const p = pageData as any;
      setPage({
        id: p.id,
        intention: p.intention || "",
        priority_1: p.priority_1 || "",
        priority_1_done: p.priority_1_done || false,
        priority_2: p.priority_2 || "",
        priority_2_done: p.priority_2_done || false,
        priority_3: p.priority_3 || "",
        priority_3_done: p.priority_3_done || false,
        notes: p.notes || "",
        evening_reflection: p.evening_reflection || "",
        gratitude: p.gratitude || "",
        mood: p.mood || "",
      });
    } else {
      setPage(EMPTY_PAGE);
    }

    // Load habits + today's completions
    const { data: habitData } = await supabase
      .from("habits" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: true });

    const { data: completionData } = await supabase
      .from("habit_completions" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("completed_date", dateStr);

    const completedIds = new Set((completionData || []).map((c: any) => c.habit_id));
    setHabits(
      ((habitData || []) as any[]).map((h) => ({
        id: h.id,
        name: h.name,
        color: h.color,
        completed: completedIds.has(h.id),
      }))
    );

    setIsLoading(false);
  }, [user, dateStr]);

  useEffect(() => { loadPage(); }, [loadPage]);

  // Debounced auto-save
  const savePageDebounced = useCallback((updatedPage: DailyPageData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!user) return;
      setIsSaving(true);
      const payload = {
        user_id: user.id,
        page_date: dateStr,
        intention: updatedPage.intention || null,
        priority_1: updatedPage.priority_1 || null,
        priority_1_done: updatedPage.priority_1_done,
        priority_2: updatedPage.priority_2 || null,
        priority_2_done: updatedPage.priority_2_done,
        priority_3: updatedPage.priority_3 || null,
        priority_3_done: updatedPage.priority_3_done,
        notes: updatedPage.notes || null,
        evening_reflection: updatedPage.evening_reflection || null,
        gratitude: updatedPage.gratitude || null,
        mood: updatedPage.mood || null,
        updated_at: new Date().toISOString(),
      };
      await supabase.from("daily_pages" as any).upsert(payload, { onConflict: "user_id,page_date" });
      setIsSaving(false);
    }, 800);
  }, [user, dateStr]);

  const updatePage = (updates: Partial<DailyPageData>) => {
    const updated = { ...page, ...updates };
    setPage(updated);
    savePageDebounced(updated);
  };

  const toggleHabit = async (habitId: string, completed: boolean) => {
    if (!user) return;
    if (completed) {
      await supabase.from("habit_completions" as any).delete()
        .eq("habit_id", habitId).eq("completed_date", dateStr).eq("user_id", user.id);
    } else {
      await supabase.from("habit_completions" as any).insert({
        habit_id: habitId, user_id: user.id, completed_date: dateStr,
      });
    }
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completed: !completed } : h));
  };

  const habitsDone = habits.filter(h => h.completed).length;
  const prioritiesDone = [page.priority_1_done, page.priority_2_done, page.priority_3_done]
    .filter(Boolean).length;
  const prioritiesSet = [page.priority_1, page.priority_2, page.priority_3]
    .filter(Boolean).length;

  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="max-w-2xl mx-auto pb-24">

        <div className="pt-2">

          {/* Date nav header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentDate(d => subDays(d, 1))}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {isCurrentDay ? "Today" : format(currentDate, "EEEE")}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(currentDate, "MMMM d, yyyy")}
              </div>
              {!isCurrentDay && (
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Back to today
                </button>
              )}
            </div>

            <button
              onClick={() => setCurrentDate(d => addDays(d, 1))}
              disabled={isCurrentDay}
              className={cn("p-2 rounded-lg hover:bg-accent transition-colors", isCurrentDay && "opacity-20 pointer-events-none")}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Save indicator */}
          {isSaving && (
            <p className="text-center text-xs text-muted-foreground mb-4 animate-pulse">Saving...</p>
          )}

          {/* ── MORNING SECTION ── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Morning</h2>
            </div>

            {/* Intention */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-foreground mb-1">
                Today's Intention
              </label>
              <p className="text-xs text-muted-foreground mb-2 italic">{morningPrompt}</p>
              <Textarea
                value={page.intention}
                onChange={e => updatePage({ intention: e.target.value })}
                placeholder="Set your intention for the day..."
                rows={2}
                className="resize-none text-sm bg-muted/30 border-muted focus:bg-background transition-colors"
                maxLength={300}
              />
            </div>

            {/* Top 3 Priorities */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-foreground">Top 3 Priorities</label>
                {prioritiesSet > 0 && (
                  <span className="text-xs text-muted-foreground">{prioritiesDone}/{prioritiesSet} done</span>
                )}
              </div>
              <div className="space-y-2">
                {([
                  { key: "priority_1", doneKey: "priority_1_done", num: 1 },
                  { key: "priority_2", doneKey: "priority_2_done", num: 2 },
                  { key: "priority_3", doneKey: "priority_3_done", num: 3 },
                ] as const).map(({ key, doneKey, num }) => (
                  <div key={key} className="flex items-center gap-3 group">
                    <button
                      onClick={() => updatePage({ [doneKey]: !page[doneKey] })}
                      className="shrink-0 transition-colors"
                    >
                      {page[doneKey]
                        ? <CheckCircle2 className="w-5 h-5 text-primary" />
                        : <Circle className="w-5 h-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                      }
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={page[key]}
                        onChange={e => updatePage({ [key]: e.target.value })}
                        placeholder={`Priority ${num}`}
                        maxLength={200}
                        className={cn(
                          "w-full bg-transparent border-b border-border focus:border-primary outline-none text-sm py-1.5 transition-colors placeholder:text-muted-foreground/50",
                          page[doneKey] && "line-through text-muted-foreground"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── HABITS SECTION ── */}
          {habits.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Habits</h2>
                </div>
                <span className="text-xs text-muted-foreground">{habitsDone}/{habits.length}</span>
              </div>
              <div className="space-y-2">
                {habits.map(habit => (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id, habit.completed)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                      habit.completed
                        ? "border-transparent bg-muted/60"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                        habit.completed ? "border-transparent" : "border-current opacity-30"
                      )}
                      style={habit.completed ? { background: habit.color } : { color: habit.color }}
                    >
                      {habit.completed && (
                        <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      habit.completed ? "line-through text-muted-foreground" : "text-foreground"
                    )}>
                      {habit.name}
                    </span>
                    {habit.completed && (
                      <span className="ml-auto text-xs" style={{ color: habit.color }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate("/habits")}
                className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Manage habits →
              </button>
            </div>
          )}

          {habits.length === 0 && (
            <div className="mb-8 rounded-xl border border-dashed border-border p-5 text-center">
              <Flame className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">No habits set up yet</p>
              <button onClick={() => navigate("/habits")} className="text-xs text-primary hover:underline">
                Create your first habit →
              </button>
            </div>
          )}

          {/* ── NOTES SECTION ── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notes</h2>
            </div>
            <Textarea
              value={page.notes}
              onChange={e => updatePage({ notes: e.target.value })}
              placeholder="Jot down anything — ideas, reminders, quick thoughts..."
              rows={4}
              className="resize-none text-sm bg-muted/30 border-muted focus:bg-background transition-colors"
              maxLength={2000}
            />
          </div>

          {/* ── EVENING SECTION ── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Evening</h2>
            </div>

            {/* Mood */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-foreground mb-3">How was your day?</label>
              <div className="flex gap-3">
                {MOODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => updatePage({ mood: page.mood === m.value ? "" : m.value })}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all",
                      page.mood === m.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gratitude */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-foreground mb-1">Gratitude</label>
              <p className="text-xs text-muted-foreground mb-2 italic">What are you grateful for today?</p>
              <Textarea
                value={page.gratitude}
                onChange={e => updatePage({ gratitude: e.target.value })}
                placeholder="I'm grateful for..."
                rows={2}
                className="resize-none text-sm bg-muted/30 border-muted focus:bg-background transition-colors"
                maxLength={500}
              />
            </div>

            {/* Reflection */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Reflection</label>
              <p className="text-xs text-muted-foreground mb-2 italic">{reflectionPrompt}</p>
              <Textarea
                value={page.evening_reflection}
                onChange={e => updatePage({ evening_reflection: e.target.value })}
                placeholder="Reflect on your day..."
                rows={3}
                className="resize-none text-sm bg-muted/30 border-muted focus:bg-background transition-colors"
                maxLength={1000}
              />
            </div>
          </div>

          {/* Progress summary bar */}
          <div className="fixed bottom-0 left-0 right-0 md:left-56 border-t border-border bg-background/95 backdrop-blur-sm py-3 px-4 flex items-center justify-center gap-3 sm:gap-6 z-50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">{prioritiesDone}/{prioritiesSet || 3}</span>
              <span>priorities</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-medium">{habitsDone}/{habits.length}</span>
              <span>habits</span>
            </div>
            {page.mood && (
              <>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{MOODS.find(m => m.value === page.mood)?.emoji}</span>
                  <span>{MOODS.find(m => m.value === page.mood)?.label}</span>
                </div>
              </>
            )}
            <div className="w-px h-4 bg-border" />
            <button
              onClick={() => navigate("/planner")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

        </div>
      </div>
    </ProjectLayout>
  );
};

export default DailyPage;
