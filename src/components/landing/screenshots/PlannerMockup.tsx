import { Calendar, CheckCircle2, Circle, Flame, Target, BookOpen } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

export const PlannerMockup = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dates = [7, 8, 9, 10, 11, 12, 13];
  const today = 2; // Wednesday index

  const habits = [
    { name: "Morning journaling", streak: 12, done: [true, true, true, false, false, false, false], color: "bg-green-400" },
    { name: "30 min content", streak: 8, done: [true, false, true, true, false, false, false], color: "bg-blue-400" },
    { name: "Exercise", streak: 5, done: [true, true, false, false, false, false, false], color: "bg-rose-400" },
  ];

  return (
    <BrowserFrame>
      <div className="p-5 min-h-[400px] space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Planner</h3>
            <p className="text-xs text-muted-foreground">Your week at a glance</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-accent/15 text-accent-foreground px-2.5 py-1 rounded-md text-xs font-medium">Calendar</div>
            <div className="text-muted-foreground px-2.5 py-1 rounded-md text-xs">Goals</div>
            <div className="text-muted-foreground px-2.5 py-1 rounded-md text-xs">Habits</div>
          </div>
        </div>

        {/* Mini week calendar */}
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day, i) => (
            <div key={day} className={`text-center rounded-lg py-2 ${i === today ? "bg-accent text-accent-foreground" : "bg-muted/50"}`}>
              <div className="text-[10px] text-muted-foreground">{day}</div>
              <div className={`text-sm font-semibold ${i === today ? "text-accent-foreground" : "text-foreground"}`}>{dates[i]}</div>
              {i <= today && (
                <div className="flex justify-center mt-1 gap-0.5">
                  {[0, 1].map(j => (
                    <div key={j} className={`w-1 h-1 rounded-full ${i < today ? "bg-green-400" : "bg-accent-foreground/50"}`} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Today's priorities */}
        <div className="bg-card border border-border rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-foreground">Today's Priorities</span>
          </div>
          <div className="space-y-2">
            {[
              { text: "Finalize launch email sequence", done: true },
              { text: "Record welcome video for course", done: false },
              { text: "Review opt-in page copy", done: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {item.done
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                <span className={`text-xs ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Habits tracker */}
        <div className="bg-card border border-border rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-semibold text-foreground">Habit Streaks</span>
            </div>
          </div>
          <div className="space-y-2.5">
            {habits.map((habit, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-foreground w-28 truncate">{habit.name}</span>
                <div className="flex gap-1 flex-1">
                  {habit.done.map((d, j) => (
                    <div key={j} className={`w-5 h-5 rounded ${j <= today ? (d ? habit.color : "bg-muted") : "bg-muted/40"} flex items-center justify-center`}>
                      {d && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">🔥 {habit.streak}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Goals preview */}
        <div className="bg-card border border-border rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs font-semibold text-foreground">Goals</span>
          </div>
          <div className="space-y-2">
            {[
              { name: "Grow email list to 500", progress: 68 },
              { name: "Launch coaching program", progress: 40 },
            ].map((goal, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">{goal.name}</span>
                  <span className="text-[10px] text-muted-foreground">{goal.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${goal.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};
