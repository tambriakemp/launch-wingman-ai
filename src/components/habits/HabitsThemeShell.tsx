import { useEffect } from "react";
import "@/styles/habits-theme.css";

interface Props {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps habit screens with the editorial Launchely theme (Fraunces + Inter Tight,
 * cream/terracotta palette). Scoped via .hb-theme — no global token changes.
 */
export function HabitsThemeShell({ children, className = "" }: Props) {
  useEffect(() => {
    document.body.classList.add("hb-bg");
    return () => document.body.classList.remove("hb-bg");
  }, []);
  return <div className={`hb-theme min-h-screen ${className}`}>{children}</div>;
}
