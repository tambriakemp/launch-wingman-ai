import { Search } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Cream search pill that opens the global command palette.
 * Dispatches a synthetic ⌘K keydown so any existing CommandDialog listener
 * (cmdk-style) picks it up — falls back gracefully if none is mounted.
 */
export const CommandSearchPill = () => {
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
    }
  }, []);

  const openPalette = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      code: "KeyK",
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <button
      type="button"
      onClick={openPalette}
      className="hidden md:flex items-center gap-2 flex-1 min-w-[260px] max-w-[420px] mx-5 px-3.5 py-1.5 rounded-full border border-[hsl(var(--hairline))] bg-[hsl(var(--paper-100))] hover:bg-[hsl(var(--paper-200))] transition-colors text-left"
      aria-label="Open command palette"
    >
      <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="flex-1 text-[13px] text-muted-foreground truncate">
        Search tasks, content…
      </span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[hsl(var(--hairline))] bg-card text-[10px] font-mono text-muted-foreground">
        {isMac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
};
