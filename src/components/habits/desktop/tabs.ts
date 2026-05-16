export const TABS = ["Today", "Habits", "Statistics"] as const;
export type DesktopTab = typeof TABS[number];
