import { cn } from "@/lib/utils";

interface ProductivityGaugeProps {
  value: number; // 0..100
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  sublabel?: string;
}

export function ProductivityGauge({
  value,
  size = 180,
  strokeWidth = 14,
  className,
  label,
  sublabel,
}: ProductivityGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circ = Math.PI * radius; // semicircle
  const offset = circ - (clamped / 100) * circ;

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)} style={{ width: size }}>
      <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          className="stroke-muted"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          className="stroke-primary transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1 flex flex-col items-center">
        <span className="text-3xl font-bold text-foreground tabular-nums">{Math.round(clamped)}%</span>
        {label && <span className="text-xs text-muted-foreground mt-0.5">{label}</span>}
      </div>
      {sublabel && <p className="text-xs text-muted-foreground mt-2">{sublabel}</p>}
    </div>
  );
}
