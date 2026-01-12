import { cn } from "@/lib/utils";

// Gold asterisk decoration SVG
export const GoldAsterisk = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg 
    viewBox="0 0 40 40" 
    className={cn("w-8 h-8 text-[#f5c243]", className)}
    style={style}
    fill="currentColor"
  >
    <path d="M20 0L22.5 15L40 12.5L25 20L40 27.5L22.5 25L20 40L17.5 25L0 27.5L15 20L0 12.5L17.5 15L20 0Z" />
  </svg>
);

// Circle emphasis around a word
export const CircleEmphasis = ({ 
  children, 
  className,
  accentColor = "#f5c243"
}: { 
  children: React.ReactNode; 
  className?: string;
  accentColor?: string;
}) => (
  <span className={cn("relative inline-block", className)}>
    <svg 
      className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)]" 
      viewBox="0 0 100 50"
      preserveAspectRatio="none"
    >
      <ellipse 
        cx="50" 
        cy="25" 
        rx="48" 
        ry="22" 
        fill="none" 
        stroke={accentColor}
        strokeWidth="2"
        className="opacity-90"
      />
    </svg>
    <span className="relative z-10">{children}</span>
  </span>
);

// Pill-shaped CTA button
export const PillButton = ({ 
  children, 
  variant = "white",
  bgVariant = "dark",
  className 
}: { 
  children: React.ReactNode; 
  variant?: "white" | "gold" | "dark" | "primary";
  bgVariant?: "dark" | "light" | "gold";
  className?: string;
}) => {
  // Adjust variant based on background for contrast
  const getVariantStyles = () => {
    if (variant === "primary") {
      return "bg-[#f5c243] text-[#1a1918]";
    }
    if (bgVariant === "light") {
      return variant === "gold" 
        ? "bg-[#f5c243] text-[#1a1918]" 
        : "bg-[#1a1918] text-white";
    }
    if (bgVariant === "gold") {
      return variant === "gold" 
        ? "bg-[#1a1918] text-white" 
        : "bg-white text-[#1a1918]";
    }
    // Dark background
    return variant === "gold" 
      ? "bg-[#f5c243] text-[#1a1918]" 
      : variant === "dark"
      ? "bg-[#2a2928] text-white border border-white/20"
      : "bg-white text-[#1a1918]";
  };
  
  return (
    <div className={cn(
      "inline-flex items-center justify-center px-6 py-2.5 rounded-full font-semibold text-sm",
      getVariantStyles(),
      className
    )}>
      {children}
    </div>
  );
};

// Brand mark icon (seedling)
export const BrandMark = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 32 32"
    className={cn("w-6 h-6", className)}
  >
    <rect width="32" height="32" rx="6" fill="#f5c243" />
    <path 
      d="M16 6c-1.5 3-2 5-2 8 0 2 .5 4 2 6 1.5-2 2-4 2-6 0-3-.5-5-2-8z" 
      fill="#1a1918"
    />
    <path 
      d="M12 16c-1 1-1.5 2.5-1.5 4 1.5 0 3-.5 4-1.5" 
      fill="none" 
      stroke="#1a1918"
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M20 16c1 1 1.5 2.5 1.5 4-1.5 0-3-.5-4-1.5" 
      fill="none" 
      stroke="#1a1918"
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <circle cx="16" cy="12" r="1.5" fill="#f5c243" />
    <path 
      d="M14 22l2 4 2-4" 
      fill="none" 
      stroke="#1a1918"
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Slide indicator
export const SlideIndicator = ({ 
  current,
  variant = "dark",
  className 
}: { 
  current: number | string;
  variant?: "dark" | "light" | "gold";
  className?: string;
}) => {
  const textColor = variant === "dark" ? "text-white/60" : variant === "light" ? "text-[#1a1918]/60" : "text-[#1a1918]/70";
  return (
    <span className={cn(textColor, "text-sm font-medium", className)}>
      {typeof current === 'number' ? String(current).padStart(2, '0') : current}
    </span>
  );
};

// Social handle text
export const SocialHandle = ({ 
  handle = "@launchely.com",
  variant = "dark",
  className 
}: { 
  handle?: string;
  variant?: "dark" | "light" | "gold";
  className?: string;
}) => {
  const textColor = variant === "dark" ? "text-white/50" : variant === "light" ? "text-[#1a1918]/50" : "text-[#1a1918]/70";
  return (
    <span className={cn(textColor, "text-xs font-medium", className)}>
      {handle}
    </span>
  );
};

// Find the most impactful word to emphasize
export const findEmphasisWord = (text: string): { before: string; word: string; after: string } | null => {
  const words = text.split(' ');
  
  // Priority words to emphasize (action verbs, impactful nouns)
  const emphasisKeywords = [
    'boost', 'grow', 'increase', 'transform', 'master', 'unlock', 'discover',
    'secret', 'powerful', 'ultimate', 'free', 'easy', 'fast', 'new', 'best',
    'save', 'win', 'success', 'money', 'time', 'results', 'proven', 'simple'
  ];
  
  let emphasisIndex = -1;
  
  // First, look for priority keywords
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase().replace(/[^a-z]/g, '');
    if (emphasisKeywords.includes(word)) {
      emphasisIndex = i;
      break;
    }
  }
  
  // If no keyword found, pick a word from the middle-to-end
  if (emphasisIndex === -1 && words.length > 2) {
    emphasisIndex = Math.floor(words.length * 0.6);
  }
  
  if (emphasisIndex === -1) return null;
  
  return {
    before: words.slice(0, emphasisIndex).join(' '),
    word: words[emphasisIndex],
    after: words.slice(emphasisIndex + 1).join(' ')
  };
};

// Checkmark icon for checklists
export const CheckmarkIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={cn("w-5 h-5", className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Problem circle with icon
export const ProblemCircle = ({ 
  icon, 
  label,
  className 
}: { 
  icon: React.ReactNode;
  label: string;
  className?: string;
}) => (
  <div className={cn("flex flex-col items-center gap-2", className)}>
    <div className="w-14 h-14 rounded-full bg-[#f5c243] flex items-center justify-center text-[#1a1918]">
      {icon}
    </div>
    <span className="text-white text-xs text-center max-w-[80px]">{label}</span>
  </div>
);
