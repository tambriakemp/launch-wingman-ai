import { Link } from "react-router-dom";
import {
  ChevronRight,
  Target,
  TrendingUp,
  Link2,
  Sparkles,
  FileText,
  Mail,
  CalendarRange,
  Layers,
  Package,
} from "lucide-react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";

interface Tool {
  label: string;
  description: string;
  icon: typeof Target;
  href: string;
}

interface ToolGroup {
  eyebrow: string;
  tools: Tool[];
}

const GROUPS: ToolGroup[] = [
  {
    eyebrow: "Grow",
    tools: [
      {
        label: "Campaigns",
        description: "Plan and run cross-channel launches",
        icon: Target,
        href: "/marketing-hub/campaigns",
      },
      {
        label: "Analytics",
        description: "See what's working — and what isn't",
        icon: TrendingUp,
        href: "/marketing-hub/analytics",
      },
      {
        label: "UTM Builder",
        description: "Track every link, source, and click",
        icon: Link2,
        href: "/marketing-hub/utm-builder",
      },
    ],
  },
  {
    eyebrow: "Create",
    tools: [
      {
        label: "AI Avatar Studio",
        description: "Make on-brand video with your AI twin",
        icon: Sparkles,
        href: "/app/ai-studio",
      },
      {
        label: "Sales Page Writer",
        description: "Draft a launch page in your voice",
        icon: FileText,
        href: "/app/ai-studio/sales-page",
      },
      {
        label: "Email Sequence",
        description: "Build a launch-email cadence",
        icon: Mail,
        href: "/app/ai-studio/email-sequence",
      },
    ],
  },
  {
    eyebrow: "Distribute",
    tools: [
      {
        label: "Social Planner",
        description: "Schedule posts across channels",
        icon: CalendarRange,
        href: "/social-planner",
      },
      {
        label: "Carousel Builder",
        description: "Design swipe-through posts in minutes",
        icon: Layers,
        href: "/carousel-builder",
      },
      {
        label: "Content Vault",
        description: "Templates, swipes, and saved drafts",
        icon: Package,
        href: "/content-vault",
      },
    ],
  },
];

const MarketingHub = () => {
  return (
    <ProjectLayout>
      <div className="max-w-2xl mx-auto px-4 md:px-0 py-6 md:py-0 space-y-9">
        {/* Header */}
        <header className="space-y-2">
          <p className="eyebrow">Marketing</p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground tracking-tight">
            Your marketing <em className="italic text-[hsl(var(--terracotta-500))]">suite</em>
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Campaigns, content, AI tools — pick where to put your attention.
          </p>
        </header>

        {/* Grouped tools */}
        {GROUPS.map((group) => (
          <ToolGroupSection key={group.eyebrow} group={group} />
        ))}
      </div>
    </ProjectLayout>
  );
};

const ToolGroupSection = ({ group }: { group: ToolGroup }) => (
  <section className="space-y-3">
    <p className="eyebrow px-1">{group.eyebrow}</p>
    <div className="rounded-2xl bg-card border border-[hsl(var(--border-hairline))] overflow-hidden">
      {group.tools.map((tool, i) => {
        const Icon = tool.icon;
        return (
          <Link
            key={tool.label}
            to={tool.href}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 transition-colors active:bg-[hsl(var(--paper-100))] hover:bg-[hsl(var(--paper-50))]"
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
              <Icon size={18} strokeWidth={2} color="hsl(var(--terracotta-500))" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-[15px] leading-snug tracking-tight">
                {tool.label}
              </div>
              <div className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">
                {tool.description}
              </div>
            </div>
            <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-muted-foreground" />
          </Link>
        );
      })}
    </div>
  </section>
);

export default MarketingHub;
