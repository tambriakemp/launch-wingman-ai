import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Target, X, Hash, DollarSign, ToggleLeft, ListChecks, Search, Check } from "lucide-react";

const TARGET_TYPES = [
  { id: "number", label: "Number", description: "Any number like 1 or 2", icon: Hash },
  { id: "true_false", label: "True/False", description: "Done or not done", icon: ToggleLeft },
  { id: "currency", label: "Currency", description: "Show me the money", icon: DollarSign },
  { id: "tasks", label: "Tasks", description: "Track completion of tasks", icon: ListChecks },
];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "COP", symbol: "COL$", name: "Colombian Peso" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
];

interface PlannerTask {
  id: string;
  title: string;
  space_id: string | null;
  column_id: string;
}

interface PlannerSpace {
  id: string;
  name: string;
}

interface AddTargetPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (target: {
    name: string;
    target_type: string;
    unit: string;
    start_value: number;
    target_value: number;
  }) => Promise<void>;
}

export function AddTargetPanel({ open, onOpenChange, onSave }: AddTargetPanelProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [targetType, setTargetType] = useState("number");
  const [unit, setUnit] = useState("");
  const [startValue, setStartValue] = useState("0");
  const [targetValue, setTargetValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Currency
  const [currency, setCurrency] = useState("USD");
  const [currencySearch, setCurrencySearch] = useState("");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Tasks
  const [taskSearch, setTaskSearch] = useState("");
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [spaces, setSpaces] = useState<PlannerSpace[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([]);
  const [taskTab, setTaskTab] = useState<"tasks" | "spaces">("tasks");
  const [spacesTaskCounts, setSpacesTaskCounts] = useState<Record<string, number>>({});

  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const filteredCurrencies = CURRENCIES.filter(c =>
    currencySearch === "" ||
    c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
    c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    // Fetch from the tasks table (planner tasks across all spaces)
    const { data } = await supabase
      .from("tasks")
      .select("id, title, space_id, column_id")
      .eq("user_id", user.id)
      .eq("task_scope", "planner")
      .order("created_at", { ascending: false })
      .limit(500);
    setTasks((data as unknown as PlannerTask[]) || []);
  }, [user]);

  const fetchSpaces = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("planner_spaces" as any)
      .select("id, name")
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    const spaceList = (data as unknown as PlannerSpace[]) || [];
    setSpaces(spaceList);

    // Get task counts per space
    if (spaceList.length > 0) {
      const counts: Record<string, number> = {};
      for (const space of spaceList) {
        const { count } = await supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("task_scope", "planner")
          .eq("space_id", space.id);
        counts[space.id] = count || 0;
      }
      setSpacesTaskCounts(counts);
    }
  }, [user]);

  useEffect(() => {
    if (open && targetType === "tasks") {
      fetchTasks();
      fetchSpaces();
    }
  }, [open, targetType, fetchTasks, fetchSpaces]);

  // Get space name for a task
  const getSpaceName = (spaceId: string | null) => {
    if (!spaceId) return "";
    const space = spaces.find(s => s.id === spaceId);
    return space ? space.name : "";
  };

  const filteredTasks = tasks.filter(t =>
    taskSearch === "" || t.title.toLowerCase().includes(taskSearch.toLowerCase())
  );

  const filteredSpaces = spaces.filter(s =>
    taskSearch === "" || s.name.toLowerCase().includes(taskSearch.toLowerCase())
  );

  const resetForm = () => {
    setName("");
    setTargetType("number");
    setUnit("");
    setStartValue("0");
    setTargetValue("");
    setCurrency("USD");
    setCurrencySearch("");
    setShowCurrencyPicker(false);
    setTaskSearch("");
    setSelectedTaskIds([]);
    setSelectedSpaceIds([]);
    setTaskTab("tasks");
    setSpacesTaskCounts({});
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    const isTF = targetType === "true_false";
    const isCurrency = targetType === "currency";
    const isTasks = targetType === "tasks";

    let taskTargetValue = 0;
    if (isTasks) {
      // Count: individual tasks + total tasks in selected spaces
      taskTargetValue = selectedTaskIds.length;
      for (const spaceId of selectedSpaceIds) {
        taskTargetValue += spacesTaskCounts[spaceId] || 0;
      }
      if (taskTargetValue === 0) taskTargetValue = 1;
    }

    try {
      await onSave({
        name: name.trim(),
        target_type: targetType,
        unit: isTF ? "" : isCurrency ? currency : isTasks ? JSON.stringify({ taskIds: selectedTaskIds, spaceIds: selectedSpaceIds }) : unit.trim(),
        start_value: isTF ? 0 : Number(startValue) || 0,
        target_value: isTF ? 1 : isTasks ? taskTargetValue : Number(targetValue) || 1,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTask = (id: string) => {
    setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSpace = (id: string) => {
    setSelectedSpaceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col border-l border-border [&>button]:hidden">
        {/* Close button */}
        <div className="flex justify-end p-4 pb-0">
          <button
            type="button"
            onClick={() => { resetForm(); onOpenChange(false); }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pb-8 pt-2 space-y-14 flex-1 overflow-y-auto">
          {/* Target Name */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Target name</h3>
                <p className="text-sm text-muted-foreground">
                  Break your Goal down into pieces. Targets are measurable results that, when completed, will also complete the Goal.
                </p>
              </div>
            </div>
            <div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter target name..."
                className="w-full h-11 border-0 border-b border-border bg-transparent px-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                maxLength={200}
              />
            </div>
          </div>

          {/* Type of Target */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Type of Target</h3>
                <p className="text-sm text-muted-foreground">
                  How do you want to measure this result?
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-3">Choose type</p>
              <div className="grid grid-cols-4 gap-2">
                {TARGET_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = targetType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTargetType(t.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{t.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{t.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Number type: Start / Target values */}
            {targetType === "number" && (
              <div className="pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">Start</p>
                    <input
                      type="number"
                      value={startValue}
                      onChange={(e) => setStartValue(e.target.value)}
                      className="w-full h-10 border border-border rounded-lg bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">→</span>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <input
                      type="number"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      placeholder="1"
                      className="w-full h-10 border border-border rounded-lg bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                {/* Unit input */}
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Unit label (optional)</p>
                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. miles, items, pages..."
                    className="w-full h-10 border border-border rounded-lg bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    maxLength={30}
                  />
                </div>
              </div>
            )}

            {/* Currency type */}
            {targetType === "currency" && (
              <div className="pt-2 space-y-3">
                {/* Currency selector */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Currency</p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                      className="w-full h-10 border border-border rounded-lg bg-transparent px-3 text-sm text-foreground text-left flex items-center justify-between hover:border-primary/40 transition-colors"
                    >
                      <span>{selectedCurrency.symbol} {selectedCurrency.name} ({selectedCurrency.code})</span>
                      <span className="text-muted-foreground text-xs">▼</span>
                    </button>
                    {showCurrencyPicker && (
                      <div className="absolute z-50 top-11 left-0 w-full max-h-48 overflow-y-auto border border-border rounded-lg bg-popover shadow-lg">
                        <div className="sticky top-0 bg-popover p-2 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                              autoFocus
                              value={currencySearch}
                              onChange={(e) => setCurrencySearch(e.target.value)}
                              placeholder="Search currency..."
                              className="w-full h-8 pl-8 pr-3 text-xs border border-border rounded bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                        {filteredCurrencies.map(c => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => { setCurrency(c.code); setShowCurrencyPicker(false); setCurrencySearch(""); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${currency === c.code ? "bg-primary/5 text-primary" : "text-foreground"}`}
                          >
                            <span className="w-8 text-center font-medium">{c.symbol}</span>
                            <span>{c.name}</span>
                            <span className="text-muted-foreground text-xs ml-auto">{c.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Start / Target values */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">Start</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground font-medium">{selectedCurrency.symbol}</span>
                      <input
                        type="number"
                        value={startValue}
                        onChange={(e) => setStartValue(e.target.value)}
                        className="w-full h-10 border border-border rounded-lg bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <span className="text-muted-foreground mt-5">→</span>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground font-medium">{selectedCurrency.symbol}</span>
                      <input
                        type="number"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        placeholder="1"
                        className="w-full h-10 border border-border rounded-lg bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks type */}
            {targetType === "tasks" && (
              <div className="pt-2 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Add tasks or spaces to track. This won't move or modify your existing tasks.
                </p>

                {/* Tab toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTaskTab("tasks")}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      taskTab === "tasks" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    + Add Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskTab("spaces")}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      taskTab === "spaces" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    + Add List
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder={taskTab === "tasks" ? "Search tasks..." : "Search lists..."}
                    className="pl-9 h-9 text-sm"
                  />
                </div>

                {/* List */}
                <div className="max-h-56 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                  {taskTab === "tasks" ? (
                    filteredTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3 text-center">No tasks found</p>
                    ) : (
                      filteredTasks.map(task => {
                        const spaceName = getSpaceName(task.space_id);
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${
                              selectedTaskIds.includes(task.id) ? "bg-primary/5" : ""
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              selectedTaskIds.includes(task.id) ? "bg-primary border-primary" : "border-border"
                            }`}>
                              {selectedTaskIds.includes(task.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="truncate text-foreground block">{task.title}</span>
                              {spaceName && (
                                <span className="text-[10px] text-muted-foreground">{spaceName}</span>
                              )}
                            </div>
                            {task.column_id === "done" && (
                              <span className="text-[10px] text-primary font-medium">Done</span>
                            )}
                          </button>
                        );
                      })
                    )
                  ) : (
                    filteredSpaces.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3 text-center">No lists found</p>
                    ) : (
                      filteredSpaces.map(space => (
                        <button
                          key={space.id}
                          type="button"
                          onClick={() => toggleSpace(space.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${
                            selectedSpaceIds.includes(space.id) ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            selectedSpaceIds.includes(space.id) ? "bg-primary border-primary" : "border-border"
                          }`}>
                            {selectedSpaceIds.includes(space.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="truncate text-foreground block">{space.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {spacesTaskCounts[space.id] ?? "..."} tasks
                            </span>
                          </div>
                        </button>
                      ))
                    )
                  )}
                </div>

                {/* Selected summary */}
                {(selectedTaskIds.length > 0 || selectedSpaceIds.length > 0) && (
                  <p className="text-xs text-primary font-medium">
                    {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? "s" : ""}, {selectedSpaceIds.length} list{selectedSpaceIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="px-8 py-5 border-t border-border gap-3 mt-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => { resetForm(); onOpenChange(false); }}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? "Saving..." : "Save Target"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
