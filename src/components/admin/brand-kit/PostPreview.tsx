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

interface GeneratedContent {
  headline: string;
  subheadline: string;
  bullets: string[];
  cta: string;
}

interface PostPreviewProps {
  content: GeneratedContent;
  templateType: string;
  slideNumber?: number;
  totalSlides?: number;
  className?: string;
}

// Cover/Hook slide template
const CoverTemplate = ({ content }: { content: GeneratedContent }) => {
  const emphasis = findEmphasisWord(content.headline);
  
  return (
    <div className="relative w-full h-full bg-[#1a1918] p-6 flex flex-col">
      {/* Asterisk decoration */}
      <GoldAsterisk className="absolute top-5 left-5 w-6 h-6" />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center pt-8">
        {/* Headline with circle emphasis */}
        <h2 className="text-white font-extrabold text-2xl leading-tight mb-3">
          {emphasis ? (
            <>
              {emphasis.before}{' '}
              <CircleEmphasis>{emphasis.word}</CircleEmphasis>
              {emphasis.after ? ` ${emphasis.after}` : ''}
            </>
          ) : (
            content.headline
          )}
        </h2>
        
        {/* Subheadline */}
        <p className="text-white/60 text-sm mb-6">
          {content.subheadline}
        </p>
        
        {/* CTA Button */}
        <div>
          <PillButton>{content.cta || "Swipe to learn →"}</PillButton>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <BrandMark />
        <SocialHandle />
      </div>
    </div>
  );
};

// Content slide template
const ContentTemplate = ({ content, slideNumber = 1 }: { content: GeneratedContent; slideNumber?: number }) => (
  <div className="relative w-full h-full bg-[#1a1918] p-6 flex flex-col">
    {/* Slide number */}
    <div className="flex justify-end mb-4">
      <SlideIndicator current={slideNumber} />
    </div>
    
    {/* Main content */}
    <div className="flex-1 flex flex-col justify-center">
      {/* Headline */}
      <h2 className="text-white font-bold text-xl leading-tight mb-3">
        {content.headline}
      </h2>
      
      {/* Supporting text */}
      <p className="text-white/70 text-sm mb-4">
        {content.subheadline}
      </p>
      
      {/* Bullet pills */}
      {content.bullets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.bullets.slice(0, 3).map((bullet, i) => (
            <PillButton key={i} variant="dark" className="text-xs px-3 py-1.5">
              {bullet.length > 25 ? bullet.slice(0, 25) + '...' : bullet}
            </PillButton>
          ))}
        </div>
      )}
    </div>
    
    {/* Footer */}
    <div className="flex items-center justify-end mt-4">
      <SocialHandle />
    </div>
  </div>
);

// CTA/Closing slide template
const CTATemplate = ({ content }: { content: GeneratedContent }) => (
  <div className="relative w-full h-full bg-[#1a1918] p-5 flex flex-col">
    {/* Main card */}
    <div className="flex-1 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-5 w-full max-w-[85%] text-center">
        <h2 className="text-[#1a1918] font-bold text-lg mb-2">
          {content.headline}
        </h2>
        <p className="text-[#1a1918]/70 text-xs mb-4">
          {content.subheadline}
        </p>
        <div className="bg-[#f5c243] text-[#1a1918] font-semibold text-sm py-2 px-4 rounded-full inline-block">
          {content.cta || "Get Started"}
        </div>
      </div>
    </div>
    
    {/* Footer decorations */}
    <div className="flex items-center justify-between mt-3">
      <GoldAsterisk className="w-5 h-5" />
      <BrandMark />
    </div>
  </div>
);

// Problem/Pain points template
const ProblemTemplate = ({ content }: { content: GeneratedContent }) => {
  const icons = [<Clock key="1" className="w-6 h-6" />, <Target key="2" className="w-6 h-6" />, <Zap key="3" className="w-6 h-6" />];
  
  return (
    <div className="relative w-full h-full bg-[#1a1918] p-5 flex flex-col">
      <GoldAsterisk className="absolute top-4 left-4 w-5 h-5" />
      
      {/* Headline */}
      <h2 className="text-white font-bold text-lg text-center mt-8 mb-6">
        {content.headline}
      </h2>
      
      {/* Problem circles */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3">
          {content.bullets.slice(0, 3).map((bullet, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#f5c243] flex items-center justify-center text-[#1a1918]">
                {icons[i]}
              </div>
              <span className="text-white text-[10px] text-center max-w-[70px] leading-tight">
                {bullet.length > 30 ? bullet.slice(0, 30) + '...' : bullet}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-end">
        <SocialHandle />
      </div>
    </div>
  );
};

// Checklist template
const ChecklistTemplate = ({ content }: { content: GeneratedContent }) => (
  <div className="relative w-full h-full bg-[#1a1918] p-5 flex flex-col">
    {/* Headline */}
    <h2 className="text-white font-bold text-lg text-center mb-4">
      {content.headline}
    </h2>
    
    {/* Checklist items */}
    <div className="flex-1 flex flex-col gap-2 justify-center">
      {content.bullets.slice(0, 4).map((bullet, i) => (
        <div key={i} className="bg-white/10 rounded-lg p-3 flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-[#f5c243] flex items-center justify-center flex-shrink-0">
            <CheckmarkIcon className="w-3 h-3 text-[#1a1918]" />
          </div>
          <span className="text-white text-xs">
            {bullet.length > 40 ? bullet.slice(0, 40) + '...' : bullet}
          </span>
        </div>
      ))}
    </div>
    
    {/* Footer */}
    <div className="flex items-center justify-between mt-3">
      <BrandMark />
      <SocialHandle />
    </div>
  </div>
);

// Comparison/Before-After template
const ComparisonTemplate = ({ content }: { content: GeneratedContent }) => (
  <div className="relative w-full h-full bg-[#1a1918] p-5 flex flex-col">
    <GoldAsterisk className="absolute top-4 right-4 w-5 h-5" />
    
    {/* Headline */}
    <h2 className="text-white font-bold text-lg text-center mb-4">
      {content.headline}
    </h2>
    
    {/* Comparison columns */}
    <div className="flex-1 flex gap-3">
      {/* Before */}
      <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
        <div className="text-red-400 text-xs font-semibold mb-2 text-center">Before</div>
        <div className="space-y-1.5">
          {content.bullets.slice(0, 2).map((bullet, i) => (
            <div key={i} className="text-white/60 text-[10px] leading-tight">
              ✗ {bullet.length > 25 ? bullet.slice(0, 25) + '...' : bullet}
            </div>
          ))}
        </div>
      </div>
      
      {/* Arrow */}
      <div className="flex items-center">
        <ArrowRight className="w-4 h-4 text-[#f5c243]" />
      </div>
      
      {/* After */}
      <div className="flex-1 bg-[#f5c243]/10 rounded-xl p-3 border border-[#f5c243]/30">
        <div className="text-[#f5c243] text-xs font-semibold mb-2 text-center">After</div>
        <div className="space-y-1.5">
          {content.bullets.slice(2, 4).map((bullet, i) => (
            <div key={i} className="text-white text-[10px] leading-tight">
              ✓ {bullet.length > 25 ? bullet.slice(0, 25) + '...' : bullet}
            </div>
          ))}
        </div>
      </div>
    </div>
    
    {/* Footer */}
    <div className="flex items-center justify-between mt-3">
      <BrandMark />
      <SocialHandle />
    </div>
  </div>
);

// Tutorial/How-to template
const TutorialTemplate = ({ content, slideNumber = 1 }: { content: GeneratedContent; slideNumber?: number }) => (
  <div className="relative w-full h-full bg-[#1a1918] p-5 flex flex-col">
    {/* Header */}
    <div className="flex items-center justify-between mb-3">
      <span className="text-[#f5c243] text-xs font-semibold">Step {slideNumber}</span>
      <SlideIndicator current={slideNumber} />
    </div>
    
    {/* Main content */}
    <div className="flex-1 flex flex-col justify-center">
      <h2 className="text-white font-bold text-lg mb-2">
        {content.headline}
      </h2>
      <p className="text-white/70 text-sm mb-4">
        {content.subheadline}
      </p>
      
      {/* Visual indicator dots */}
      <div className="flex items-center gap-6 my-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              n === slideNumber 
                ? "bg-[#f5c243] text-[#1a1918]" 
                : "bg-white/10 text-white/50"
            )}>
              {n}
            </div>
          </div>
        ))}
      </div>
    </div>
    
    {/* Footer */}
    <div className="flex items-center justify-end">
      <SocialHandle />
    </div>
  </div>
);

// Quote template
const QuoteTemplate = ({ content }: { content: GeneratedContent }) => (
  <div className="relative w-full h-full bg-[#1a1918] p-6 flex flex-col">
    {/* Large quote mark */}
    <div className="text-[#f5c243] text-6xl font-serif leading-none mb-2">"</div>
    
    {/* Quote content */}
    <div className="flex-1 flex flex-col justify-center">
      <p className="text-white font-medium text-lg italic leading-relaxed mb-4">
        {content.headline}
      </p>
      <p className="text-white/60 text-sm">
        — {content.subheadline || "Your Name"}
      </p>
    </div>
    
    {/* Footer */}
    <div className="flex items-center justify-between mt-4">
      <BrandMark />
      <SocialHandle />
    </div>
  </div>
);

export const PostPreview = ({ 
  content, 
  templateType, 
  slideNumber = 1,
  totalSlides,
  className 
}: PostPreviewProps) => {
  const renderTemplate = () => {
    switch (templateType) {
      case 'cover':
      case 'hook':
        return <CoverTemplate content={content} />;
      case 'content':
        return <ContentTemplate content={content} slideNumber={slideNumber} />;
      case 'cta':
      case 'closing':
        return <CTATemplate content={content} />;
      case 'problem':
        return <ProblemTemplate content={content} />;
      case 'checklist':
        return <ChecklistTemplate content={content} />;
      case 'comparison':
        return <ComparisonTemplate content={content} />;
      case 'tutorial':
        return <TutorialTemplate content={content} slideNumber={slideNumber} />;
      case 'quote':
        return <QuoteTemplate content={content} />;
      default:
        return <CoverTemplate content={content} />;
    }
  };

  return (
    <div className={cn(
      "aspect-square rounded-lg overflow-hidden shadow-2xl",
      className
    )}>
      {renderTemplate()}
    </div>
  );
};
