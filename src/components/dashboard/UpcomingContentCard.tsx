import { useNavigate } from "react-router-dom";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { ArrowRight } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  scheduled_at?: string | null;
  scheduled_platforms?: string[] | null;
}

interface UpcomingContentCardProps {
  today: ContentItem[];
  tomorrow: ContentItem[];
  upcoming?: ContentItem[];
  projectId: string;
}

const formatWhen = (iso?: string | null): string => {
  if (!iso) return "Soon";
  const d = parseISO(iso);
  if (isToday(d)) return `Today · ${format(d, "MMM d")}`;
  if (isTomorrow(d)) return `Tomorrow · ${format(d, "MMM d")}`;
  return `${format(d, "EEE")} · ${format(d, "MMM d")}`;
};

const platformLabel = (item: ContentItem): string => {
  const platform = item.scheduled_platforms?.[0];
  if (platform) {
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  }
  return item.content_type
    ? item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1)
    : "General";
};

const typeLabel = (item: ContentItem): string => {
  const t = (item.content_type || "post").toLowerCase();
  const map: Record<string, string> = {
    post: "Social post",
    story: "Story",
    reel: "Reel",
    email: "Email",
    blog: "Blog post",
    video: "Video",
  };
  return map[t] || (t.charAt(0).toUpperCase() + t.slice(1));
};

export const UpcomingContentCard = ({
  today,
  tomorrow,
  upcoming = [],
  projectId,
}: UpcomingContentCardProps) => {
  const navigate = useNavigate();

  const all = [...today, ...tomorrow, ...upcoming]
    .filter((i) => i.scheduled_at)
    .sort(
      (a, b) =>
        new Date(a.scheduled_at!).getTime() -
        new Date(b.scheduled_at!).getTime()
    )
    .slice(0, 4);

  if (all.length === 0) return null;

  return (
    <div
      className="bg-white"
      style={{
        border: "1px solid hsl(var(--border-hairline))",
        borderRadius: 14,
        padding: 24,
      }}
    >
      <div className="flex justify-between items-baseline mb-3.5">
        <div>
          <div
            className="uppercase"
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontSize: 11,
              letterSpacing: "0.14em",
              color: "hsl(var(--terracotta-500))",
              fontWeight: 600,
            }}
          >
            Upcoming content
          </div>
          <div
            className="text-[hsl(var(--ink-900))]"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 500,
              fontSize: 20,
              letterSpacing: "-0.01em",
              marginTop: 4,
            }}
          >
            This week's rhythm.
          </div>
        </div>
        <button
          onClick={() => navigate(`/projects/${projectId}/content`)}
          className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: 13,
            color: "hsl(var(--terracotta-500))",
          }}
        >
          View content plan <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid gap-1">
        {all.map((u, i) => (
          <div
            key={u.id}
            className="grid items-center gap-4"
            style={{
              gridTemplateColumns: "110px 1fr auto",
              padding: "14px 4px",
              borderTop: i === 0 ? 0 : "1px solid hsl(var(--border-hairline))",
            }}
          >
            <div
              className="whitespace-nowrap text-[hsl(var(--fg-muted))]"
              style={{
                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                fontSize: 11,
                letterSpacing: "0.04em",
              }}
            >
              {formatWhen(u.scheduled_at)}
            </div>
            <div className="min-w-0">
              <div
                className="truncate text-[hsl(var(--ink-900))]"
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontWeight: 500,
                  fontSize: 15,
                  letterSpacing: "-0.005em",
                }}
              >
                {u.title}
              </div>
              <div
                className="text-[hsl(var(--fg-muted))] mt-0.5"
                style={{
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontSize: 12,
                }}
              >
                {typeLabel(u)}
              </div>
            </div>
            <span
              className="whitespace-nowrap shrink-0"
              style={{
                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 999,
                background: "hsl(var(--clay-200))",
                color: "hsl(var(--ink-800))",
                fontWeight: 500,
              }}
            >
              {platformLabel(u)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
