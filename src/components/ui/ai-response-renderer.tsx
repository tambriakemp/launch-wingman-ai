import { Target, Heart, User, Lightbulb, Sparkles, CheckCircle, AlertCircle, ArrowRight, Zap, HelpCircle, MessageCircle, Edit3 } from "lucide-react";

interface ExampleItem {
  type: string;
  content: string;
}

interface StructuredExamplesResponse {
  intro?: string;
  examples?: ExampleItem[];
  conclusion?: string;
}

// Legacy help_me_choose format (CLEAR mode only)
interface StructuredChooseResponse {
  intro?: string;
  recommendation?: {
    title: string;
    content: string;
  };
  reasoning?: ExampleItem[];
  conclusion?: string;
}

// New Help Me Choose formats based on input state
interface PromptingModeResponse {
  mode: 'prompting';
  opening: string;
  clarifyingQuestions: string[];
  exampleDirections: Array<{ label: string; content: string }>;
  closing: string;
}

interface RefinementModeResponse {
  mode: 'refinement';
  reflection: string;
  guidance: string;
  refinementOptions: string[];
  exampleRefinements: Array<{ label: string; content: string }>;
  closing: string;
}

interface RecommendationModeResponse {
  mode: 'recommendation';
  validation: string;
  suggestedRefinement: { content: string };
  whyThisWorks: string[];
  closing: string;
}

type HelpMeChooseResponse = PromptingModeResponse | RefinementModeResponse | RecommendationModeResponse | StructuredChooseResponse;

// New Simplify response format (rewriting only)
interface NewSimplifyResponse {
  opening: string;
  simplifiedText: string;
  note?: string;
}

// Legacy Simplify response format (deprecated)
interface LegacySimplifyResponse {
  intro?: string;
  mainPoint?: {
    title: string;
    content: string;
  };
  steps?: ExampleItem[];
  conclusion?: string;
}

// Type-to-style mapping for examples
const exampleTypeStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  "Results-Focused": { 
    bg: "bg-cyan-50 dark:bg-cyan-950/30", 
    text: "text-cyan-700 dark:text-cyan-400",
    icon: <Target className="w-3.5 h-3.5" />
  },
  "Emotion-Focused": { 
    bg: "bg-pink-50 dark:bg-pink-950/30", 
    text: "text-pink-700 dark:text-pink-400",
    icon: <Heart className="w-3.5 h-3.5" />
  },
  "Identity-Focused": { 
    bg: "bg-blue-50 dark:bg-blue-950/30", 
    text: "text-blue-700 dark:text-blue-400",
    icon: <User className="w-3.5 h-3.5" />
  },
};

// Styles for help_me_choose reasoning
const chooseTypeStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  "Why This Works": { 
    bg: "bg-emerald-50 dark:bg-emerald-950/30", 
    text: "text-emerald-700 dark:text-emerald-400",
    icon: <CheckCircle className="w-3.5 h-3.5" />
  },
  "What to Consider": { 
    bg: "bg-amber-50 dark:bg-amber-950/30", 
    text: "text-amber-700 dark:text-amber-400",
    icon: <AlertCircle className="w-3.5 h-3.5" />
  },
};

// Fallback colors for unknown types
const fallbackStyles = [
  { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-400", icon: <Target className="w-3.5 h-3.5" /> },
];

// Step card colors for simplify mode
const stepCardColors = [
  { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-400", numBg: "bg-violet-200 dark:bg-violet-800" },
  { bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-700 dark:text-indigo-400", numBg: "bg-indigo-200 dark:bg-indigo-800" },
  { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", numBg: "bg-blue-200 dark:bg-blue-800" },
  { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-400", numBg: "bg-purple-200 dark:bg-purple-800" },
];

// Example direction card colors
const exampleCardColors = [
  { bg: "bg-sky-50 dark:bg-sky-950/30", text: "text-sky-700 dark:text-sky-400", border: "border-sky-200 dark:border-sky-800/50" },
  { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800/50" },
  { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800/50" },
];

function getStyleForType(type: string, index: number, styleMap: Record<string, { bg: string; text: string; icon: React.ReactNode }>) {
  if (styleMap[type]) {
    return styleMap[type];
  }
  return fallbackStyles[index % fallbackStyles.length];
}

function StepCard({ stepNumber, title, content }: { stepNumber: number; title: string; content: string }) {
  const colors = stepCardColors[(stepNumber - 1) % stepCardColors.length];
  
  return (
    <div className={`p-4 rounded-lg ${colors.bg} border border-border/30`}>
      <div className="flex items-center gap-2.5 mb-2">
        <span className={`w-5 h-5 rounded-full ${colors.numBg} ${colors.text} flex items-center justify-center text-xs font-bold`}>
          {stepNumber}
        </span>
        <h4 className={`font-medium ${colors.text} text-sm`}>{title}</h4>
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed pl-[1.875rem]">
        {content}
      </p>
    </div>
  );
}

function ItemCard({ item, index, styleMap }: { item: ExampleItem; index: number; styleMap: Record<string, { bg: string; text: string; icon: React.ReactNode }> }) {
  const style = getStyleForType(item.type, index, styleMap);
  
  return (
    <div className={`p-4 rounded-lg ${style.bg} border border-border/30`}>
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${style.bg} ${style.text} text-xs font-medium mb-3`}>
        {style.icon}
        {item.type}
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">
        {item.content}
      </p>
    </div>
  );
}

function RecommendationCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
        <Zap className="w-3.5 h-3.5" />
        {title}
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">
        {content}
      </p>
    </div>
  );
}

function MainPointCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="p-4 rounded-lg bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200/50 dark:border-violet-800/30">
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400 text-xs font-medium mb-3">
        <ArrowRight className="w-3.5 h-3.5" />
        {title}
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">
        {content}
      </p>
    </div>
  );
}

// New components for Help Me Choose modes
function QuestionCard({ question, index }: { question: string; index: number }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/30">
      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <HelpCircle className="w-3 h-3 text-primary" />
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">{question}</p>
    </div>
  );
}

function ExampleDirectionCard({ label, content, index }: { label: string; content: string; index: number }) {
  const colors = exampleCardColors[index % exampleCardColors.length];
  
  return (
    <div className={`p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/50 ${colors.text} text-xs font-medium mb-2`}>
        <Lightbulb className="w-3 h-3" />
        {label}
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">
        {content}
      </p>
    </div>
  );
}

function ReflectionCard({ content }: { content: string }) {
  return (
    <div className="p-4 rounded-lg bg-muted/40 border border-border/50">
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium mb-2">
        <MessageCircle className="w-3 h-3" />
        Your input
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed italic">
        {content}
      </p>
    </div>
  );
}

function RefinementOptionCard({ content, index }: { content: string; index: number }) {
  const colors = exampleCardColors[index % exampleCardColors.length];
  
  return (
    <div className={`p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/50 ${colors.text} text-xs font-medium mb-2`}>
        <Edit3 className="w-3 h-3" />
        Option {String.fromCharCode(65 + index)}
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">
        {content}
      </p>
    </div>
  );
}

function SuggestedRefinementCard({ content }: { content: string }) {
  return (
    <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-3">
        <Edit3 className="w-3.5 h-3.5" />
        Suggested refinement
      </div>
      <p className="text-sm text-foreground font-medium leading-relaxed">
        "{content}"
      </p>
    </div>
  );
}

function WhyThisWorksList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Why this works</p>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-foreground/80">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function parseStructuredResponse(response: string): Record<string, unknown> | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Try direct JSON parse
    return JSON.parse(response);
  } catch {
    return null;
  }
}

function formatPlainText(text: string): React.ReactNode {
  // Split by numbered list items or double newlines
  const lines = text.split(/\n\n|\n(?=\d+\.)/);
  
  return lines.map((line, index) => {
    // Convert **text** to bold
    const formatted = line.split(/\*\*(.*?)\*\*/g).map((part, i) => 
      i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
    );
    
    return (
      <p key={index} className="text-sm text-foreground/80 leading-relaxed mb-3 last:mb-0">
        {formatted}
      </p>
    );
  });
}

// Helper to check if parsed response is a new help_me_choose format
function isNewHelpMeChooseFormat(parsed: unknown): parsed is PromptingModeResponse | RefinementModeResponse | RecommendationModeResponse {
  if (!parsed || typeof parsed !== 'object') return false;
  const obj = parsed as Record<string, unknown>;
  return 'mode' in obj && ['prompting', 'refinement', 'recommendation'].includes(obj.mode as string);
}

interface AIResponseRendererProps {
  response: string;
  mode?: string;
}

export function AIResponseRenderer({ response, mode }: AIResponseRendererProps) {
  const parsed = parseStructuredResponse(response);

  // Handle "examples" mode
  if (mode === 'examples' && parsed) {
    const structured = parsed as StructuredExamplesResponse;
    if (structured?.examples && structured.examples.length > 0) {
      return (
        <div className="space-y-4">
          {structured.intro && (
            <p className="text-sm text-foreground/80 leading-relaxed">
              {structured.intro}
            </p>
          )}
          
          <div className="space-y-3">
            {structured.examples.map((example, index) => (
              <ItemCard key={index} item={example} index={index} styleMap={exampleTypeStyles} />
            ))}
          </div>
          
          {structured.conclusion && (
            <p className="text-sm text-muted-foreground italic">
              {structured.conclusion}
            </p>
          )}
        </div>
      );
    }
  }

  // Handle "help_me_choose" mode with new format detection
  if (mode === 'help_me_choose' && parsed) {
    // Check for new modal-based format
    if (isNewHelpMeChooseFormat(parsed)) {
      // PROMPTING MODE (Empty input)
      if (parsed.mode === 'prompting') {
        const data = parsed as PromptingModeResponse;
        return (
          <div className="space-y-4">
            <p className="text-sm text-foreground/80 leading-relaxed">
              {data.opening}
            </p>
            
            {data.clarifyingQuestions && data.clarifyingQuestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  A question to help you start
                </p>
                <div className="space-y-2">
                  {data.clarifyingQuestions.map((question, index) => (
                    <QuestionCard key={index} question={question} index={index} />
                  ))}
                </div>
              </div>
            )}
            
            {data.exampleDirections && data.exampleDirections.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Example starting points (pick one to adapt)
                </p>
                <div className="space-y-3">
                  {data.exampleDirections.map((example, index) => (
                    <ExampleDirectionCard 
                      key={index} 
                      label={example.label} 
                      content={example.content} 
                      index={index} 
                    />
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground italic">
              {data.closing}
            </p>
          </div>
        );
      }
      
      // REFINEMENT MODE (Partial input)
      if (parsed.mode === 'refinement') {
        const data = parsed as RefinementModeResponse;
        return (
          <div className="space-y-4">
            <ReflectionCard content={data.reflection.replace(/^You mentioned:\s*"?|"?$/g, '')} />
            
            <p className="text-sm text-foreground/80 leading-relaxed">
              {data.guidance}
            </p>
            
            {data.refinementOptions && data.refinementOptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  You could narrow this by
                </p>
                <ul className="space-y-1.5 pl-1">
                  {data.refinementOptions.map((option, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-foreground/80">
                      <span className="text-muted-foreground">•</span>
                      <span>{option}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.exampleRefinements && data.exampleRefinements.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Example refinements
                </p>
                <div className="space-y-3">
                  {data.exampleRefinements.map((refinement, index) => (
                    <RefinementOptionCard 
                      key={index} 
                      content={refinement.content} 
                      index={index} 
                    />
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground italic">
              {data.closing}
            </p>
          </div>
        );
      }
      
      // RECOMMENDATION MODE (Clear input)
      if (parsed.mode === 'recommendation') {
        const data = parsed as RecommendationModeResponse;
        return (
          <div className="space-y-4">
            <p className="text-sm text-foreground/80 leading-relaxed">
              {data.validation}
            </p>
            
            {data.suggestedRefinement && (
              <SuggestedRefinementCard content={data.suggestedRefinement.content} />
            )}
            
            {data.whyThisWorks && data.whyThisWorks.length > 0 && (
              <WhyThisWorksList items={data.whyThisWorks} />
            )}
            
            <p className="text-sm text-muted-foreground italic">
              {data.closing}
            </p>
          </div>
        );
      }
    }
    
    // Legacy format (fallback)
    const structured = parsed as StructuredChooseResponse;
    if (structured?.recommendation || structured?.reasoning) {
      return (
        <div className="space-y-4">
          {structured.intro && (
            <p className="text-sm text-foreground/80 leading-relaxed">
              {structured.intro}
            </p>
          )}
          
          {structured.recommendation && (
            <RecommendationCard 
              title={structured.recommendation.title} 
              content={structured.recommendation.content} 
            />
          )}
          
          {structured.reasoning && structured.reasoning.length > 0 && (
            <div className="space-y-3">
              {structured.reasoning.map((item, index) => (
                <ItemCard key={index} item={item} index={index} styleMap={chooseTypeStyles} />
              ))}
            </div>
          )}
          
          {structured.conclusion && (
            <p className="text-sm text-muted-foreground italic">
              {structured.conclusion}
            </p>
          )}
        </div>
      );
    }
  }

  // Handle "simplify" mode
  if (mode === 'simplify' && parsed) {
    // Check for new simplify format
    const hasSimplifiedText = 'simplifiedText' in parsed && typeof (parsed as Record<string, unknown>).simplifiedText === 'string';
    if (hasSimplifiedText) {
      const data = parsed as unknown as NewSimplifyResponse;
      return (
        <div className="space-y-4">
          <p className="text-sm text-foreground/80 leading-relaxed">
            {data.opening}
          </p>
          
          <div className="p-4 rounded-lg bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30 border border-sky-200/50 dark:border-sky-800/30">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {data.simplifiedText}
            </p>
          </div>
          
          {data.note && (
            <p className="text-sm text-muted-foreground italic">
              {data.note}
            </p>
          )}
        </div>
      );
    }
    
    // Legacy format fallback
    const structured = parsed as LegacySimplifyResponse;
    if (structured?.mainPoint || structured?.steps) {
      return (
        <div className="space-y-4">
          {structured.intro && (
            <p className="text-sm text-foreground/80 leading-relaxed">
              {structured.intro}
            </p>
          )}
          
          {structured.mainPoint && (
            <MainPointCard 
              title={structured.mainPoint.title} 
              content={structured.mainPoint.content} 
            />
          )}
          
          {structured.steps && structured.steps.length > 0 && (
            <div className="space-y-3">
              {structured.steps.map((step, index) => (
                <StepCard key={index} stepNumber={index + 1} title={step.type} content={step.content} />
              ))}
            </div>
          )}
          
          {structured.conclusion && (
            <p className="text-sm text-muted-foreground italic">
              {structured.conclusion}
            </p>
          )}
        </div>
      );
    }
  }
  
  // Fallback: render as formatted plain text
  return (
    <div className="p-4 rounded-lg bg-background border border-border/50">
      {formatPlainText(response)}
    </div>
  );
}
