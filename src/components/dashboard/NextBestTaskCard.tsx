import { useNavigate, Link, useParams } from "react-router-dom";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import { APP_LEVEL_LEARN_MORE } from "@/data/taskLearnMoreLinks";

interface NextBestTaskCardProps {
  title: string;
  whyItMatters: string;
  estimatedMinutes: string;
  route: string;
  phaseLabel?: string;
  stepIndex?: number;
  stepTotal?: number;
  aiAssisted?: boolean;
  onSkip?: () => void;
}

export const NextBestTaskCard = ({
  title,
  whyItMatters,
  estimatedMinutes,
  route,
  phaseLabel,
  stepIndex,
  stepTotal,
  aiAssisted = true,
  onSkip,
}: NextBestTaskCardProps) => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();

  const eyebrow = [
    "Next step",
    phaseLabel,
    stepIndex && stepTotal ? `${stepIndex} of ${stepTotal}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--clay-200)) 0%, #EFE4D3 100%)",
        borderRadius: 18,
        padding: "36px 36px 32px",
      }}
    >
      <div
        className="pointer-events-none absolute"
        style={{
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(198,90,62,0.22), transparent 70%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div
          className="inline-flex items-center gap-2"
          style={{
            padding: "5px 12px",
            background: "rgba(31,27,23,0.08)",
            borderRadius: 999,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "hsl(var(--terracotta-500))",
            }}
          />
          <span
            className="uppercase text-[hsl(var(--ink-900))]"
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontSize: 11,
              letterSpacing: "0.12em",
              fontWeight: 600,
            }}
          >
            {eyebrow}
          </span>
        </div>
        {projectId && (
          <Link
            to={`/help?article=${APP_LEVEL_LEARN_MORE.dashboard}`}
            className="text-xs text-[hsl(var(--fg-muted))] underline hover:text-[hsl(var(--ink-900))]"
          >
            What's this?
          </Link>
        )}
      </div>

      <h2
        className="relative text-[hsl(var(--ink-900))]"
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 500,
          fontSize: 36,
          letterSpacing: "-0.02em",
          margin: "20px 0 10px",
          lineHeight: 1.1,
          maxWidth: 560,
        }}
      >
        {title}
      </h2>

      <p
        className="relative m-0 text-[hsl(var(--ink-800))]"
        style={{
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontSize: 15.5,
          lineHeight: 1.6,
          maxWidth: 540,
        }}
      >
        {whyItMatters}
      </p>

      <div className="relative mt-5 flex items-center gap-5 flex-wrap">
        <button
          onClick={() => navigate(route)}
          className="rounded-full inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{
            background: "hsl(var(--ink-900))",
            color: "hsl(var(--paper-50))",
            border: 0,
            padding: "12px 24px",
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Start this step <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <div
          className="inline-flex items-center gap-[18px] text-[hsl(var(--fg-secondary))]"
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: 12.5,
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[hsl(var(--fg-muted))]" />
            {estimatedMinutes} min
          </span>
          {aiAssisted && (
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--fg-muted))]" />
              AI will help
            </span>
          )}
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-[hsl(var(--fg-secondary))] underline hover:text-[hsl(var(--ink-900))]"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
