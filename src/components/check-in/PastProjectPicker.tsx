import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Rocket, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export type PickerMode = "revisit" | "relaunch";

interface PastProject {
  id: string;
  name: string;
  status: string;
  updated_at: string;
}

interface PastProjectPickerProps {
  mode: PickerMode;
  onSelect: (projectId: string) => void;
  onBack?: () => void;
  onClose?: () => void;
}

const COPY: Record<PickerMode, { eyebrow: string; title: string; subtitle: string; emptyMessage: string; emptyCta: string }> = {
  revisit: {
    eyebrow: "Past launches",
    title: "Pick a past launch",
    subtitle: "Take another look at something you've finished.",
    emptyMessage: "Nothing finished yet — your past launches will show up here once you complete one.",
    emptyCta: "Back to where you are",
  },
  relaunch: {
    eyebrow: "Relaunch",
    title: "Which launch would you like to relaunch?",
    subtitle: "Choose a previous launch to start a fresh round from.",
    emptyMessage: "You haven't launched anything yet. Keep going with what you're building.",
    emptyCta: "Stay with the current one",
  },
};

export function PastProjectPicker({ mode, onSelect, onBack, onClose }: PastProjectPickerProps) {
  const { user } = useAuth();
  const copy = COPY[mode];

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["past-projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, updated_at")
        .eq("user_id", user!.id)
        .in("status", ["completed", "launched", "archived"])
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PastProject[];
    },
    enabled: !!user,
  });

  return (
    <div className="p-6 space-y-6 max-h-[70vh] overflow-auto">
      <div className="space-y-2">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors -ml-1 mb-1"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Back
          </button>
        )}
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 className="font-serif text-2xl font-medium text-foreground tracking-tight">
          {copy.title}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{copy.subtitle}</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="text-center py-6 space-y-4">
          <p className="text-muted-foreground leading-relaxed">{copy.emptyMessage}</p>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              {copy.emptyCta}
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-[hsl(var(--border-hairline))] overflow-hidden">
          {projects.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-[hsl(var(--paper-100))]"
              style={{
                borderTop: i === 0 ? 0 : `0.5px solid hsl(var(--border-hairline))`,
              }}
            >
              <div
                className="shrink-0 inline-flex items-center justify-center rounded-xl"
                style={{
                  width: 38,
                  height: 38,
                  background: "rgba(198,90,62,0.10)",
                }}
              >
                <Rocket size={18} strokeWidth={2} color="hsl(var(--terracotta-500))" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-[15px] leading-snug tracking-tight truncate">
                  {p.name}
                </div>
                <div className="text-[12.5px] text-muted-foreground mt-0.5 capitalize">
                  {p.status.replace(/_/g, " ")} · {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
