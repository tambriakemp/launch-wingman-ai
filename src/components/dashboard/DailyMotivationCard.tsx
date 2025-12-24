import { Sparkles } from "lucide-react";

const motivationalQuotes = [
  { quote: "Done is better than perfect.", tip: "Ship your offer, then refine it based on real feedback." },
  { quote: "Your first launch won't be your best—and that's the point.", tip: "Each launch teaches you something new." },
  { quote: "Clarity beats cleverness.", tip: "Simple messaging wins every time." },
  { quote: "Progress over perfection.", tip: "Small steps forward compound into big results." },
  { quote: "Your audience doesn't need perfect—they need helpful.", tip: "Focus on solving their problem." },
  { quote: "The best time to launch was yesterday. The second best is today.", tip: "Take action on what you have." },
  { quote: "Consistency builds trust.", tip: "Show up regularly for your audience." },
  { quote: "Your transformation statement is your north star.", tip: "Let it guide every piece of content." },
  { quote: "Simplify, then simplify again.", tip: "Remove anything that doesn't serve your customer." },
  { quote: "Connection before conversion.", tip: "Build relationships first, sales follow." },
  { quote: "Every expert was once a beginner.", tip: "Your experience is valuable—share it." },
  { quote: "Focus on the one person you're helping.", tip: "Speak to them, not to everyone." },
  { quote: "Momentum matters more than motivation.", tip: "Keep moving, even when it's small." },
  { quote: "Your offer is a vehicle for transformation.", tip: "What change does it create?" },
  { quote: "Imperfect action beats perfect planning.", tip: "Launch, learn, iterate." },
  { quote: "Trust the process.", tip: "One step at a time leads to remarkable results." },
  { quote: "Your story is your superpower.", tip: "Share what makes you uniquely qualified to help." },
  { quote: "Build for humans, not algorithms.", tip: "Real connection drives lasting success." },
  { quote: "Small audiences can create big impact.", tip: "Depth over reach." },
  { quote: "Rest is part of the work.", tip: "Sustainable launches come from sustainable energy." },
  { quote: "You don't need to be everywhere.", tip: "Be excellent in one place first." },
  { quote: "Celebrate small wins.", tip: "Each step forward deserves recognition." },
  { quote: "Your funnel is a conversation.", tip: "Guide people gently toward the solution they need." },
  { quote: "Clarity attracts, confusion repels.", tip: "Make your offer easy to understand." },
  { quote: "Launch day is just the beginning.", tip: "The real work happens after you put it out there." },
  { quote: "Your ideal customer is looking for you.", tip: "Make it easy for them to find you." },
  { quote: "Energy is contagious.", tip: "Bring enthusiasm to your messaging." },
  { quote: "Constraints breed creativity.", tip: "Limitations often lead to better solutions." },
  { quote: "One clear message beats ten scattered ones.", tip: "Focus your communication." },
  { quote: "You're building something meaningful.", tip: "Keep going—your work matters." },
  { quote: "Success is a series of small decisions.", tip: "Choose well today." },
];

const getDailyQuote = () => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
};

export const DailyMotivationCard = () => {
  const daily = getDailyQuote();

  return (
    <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-foreground font-medium text-sm italic">
            "{daily.quote}"
          </p>
          <p className="text-muted-foreground text-xs">
            {daily.tip}
          </p>
        </div>
      </div>
    </div>
  );
};
