import { cn } from "@/lib/utils";

interface LaunchelyLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textClassName?: string;
  className?: string;
}

// Inline SVG matching the favicon.svg - Launchely seedling/growth icon
const LogoIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 32 32"
    className={className}
  >
    <rect width="32" height="32" rx="6" fill="currentColor" className="text-accent" />
    <path 
      d="M16 6c-1.5 3-2 5-2 8 0 2 .5 4 2 6 1.5-2 2-4 2-6 0-3-.5-5-2-8z" 
      className="fill-accent-foreground"
    />
    <path 
      d="M12 16c-1 1-1.5 2.5-1.5 4 1.5 0 3-.5 4-1.5" 
      fill="none" 
      className="stroke-accent-foreground"
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M20 16c1 1 1.5 2.5 1.5 4-1.5 0-3-.5-4-1.5" 
      fill="none" 
      className="stroke-accent-foreground"
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <circle cx="16" cy="12" r="1.5" className="fill-accent" />
    <path 
      d="M14 22l2 4 2-4" 
      fill="none" 
      className="stroke-accent-foreground"
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
};

const textSizeClasses = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export const LaunchelyLogo = ({ 
  size = "md", 
  showText = true, 
  textClassName,
  className 
}: LaunchelyLogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoIcon className={sizeClasses[size]} />
      {showText && (
        <span className={cn("font-bold", textSizeClasses[size], textClassName)}>
          Launchely
        </span>
      )}
    </div>
  );
};

// Export just the icon for use in smaller contexts
export const LaunchelyIcon = ({ className }: { className?: string }) => (
  <LogoIcon className={cn("w-8 h-8", className)} />
);
