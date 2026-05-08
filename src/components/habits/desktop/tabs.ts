export const TABS = ["Today", "Habits", "Statistics", "Add habit"] as const;
export type DesktopTab = typeof TABS[number];
