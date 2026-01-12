import { cn } from "@/lib/utils";
import { 
  GoldAsterisk, 
  CircleEmphasis, 
  PillButton, 
  BrandMark, 
  SlideIndicator, 
  SocialHandle,
  findEmphasisWord,
  CheckmarkIcon
} from "./PostPreviewElements";
import { Clock, Target, Zap, ArrowRight } from "lucide-react";

export type BackgroundVariant = "dark" | "light" | "gold";

interface GeneratedContent {
  headline: string;
  subheadline: string;
  bullets: string[];
  cta: string;
}

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

interface PostPreviewProps {
  content: GeneratedContent;
  templateType: string;
  slideNumber?: number;
  totalSlides?: number;
  className?: string;
  bgVariant?: BackgroundVariant;
  brandColors?: BrandColors;
}

const getBackgroundStyle = (bgVariant: BackgroundVariant) => {
  switch (bgVariant) {
    case "light": return "bg-white";
    case "gold": return "bg-[#f5c243]";
    default: return "bg-[#1a1918]";
  }
};

const getTextColor = (bgVariant: BackgroundVariant, type: "primary" | "secondary") => {
  if (bgVariant === "dark") {
    return type === "primary" ? "text-white" : "text-white/60";
  }
  return type === "primary" ? "text-[#1a1918]" : "text-[#1a1918]/60";
};

const getAccentColor = (bgVariant: BackgroundVariant) => {
  if (bgVariant === "gold") return "#1a1918";
  return "#f5c243";
};

// Cover/Hook slide template
const CoverTemplate = ({ content, bgVariant = "dark" }: { content: GeneratedContent; bgVariant?: BackgroundVariant }) => {
  const emphasis = findEmphasisWord(content.headline);
  const accentColor = getAccentColor(bgVariant);
  const handleVariant = bgVariant === "dark" ? "dark" : bgVariant === "gold" ? "gold" : "light";
  
  return (
    <div className={cn("relative w-full h-full p-6 flex flex-col", getBackgroundStyle(bgVariant))}>
      {/* Asterisk decoration */}
      <GoldAsterisk className="absolute top-5 left-5 w-6 h-6" style={{ color: accentColor }} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center pt-8">
        {/* Headline with circle emphasis */}
        <h2 className={cn("font-extrabold text-2xl leading-tight mb-3", getTextColor(bgVariant, "primary"))}>
          {emphasis ? (
            <>
              {emphasis.before}{' '}
              <CircleEmphasis accentColor={accentColor}>{emphasis.word}</CircleEmphasis>
              {emphasis.after ? ` ${emphasis.after}` : ''}
            </>
          ) : (
            content.headline
          )}
        </h2>
        
        {/* Subheadline */}
        <p className={cn("text-sm mb-6", getTextColor(bgVariant, "secondary"))}>
          {content.subheadline}
        </p>
        
        {/* CTA Button */}
        <div>
          <PillButton bgVariant={bgVariant}>{content.cta || "Swipe to learn →"}</PillButton>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <BrandMark />
        <SocialHandle variant={handleVariant} />
      </div>
    </div>
  );
};

// Content slide template
const ContentTemplate = ({ content, slideNumber = 1, bgVariant = "dark" }: { content: GeneratedContent; slideNumber?: number; bgVariant?: BackgroundVariant }) => {
  const handleVariant = bgVariant === "dark" ? "dark" : bgVariant === "gold" ? "gold" : "light";
  
  return (
    <div className={cn("relative w-full h-full p-6 flex flex-col", getBackgroundStyle(bgVariant))}>
      {/* Slide number */}
      <div className="flex justify-end mb-4">
        <SlideIndicator current={slideNumber} variant={handleVariant} />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Headline */}
        <h2 className={cn("font-bold text-xl leading-tight mb-3", getTextColor(bgVariant, "primary"))}>
          {content.headline}
        </h2>
        
        {/* Supporting text */}
        <p className={cn("text-sm mb-4", getTextColor(bgVariant, "secondary"))}>
          {content.subheadline}
        </p>
        
        {/* Bullet pills */}
        {content.bullets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {content.bullets.slice(0, 3).map((bullet, i) => (
              <PillButton key={i} variant="dark" bgVariant={bgVariant} className="text-xs px-3 py-1.5">
                {bullet.length > 25 ? bullet.slice(0, 25) + '...' : bullet}
              </PillButton>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-end mt-4">
        <SocialHandle variant={handleVariant} />
      </div>
    </div>
  );
};

// CTA/Closing slide template
const CTATemplate = ({ content, bgVariant = "dark" }: { content: GeneratedContent; bgVariant?: BackgroundVariant }) => {
  const accentColor = getAccentColor(bgVariant);
  const cardBg = bgVariant === "dark" ? "bg-white" : bgVariant === "gold" ? "bg-white" : "bg-[#1a1918]";
  const cardText = bgVariant === "light" ? "text-white" : "text-[#1a1918]";
  const cardSubtext = bgVariant === "light" ? "text-white/70" : "text-[#1a1918]/70";
  const btnStyle = bgVariant === "light" ? "bg-[#f5c243] text-[#1a1918]" : "bg-[#f5c243] text-[#1a1918]";
  
  return (
    <div className={cn("relative w-full h-full p-5 flex flex-col", getBackgroundStyle(bgVariant))}>
      {/* Main card */}
      <div className="flex-1 flex items-center justify-center">
        <div className={cn("rounded-2xl p-5 w-full max-w-[85%] text-center", cardBg)}>
          <h2 className={cn("font-bold text-lg mb-2", cardText)}>
            {content.headline}
          </h2>
          <p className={cn("text-xs mb-4", cardSubtext)}>
            {content.subheadline}
          </p>
          <div className={cn("font-semibold text-sm py-2 px-4 rounded-full inline-block", btnStyle)}>
            {content.cta || "Get Started"}
          </div>
        </div>
      </div>
      
      {/* Footer decorations */}
      <div className="flex items-center justify-between mt-3">
        <GoldAsterisk className="w-5 h-5" style={{ color: accentColor }} />
        <BrandMark />
      </div>
    </div>
  );
};

// Problem/Pain points template
const ProblemTemplate = ({ content, bgVariant = "dark" }: { content: GeneratedContent; bgVariant?: BackgroundVariant }) => {
  const icons = [<Clock key="1" className="w-6 h-6" />, <Target key="2" className="w-6 h-6" />, <Zap key="3" className="w-6 h-6" />];
  const accentColor = getAccentColor(bgVariant);
  const circleBg = bgVariant === "gold" ? "bg-[#1a1918]" : "bg-[#f5c243]";
  const circleText = bgVariant === "gold" ? "text-white" : "text-[#1a1918]";
  const handleVariant = bgVariant === "dark" ? "dark" : bgVariant === "gold" ? "gold" : "light";
  
  return (
    <div className={cn("relative w-full h-full p-5 flex flex-col", getBackgroundStyle(bgVariant))}>
      <GoldAsterisk className="absolute top-4 left-4 w-5 h-5" style={{ color: accentColor }} />
      
      {/* Headline */}
      <h2 className={cn("font-bold text-lg text-center mt-8 mb-6", getTextColor(bgVariant, "primary"))}>
        {content.headline}
      </h2>
      
      {/* Problem circles */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3">
          {content.bullets.slice(0, 3).map((bullet, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", circleBg, circleText)}>
                {icons[i]}
              </div>
              <span className={cn("text-[10px] text-center max-w-[70px] leading-tight", getTextColor(bgVariant, "primary"))}>
                {bullet.length > 30 ? bullet.slice(0, 30) + '...' : bullet}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-end">
        <SocialHandle variant={handleVariant} />
      </div>
    </div>
  );
};

// Checklist template
const ChecklistTemplate = ({ content, bgVariant = "dark" }: { content: GeneratedContent; bgVariant?: BackgroundVariant }) => {
  const accentColor = getAccentColor(bgVariant);
  const itemBg = bgVariant === "dark" ? "bg-white/10" : bgVariant === "gold" ? "bg-[#1a1918]/10" : "bg-[#1a1918]/5";
  const checkBg = bgVariant === "gold" ? "bg-[#1a1918]" : "bg-[#f5c243]";
  const checkText = bgVariant === "gold" ? "text-white" : "text-[#1a1918]";
  const handleVariant = bgVariant === "dark" ? "dark" : bgVariant === "gold" ? "gold" : "light";
  
  return (
    <div className={cn("relative w-full h-full p-5 flex flex-col", getBackgroundStyle(bgVariant))}>
      {/* Headline */}
      <h2 className={cn("font-bold text-lg text-center mb-4", getTextColor(bgVariant, "primary"))}>
        {content.headline}
      </h2>
      
      {/* Checklist items */}
      <div className="flex-1 flex flex-col gap-2 justify-center">
        {content.bullets.slice(0, 4).map((bullet, i) => (
          <div key={i} className={cn("rounded-lg p-3 flex items-center gap-3", itemBg)}>
            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0", checkBg)}>
              <CheckmarkIcon className={cn("w-3 h-3", checkText)} />
            </div>
            <span className={cn("text-xs", getTextColor(bgVariant, "primary"))}>
              {bullet.length > 40 ? bullet.slice(0, 40) + '...' : bullet}
            </span>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <BrandMark />
        <SocialHandle variant={handleVariant} />
      </div>
    </div>
  );
};

// Comparison/Before-After template
const ComparisonTemplate = ({ content, bgVariant = "dark" }: { content: GeneratedContent; bgVariant?: BackgroundVariant }) => {
  const accentColor = getAccentColor(bgVariant);
  const beforeBg = bgVariant === "dark" ? "bg-white/5 border-white/10" : "bg-[#1a1918]/5 border-[#1a1918]/10";
  const afterBg = bgVariant === "gold" ? "bg-[#1a1918]/10 border-[#1a1918]/30" : "bg-[#f5c243]/10 border-[#f5c243]/30";
  const afterLabel = bgVariant === "gold" ? "text-[#1a1918]" : "text-[#f5c243]";
  const handleVariant = bgVariant === "dark" ? "dark" : bgVariant === "gold" ? "gold" : "light";
  
  return (
    <div className={cn("relative w-full h-full p-5 flex flex-col", getBackgroundStyle(bgVariant))}>
      <GoldAsterisk className="absolute top-4 right-4 w-5 h-5" style={{ color: accentColor }} />
      
      {/* Headline */}
      <h2 className={cn("font-bold text-lg text-center mb-4", getTextColor(bgVariant, "primary"))}>
        {content.headline}
      </h2>
      
      {/* Comparison columns */}
      <div className="flex-1 flex gap-3">
        {/* Before */}
        <div className={cn("flex-1 rounded-xl p-3 border", beforeBg)}>
          <div className="text-red-400 text-xs font-semibold mb-2 text-center">Before</div>
          <div className="space-y-1.5">
            {content.bullets.slice(0, 2).map((bullet, i) => (
              <div key={i} className={cn("text-[10px] leading-tight", getTextColor(bgVariant, "secondary"))}>
                ✗ {bullet.length > 25 ? bullet.slice(0, 25) + '...' : bullet}
              </div>
            ))}
          </div>
        </div>
        
        {/* Arrow */}
        <div className="flex items-center">
          <ArrowRight className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        
        {/* After */}
        <div className={cn("flex-1 rounded-xl p-3 border", afterBg)}>
          <div className={cn("text-xs font-semibold mb-2 text-center", afterLabel)}>After</div>
          <div className="space-y-1.5">
            {content.bullets.slice(2, 4).map((bullet, i) => (
              <div key={i} className={cn("text-[10px] leading-tight", getTextColor(bgVariant, "primary"))}>
                ✓ {bullet.length > 25 ? bullet.slice(0, 25) + '...' : bullet}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <BrandMark />
        <SocialHandle variant={handleVariant} />
      </div>
    </div>
  );
};

// Tutorial/How-to template
const TutorialTemplate = ({ content, slideNumber = 1, bgVariant = "dark" }: { content: GeneratedContent; slideNumber?: number; bgVariant?: BackgroundVariant }) => {
  const accentColor = getAccentColor(bgVariant);
  const stepColor = bgVariant === "gold" ? "text-[#1a1918]" : "text-[#f5c243]";
  const activeDot = bgVariant === "gold" ? "bg-[#1a1918] text-white" : "bg-[#f5c243] text-[#1a1918]";
  const inactiveDot = bgVariant === "dark" ? "bg-white/10 text-white/50" : "bg-[#1a1918]/10 text-[#1a1918]/50";
  const handleVariant = bgVariant === "dark" ? "dark" : bgVariant === "gold" ? "gold" : "light";
  
  return (
    <div className={cn("relative w-full h-full p-5 flex flex-col", getBackgroundStyle(bgVariant))}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn("text-xs font-semibold", stepColor)}>Step {slideNumber}</span>
        <SlideIndicator current={slideNumber} variant={handleVariant} />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center">
        <h2 className={cn("font-bold text-lg mb-2", getTextColor(bgVariant, "primary"))}>
          {content.headline}
        </h2>
        <p className={cn("text-sm mb-4", getTextColor(bgVariant, "secondary"))}>
          {content.subheadline}
        </p>
        
        {/* Visual indicator dots */}
        <div className="flex items-center gap-6 my-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                n === slideNumber ? activeDot : inactiveDot
              )}>
                {n}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-end">
        <SocialHandle variant={handleVariant} />
      </div>
    </div>
  );
};

// Quote template
const QuoteTemplate = ({ content, bgVariant = "dark" }: { content: GeneratedContent; bgVariant?: BackgroundVariant }) => {
  const accentColor = getAccentColor(bgVariant);
  const handleVariant = bgVariant === "dark" ? "dark" : bgVariant === "gold" ? "gold" : "light";
  
  return (
    <div className={cn("relative w-full h-full p-6 flex flex-col", getBackgroundStyle(bgVariant))}>
      {/* Large quote mark */}
      <div className="text-6xl font-serif leading-none mb-2" style={{ color: accentColor }}>"</div>
      
      {/* Quote content */}
      <div className="flex-1 flex flex-col justify-center">
        <p className={cn("font-medium text-lg italic leading-relaxed mb-4", getTextColor(bgVariant, "primary"))}>
          {content.headline}
        </p>
        <p className={cn("text-sm", getTextColor(bgVariant, "secondary"))}>
          — {content.subheadline || "Your Name"}
        </p>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <BrandMark />
        <SocialHandle variant={handleVariant} />
      </div>
    </div>
  );
};

export const PostPreview = ({ 
  content, 
  templateType, 
  slideNumber = 1,
  totalSlides,
  className,
  bgVariant = "dark",
  brandColors
}: PostPreviewProps) => {
  const renderTemplate = () => {
    switch (templateType) {
      case 'cover':
      case 'hook':
        return <CoverTemplate content={content} bgVariant={bgVariant} />;
      case 'content':
        return <ContentTemplate content={content} slideNumber={slideNumber} bgVariant={bgVariant} />;
      case 'cta':
      case 'closing':
        return <CTATemplate content={content} bgVariant={bgVariant} />;
      case 'problem':
        return <ProblemTemplate content={content} bgVariant={bgVariant} />;
      case 'checklist':
        return <ChecklistTemplate content={content} bgVariant={bgVariant} />;
      case 'comparison':
        return <ComparisonTemplate content={content} bgVariant={bgVariant} />;
      case 'tutorial':
        return <TutorialTemplate content={content} slideNumber={slideNumber} bgVariant={bgVariant} />;
      case 'quote':
        return <QuoteTemplate content={content} bgVariant={bgVariant} />;
      default:
        return <CoverTemplate content={content} bgVariant={bgVariant} />;
    }
  };

  return (
    <div className={cn(
      "aspect-[4/5] rounded-lg overflow-hidden shadow-2xl",
      className
    )}>
      {renderTemplate()}
    </div>
  );
};
