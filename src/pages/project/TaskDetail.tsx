import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, HelpCircle, Sparkles, Loader2, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StuckHelpDialog } from "@/components/dashboard/StuckHelpDialog";
import { toast } from "sonner";

// Mock data - will be replaced with real data
const MOCK_TASK = {
  id: "funnel-type",
  title: "Choose how you'll sell your offer",
  phase: "Planning",
  estimatedTimeRange: "10–20 minutes",
  whyItMatters: "This decides the path your audience will take from discovering your offer to buying it. Getting this right means your marketing efforts all work together toward one clear goal.",
  instructions: [
    "Review the three launch path options below",
    "Consider your audience size and how warm they are to your offer",
    "Think about how much time you have before your launch date",
    "Select the option that feels most aligned with your current situation",
  ],
  completionCriteria: [
    "I've reviewed all the options",
    "I understand the differences between each path",
    "I've selected the path that fits my situation",
  ],
  // Task-specific options for this selection task
  options: [
    {
      id: "waitlist",
      label: "Waitlist Launch",
      description: "Build anticipation by collecting interest before you open doors. Great if you're still refining your offer.",
    },
    {
      id: "challenge",
      label: "Challenge Launch",
      description: "Engage your audience with a free challenge that leads naturally into your paid offer.",
    },
    {
      id: "webinar",
      label: "Webinar Launch",
      description: "Teach something valuable live, then invite attendees to join your program.",
    },
  ],
};

const MOCK_PROJECT = {
  id: "123",
  name: "My First Course Launch",
};

const MOCK_USER = {
  firstName: "Sarah",
};

export default function TaskDetail() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [completedCriteria, setCompletedCriteria] = useState<string[]>([]);
  const [isStuckDialogOpen, setIsStuckDialogOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const task = MOCK_TASK;
  const project = MOCK_PROJECT;

  const handleCriteriaToggle = (criteriaText: string) => {
    setCompletedCriteria((prev) =>
      prev.includes(criteriaText)
        ? prev.filter((c) => c !== criteriaText)
        : [...prev, criteriaText]
    );
  };

  const allCriteriaComplete = completedCriteria.length === task.completionCriteria.length;

  const handleSaveAndComplete = () => {
    if (!selectedOption) {
      toast.error("Please select an option before continuing");
      return;
    }

    // In real implementation: save the selection and mark task complete
    toast.success("Great work! Task saved and marked complete.");
    navigate(`/projects/${projectId}/board`);
  };

  const handleAiAssist = async (type: "help-choose" | "examples" | "simplify") => {
    setIsAiLoading(type);
    setAiResponse(null);
    
    // Simulate AI response - in real implementation, call the edge function
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const responses: Record<string, string> = {
      "help-choose": `Based on what I know about your project, I'd suggest starting with the **Waitlist Launch**. It's the simplest path and gives you time to refine your offer based on real interest. You can always add a webinar or challenge later once you know what resonates with your audience.`,
      "examples": `Here's a real example: A fitness coach with 500 email subscribers used a Waitlist Launch to sell her first group program. She collected 89 signups in 2 weeks, then opened enrollment to her waitlist first. 34 people joined her $297 program—that's over $10K from a simple waitlist.`,
      "simplify": `Think of it this way:\n\n• **Waitlist** = "Sign up to be first in line"\n• **Challenge** = "Join my free 5-day experience"\n• **Webinar** = "Come to my free workshop"\n\nAll three work. Pick the one that feels easiest to you right now.`,
    };
    
    setAiResponse(responses[type]);
    setIsAiLoading(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header / Context Section */}
        <div className="mb-10">
          <Link
            to={`/projects/${projectId}/board`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {task.phase} Phase
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Estimated time: {task.estimatedTimeRange}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            {task.title}
          </h1>
        </div>

        {/* Why This Matters Section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Why this matters
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            {task.whyItMatters}
          </p>
        </section>

        <div className="h-px bg-border mb-10" />

        {/* What to Do Section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            What to do
          </h2>
          <ol className="space-y-3">
            {task.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <span className="text-foreground/80 pt-0.5">{instruction}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="h-px bg-border mb-10" />

        {/* Task Input Area */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Choose your path
          </h2>
          
          <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-3">
            {task.options.map((option) => (
              <div key={option.id}>
                <Label
                  htmlFor={option.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedOption === option.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                  }`}
                >
                  <RadioGroupItem value={option.id} id={option.id} className="mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-medium text-foreground">{option.label}</span>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </section>

        {/* AI Assist Section */}
        <section className="mb-10 p-5 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-medium text-foreground">Need help deciding?</h2>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAiAssist("help-choose")}
              disabled={isAiLoading !== null}
            >
              {isAiLoading === "help-choose" ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : null}
              Help me choose
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAiAssist("examples")}
              disabled={isAiLoading !== null}
            >
              {isAiLoading === "examples" ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : null}
              Show examples
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAiAssist("simplify")}
              disabled={isAiLoading !== null}
            >
              {isAiLoading === "simplify" ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : null}
              Simplify this
            </Button>
          </div>

          {aiResponse && (
            <div className="p-4 rounded-lg bg-background border border-border/50">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                {aiResponse}
              </p>
            </div>
          )}
        </section>

        <div className="h-px bg-border mb-10" />

        {/* What Done Looks Like Section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            This step is complete when:
          </h2>
          
          <div className="space-y-3">
            {task.completionCriteria.map((criteria, index) => (
              <div
                key={index}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => handleCriteriaToggle(criteria)}
              >
                <Checkbox
                  id={`criteria-${index}`}
                  checked={completedCriteria.includes(criteria)}
                  onCheckedChange={() => handleCriteriaToggle(criteria)}
                />
                <Label
                  htmlFor={`criteria-${index}`}
                  className={`text-sm cursor-pointer transition-colors ${
                    completedCriteria.includes(criteria)
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {criteria}
                </Label>
              </div>
            ))}
          </div>

          {allCriteriaComplete && selectedOption && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                You're ready to save and continue!
              </p>
            </div>
          )}
        </section>

        {/* Completion Action */}
        <section className="mb-12">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={handleSaveAndComplete}
            disabled={!selectedOption}
          >
            Save & mark complete →
          </Button>
        </section>

        <div className="h-px bg-border mb-10" />

        {/* I'm Stuck Support Section */}
        <section className="text-center pb-8">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm">Still stuck?</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Not sure how to move forward? Get help with this step.
            </p>
            <Button
              variant="outline"
              onClick={() => setIsStuckDialogOpen(true)}
            >
              I'm stuck
            </Button>
          </div>
        </section>
      </div>

      {/* Stuck Help Dialog */}
      <StuckHelpDialog
        open={isStuckDialogOpen}
        onOpenChange={setIsStuckDialogOpen}
        currentTask={{
          title: task.title,
          whyItMatters: task.whyItMatters,
        }}
        projectContext={`Project: ${project.name}`}
      />
    </div>
  );
}
