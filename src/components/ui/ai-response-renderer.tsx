import { Target, Heart, User, Lightbulb, Sparkles } from "lucide-react";

interface ExampleItem {
  type: string;
  content: string;
}

interface StructuredResponse {
  intro?: string;
  examples?: ExampleItem[];
  conclusion?: string;
}

// Type-to-style mapping
const typeStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
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

// Fallback colors for unknown types
const fallbackStyles = [
  { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-400", icon: <Target className="w-3.5 h-3.5" /> },
];

function getStyleForType(type: string, index: number) {
  if (typeStyles[type]) {
    return typeStyles[type];
  }
  return fallbackStyles[index % fallbackStyles.length];
}

function ExampleCard({ example, index }: { example: ExampleItem; index: number }) {
  const style = getStyleForType(example.type, index);
  
  return (
    <div className={`p-4 rounded-lg ${style.bg} border border-border/30`}>
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${style.bg} ${style.text} text-xs font-medium mb-3`}>
        {style.icon}
        {example.type}
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">
        {example.content}
      </p>
    </div>
  );
}

function parseStructuredResponse(response: string): StructuredResponse | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Try direct JSON parse
    const parsed = JSON.parse(response);
    if (parsed.examples && Array.isArray(parsed.examples)) {
      return parsed;
    }
    return null;
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
  // Try to parse as structured response for examples
  if (mode === 'examples') {
    const structured = parseStructuredResponse(response);
    
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
              <ExampleCard key={index} example={example} index={index} />
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
  
  // Fallback: render as formatted plain text
  return (
    <div className="p-4 rounded-lg bg-background border border-border/50">
      {formatPlainText(response)}
    </div>
  );
}
