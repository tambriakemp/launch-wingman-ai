import { Target, Heart, User, Lightbulb, Sparkles, CheckCircle, AlertCircle, ArrowRight, Zap } from "lucide-react";

interface ExampleItem {
  type: string;
  content: string;
}

interface StructuredExamplesResponse {
  intro?: string;
  examples?: ExampleItem[];
  conclusion?: string;
}

interface StructuredChooseResponse {
  intro?: string;
  recommendation?: {
    title: string;
    content: string;
  };
  reasoning?: ExampleItem[];
  conclusion?: string;
}

interface StructuredSimplifyResponse {
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

// Styles for simplify steps
const simplifyTypeStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  "Step 1": { 
    bg: "bg-violet-50 dark:bg-violet-950/30", 
    text: "text-violet-700 dark:text-violet-400",
    icon: <span className="w-3.5 h-3.5 text-xs font-bold">1</span>
  },
  "Step 2": { 
    bg: "bg-indigo-50 dark:bg-indigo-950/30", 
    text: "text-indigo-700 dark:text-indigo-400",
    icon: <span className="w-3.5 h-3.5 text-xs font-bold">2</span>
  },
  "Step 3": { 
    bg: "bg-blue-50 dark:bg-blue-950/30", 
    text: "text-blue-700 dark:text-blue-400",
    icon: <span className="w-3.5 h-3.5 text-xs font-bold">3</span>
  },
};

// Fallback colors for unknown types
const fallbackStyles = [
  { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-400", icon: <Target className="w-3.5 h-3.5" /> },
];

function getStyleForType(type: string, index: number, styleMap: Record<string, { bg: string; text: string; icon: React.ReactNode }>) {
  if (styleMap[type]) {
    return styleMap[type];
  }
  return fallbackStyles[index % fallbackStyles.length];
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

  // Handle "help_me_choose" mode
  if (mode === 'help_me_choose' && parsed) {
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
    const structured = parsed as StructuredSimplifyResponse;
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
              {structured.steps.map((item, index) => (
                <ItemCard key={index} item={item} index={index} styleMap={simplifyTypeStyles} />
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
