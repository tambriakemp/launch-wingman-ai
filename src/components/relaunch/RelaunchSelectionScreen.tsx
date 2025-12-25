import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type RelaunchSection = 
  | "target_audience"
  | "core_problem"
  | "dream_outcome"
  | "offer_format"
  | "messaging"
  | "funnel_path"
  | "content_direction"
  | "launch_window";

interface RelaunchSelectionScreenProps {
  onContinue: (keptSections: RelaunchSection[], revisitSections: RelaunchSection[], skipMemory: boolean) => void;
  onBack: () => void;
}

// Foundational sections - always kept by default (identity-level)
const KEEP_SECTIONS: { id: RelaunchSection; label: string; description: string }[] = [
  { id: "target_audience", label: "Target audience", description: "Who your offer serves" },
  { id: "core_problem", label: "Core problem", description: "The main struggle you solve" },
  { id: "dream_outcome", label: "Dream outcome", description: "What success looks like for them" },
  { id: "offer_format", label: "Offer format", description: "Course, service, program, etc." },
];

// Adaptive sections - often evolve, surfaced for review
const REVISIT_SECTIONS: { id: RelaunchSection; label: string; description: string }[] = [
  { id: "messaging", label: "Messaging", description: "Your core message and voice" },
  { id: "funnel_path", label: "Funnel path", description: "How you guide people to your offer" },
  { id: "content_direction", label: "Content direction", description: "Topics and themes" },
  { id: "launch_window", label: "Launch window", description: "Duration and timing" },
];

export function RelaunchSelectionScreen({
  onContinue,
  onBack,
}: RelaunchSelectionScreenProps) {
  // Keep sections are pre-selected by default (foundational memory)
  const [keptSections, setKeptSections] = useState<RelaunchSection[]>(
    KEEP_SECTIONS.map((s) => s.id)
  );
  // Revisit sections are unchecked by default (adaptive memory)
  const [revisitSections, setRevisitSections] = useState<RelaunchSection[]>([]);
  // Memory consent - defaults to ON
  const [skipMemory, setSkipMemory] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleKeep = (id: RelaunchSection) => {
    setKeptSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleRevisit = (id: RelaunchSection) => {
    setRevisitSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    onContinue(keptSections, revisitSections, skipMemory);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-xl mx-auto py-12 px-4 space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          What still feels true?
        </h1>
        <p className="text-muted-foreground">
          Choose what to keep and what to revisit
        </p>
      </div>

      {/* Keep by default section (Foundational Memory) */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            We'll keep these by default
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These usually don't change much between launches.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {KEEP_SECTIONS.map((section) => (
            <label
              key={section.id}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <Checkbox
                checked={keptSections.includes(section.id)}
                onCheckedChange={() => toggleKeep(section.id)}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {section.label}
                </span>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Revisit section (Adaptive Memory) */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            We'll gently revisit these
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Check the ones you'd like to look at again.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {REVISIT_SECTIONS.map((section) => (
            <label
              key={section.id}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <Checkbox
                checked={revisitSections.includes(section.id)}
                onCheckedChange={() => toggleRevisit(section.id)}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {section.label}
                </span>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Advanced option - subtle, no guilt */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto">
            {showAdvanced ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showAdvanced ? "Hide options" : "More options"}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Card className="border-border/30 bg-card/50">
            <CardContent className="pt-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-foreground">Start without using past projects</p>
                  <p className="text-xs text-muted-foreground">Begin fresh without any carried-over data</p>
                </div>
                <Switch
                  checked={skipMemory}
                  onCheckedChange={setSkipMemory}
                />
              </label>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* CTAs */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={handleContinue} className="gap-2">
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
