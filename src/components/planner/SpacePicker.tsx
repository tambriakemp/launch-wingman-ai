import { useMemo, useState } from "react";
import { Check, ChevronDown, X, Settings2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHaptics } from "@/hooks/useHaptics";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";

interface SpacePickerProps {
  spaces: PlannerSpace[];
  categories: SpaceCategory[]; // ALL categories across spaces
  tasks: Array<{ space_id?: string | null; category?: string | null }>;
  selectedSpaceId: string | null;
  selectedCategoryIds: string[];
  onSelectSpace: (id: string | null) => void;
  onToggleCategory: (id: string) => void;
  onClearCategories: () => void;
  /**
   * Optional — when provided, a "Manage spaces" link appears in the picker
   * footer that closes the picker and invokes this callback. The parent
   * page is expected to open the ManageSpacesSheet in response.
   */
  onManageSpaces?: () => void;
}

/**
 * Unified space + category filter. Replaces the right-sidebar Spaces panel
 * with a compact toolbar pill. Single space + multi category. Popover on
 * desktop, vaul Drawer on mobile.
 */
export function SpacePicker({
  spaces,
  categories,
  tasks,
  selectedSpaceId,
  selectedCategoryIds,
  onSelectSpace,
  onToggleCategory,
  onClearCategories,
  onManageSpaces,
}: SpacePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const selectedSpace = useMemo(
    () => spaces.find((s) => s.id === selectedSpaceId) ?? null,
    [spaces, selectedSpaceId]
  );

  const spaceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const t of tasks) {
      total += 1;
      const sid = t.space_id;
      if (sid) counts[sid] = (counts[sid] ?? 0) + 1;
    }
    return { counts, total };
  }, [tasks]);

  const activeCategories = useMemo(
    () => (selectedSpaceId ? categories.filter((c) => c.space_id === selectedSpaceId) : []),
    [categories, selectedSpaceId]
  );

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "inline-flex items-center gap-2 h-8 rounded-full px-3 text-[12.5px] font-semibold border transition-colors",
        selectedSpace
          ? "bg-card text-foreground"
          : "bg-muted/60 text-foreground"
      )}
      style={{
        borderColor: "hsl(var(--border-hairline))",
        fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
      }}
    >
      {selectedSpace ? (
        <span
          className="inline-block rounded-full"
          style={{ width: 8, height: 8, background: selectedSpace.color }}
        />
      ) : (
        <span className="inline-block rounded-full bg-foreground/30" style={{ width: 8, height: 8 }} />
      )}
      <span className="truncate max-w-[140px]">
        {selectedSpace?.name ?? "All spaces"}
      </span>
      {selectedCategoryIds.length > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full text-[10px] font-bold leading-none px-1.5"
          style={{
            background: "hsl(var(--terracotta-500))",
            color: "white",
            minWidth: 16,
            height: 16,
          }}
        >
          {selectedCategoryIds.length}
        </span>
      )}
      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
    </button>
  );

  const body = (
    <PickerBody
      spaces={spaces}
      activeCategories={activeCategories}
      spaceCounts={spaceCounts}
      selectedSpaceId={selectedSpaceId}
      selectedCategoryIds={selectedCategoryIds}
      onSelectSpace={(id) => {
        onSelectSpace(id);
        if (id !== selectedSpaceId) onClearCategories();
      }}
      onToggleCategory={onToggleCategory}
      onClearCategories={onClearCategories}
      onClose={() => setOpen(false)}
      onManageSpaces={
        onManageSpaces
          ? () => {
              setOpen(false);
              onManageSpaces();
            }
          : undefined
      }
    />
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="max-w-lg mx-auto w-full">{body}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="p-0 w-[300px] max-h-[70vh] overflow-y-auto rounded-2xl"
      >
        {body}
      </PopoverContent>
    </Popover>
  );
}

interface PickerBodyProps {
  spaces: PlannerSpace[];
  activeCategories: SpaceCategory[];
  spaceCounts: { counts: Record<string, number>; total: number };
  selectedSpaceId: string | null;
  selectedCategoryIds: string[];
  onSelectSpace: (id: string | null) => void;
  onToggleCategory: (id: string) => void;
  onClearCategories: () => void;
  onClose: () => void;
  onManageSpaces?: () => void;
}

function PickerBody({
  spaces,
  activeCategories,
  spaceCounts,
  selectedSpaceId,
  selectedCategoryIds,
  onSelectSpace,
  onToggleCategory,
  onClearCategories,
  onClose,
  onManageSpaces,
}: PickerBodyProps) {
  const { trigger: haptic } = useHaptics();

  const handleSelectSpace = (id: string | null) => {
    haptic("selection");
    onSelectSpace(id);
    // For desktop popover, close on space selection — quick switching is the goal.
    // Categories keep the popover open.
    onClose();
  };

  const handleToggleCategory = (id: string) => {
    haptic("selection");
    onToggleCategory(id);
  };

  return (
    <div className="p-3 space-y-4">
      {/* Spaces */}
      <section>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-2 px-2"
          style={{ color: "hsl(var(--terracotta-500))" }}
        >
          Spaces
        </p>
        <SpaceRow
          name="All spaces"
          count={spaceCounts.total}
          isSelected={selectedSpaceId === null}
          onClick={() => handleSelectSpace(null)}
          dotless
        />
        {spaces.map((s) => (
          <SpaceRow
            key={s.id}
            name={s.name}
            color={s.color}
            count={spaceCounts.counts[s.id] ?? 0}
            isSelected={selectedSpaceId === s.id}
            onClick={() => handleSelectSpace(s.id)}
          />
        ))}
      </section>

      {/* Categories (only when a space is selected and it has categories) */}
      {selectedSpaceId && activeCategories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 px-2">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "hsl(var(--terracotta-500))" }}
            >
              Categories
            </p>
            {selectedCategoryIds.length > 0 && (
              <button
                onClick={() => {
                  haptic("selection");
                  onClearCategories();
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
          {activeCategories.map((c) => {
            const checked = selectedCategoryIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => handleToggleCategory(c.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors",
                  checked
                    ? "bg-[hsl(var(--paper-200))]"
                    : "hover:bg-[hsl(var(--paper-100))]"
                )}
              >
                <span
                  className="inline-block rounded-sm"
                  style={{ width: 10, height: 10, background: c.color }}
                />
                <span className="flex-1 text-[14px] text-foreground truncate">{c.name}</span>
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-4 h-4 rounded border-[1.5px] transition-colors",
                    checked
                      ? "bg-[hsl(var(--terracotta-500))] border-[hsl(var(--terracotta-500))]"
                      : "border-[hsl(var(--border-default))]"
                  )}
                >
                  {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </section>
      )}

      {/* Manage spaces link — opens the editorial management sheet */}
      {onManageSpaces && (
        <div className="border-t border-[hsl(var(--border-hairline))] pt-3 -mx-3 px-3">
          <button
            onClick={() => {
              haptic("selection");
              onManageSpaces();
            }}
            className="w-full inline-flex items-center gap-2 px-2 py-2 rounded-lg text-left text-[13px] font-medium text-[hsl(var(--ink-700))] hover:bg-[hsl(var(--paper-100))] transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-[hsl(var(--fg-muted))]" />
            Manage spaces
          </button>
        </div>
      )}

      {/* Footer — close action for mobile */}
      <div className="md:hidden pt-2">
        <Button onClick={onClose} className="w-full" size="lg">
          Done
        </Button>
      </div>
    </div>
  );
}

function SpaceRow({
  name,
  color,
  count,
  isSelected,
  onClick,
  dotless,
}: {
  name: string;
  color?: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
  dotless?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors",
        isSelected
          ? "bg-[hsl(var(--paper-200))]"
          : "hover:bg-[hsl(var(--paper-100))]"
      )}
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: 10,
          height: 10,
          background: dotless ? "transparent" : color ?? "#999",
          border: dotless ? "1.5px dashed hsl(var(--border-default))" : "none",
        }}
      />
      <span className="flex-1 text-[14px] font-medium text-foreground truncate">{name}</span>
      <span className="text-[12px] tabular-nums text-muted-foreground">{count}</span>
      {isSelected && (
        <Check className="w-4 h-4 text-[hsl(var(--terracotta-500))]" strokeWidth={2.4} />
      )}
    </button>
  );
}
