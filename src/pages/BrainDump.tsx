import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { format, parseISO } from "date-fns";
import { Brain, Send, Inbox, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface BrainDumpItem {
  id: string;
  content: string;
  status: string;
  processed_as: string | null;
  created_at: string;
}

const BrainDump = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<BrainDumpItem[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"inbox" | "processed" | "all">("inbox");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("brain_dump_items" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    setItems((data as unknown as BrainDumpItem[]) || []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleCapture = async () => {
    if (!input.trim() || !user) return;
    const lines = input
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const inserts = lines.map((content) => ({
      user_id: user.id,
      content,
      status: "inbox",
    }));
    const { data, error } = await supabase
      .from("brain_dump_items" as any)
      .insert(inserts)
      .select();
    if (error) {
      toast.error("Failed to save");
      return;
    }
    setItems((prev) => [...(data as unknown as BrainDumpItem[]), ...prev]);
    setInput("");
    textareaRef.current?.focus();
  };

  const handleProcess = async (item: BrainDumpItem, processedAs: string) => {
    await supabase
      .from("brain_dump_items" as any)
      .update({ status: "processed", processed_as: processedAs })
      .eq("id", item.id);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, status: "processed", processed_as: processedAs }
          : i
      )
    );
  };

  const handleDelete = async (id: string) => {
    await supabase.from("brain_dump_items" as any).delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearProcessed = async () => {
    if (!user) return;
    await supabase
      .from("brain_dump_items" as any)
      .delete()
      .eq("user_id", user.id)
      .eq("status", "processed");
    setItems((prev) => prev.filter((i) => i.status !== "processed"));
    toast.success("Cleared processed items");
  };

  const filteredItems = items.filter((i) => {
    if (filter === "inbox") return i.status === "inbox";
    if (filter === "processed") return i.status === "processed";
    return true;
  });

  const inboxCount = items.filter((i) => i.status === "inbox").length;
  const processedCount = items.filter((i) => i.status === "processed").length;

  const PROCESS_OPTIONS = [
    { label: "Task", value: "task", color: "text-amber-600" },
    { label: "Goal", value: "goal", color: "text-primary" },
    { label: "Content idea", value: "content", color: "text-teal-600" },
    { label: "Note", value: "note", color: "text-muted-foreground" },
    { label: "Later", value: "later", color: "text-muted-foreground" },
  ];

  return (
    <ProjectLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-8 pb-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-100/50 dark:bg-teal-900/20 rounded-xl shrink-0">
              <Brain className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">Brain Dump</h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">Capture everything. Process later. Clear your head.</p>
                </div>
                {processedCount > 0 && (
                  <Button variant="outline" size="sm" onClick={handleClearProcessed} className="shrink-0">
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Clear processed ({processedCount})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Capture area */}
        <div className="px-4 sm:px-6 pb-4">
          <div className="max-w-2xl mx-auto rounded-xl border border-border bg-card p-4">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleCapture();
                }
              }}
              placeholder="What's on your mind? Type one thought or many (one per line)... ⌘↵ to capture"
              rows={3}
              className="resize-none text-sm bg-background border-border focus:ring-1 focus:ring-primary"
              maxLength={5000}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Press ⌘↵ or click Capture. One thought per line = multiple items.
              </p>
              <Button
                onClick={handleCapture}
                disabled={!input.trim()}
                size="sm"
                className="gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                Capture
              </Button>
            </div>
          </div>
        </div>

        {/* Filter tabs + list */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 pt-3 pb-0 border-b border-border shrink-0">
            {(
              [
                { key: "inbox", label: "Inbox", count: inboxCount },
                { key: "processed", label: "Processed", count: processedCount },
                { key: "all", label: "All", count: items.length },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                  filter === tab.key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      filter === tab.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                <Inbox className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {filter === "inbox"
                    ? "Inbox is clear. Nice work."
                    : "Nothing here yet."}
                </p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto px-6 py-4 space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group rounded-xl border px-4 py-3 transition-all",
                      item.status === "processed"
                        ? "bg-muted/30 border-border/50 opacity-60"
                        : "bg-card border-border hover:border-primary/30 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm leading-relaxed",
                            item.status === "processed" &&
                              "line-through text-muted-foreground"
                          )}
                        >
                          {item.content}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted-foreground">
                            {format(parseISO(item.created_at), "MMM d, h:mm a")}
                          </span>
                          {item.processed_as && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                              → {item.processed_as}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Process buttons — only on inbox items */}
                    {item.status === "inbox" && (
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50 flex-wrap">
                        <span className="text-[10px] text-muted-foreground mr-1">
                          Send to:
                        </span>
                        {PROCESS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleProcess(item, opt.value)}
                            className={cn(
                              "text-[11px] font-medium px-2.5 py-1 rounded-full border border-border hover:bg-accent transition-colors",
                              opt.color
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProjectLayout>
  );
};

export default BrainDump;
