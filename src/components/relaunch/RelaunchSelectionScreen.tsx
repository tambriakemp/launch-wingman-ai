import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft } from "lucide-react";

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
  onContinue: (keptSections: RelaunchSection[], revisitSections: RelaunchSection[]) => void;
  onBack: () => void;
}

const KEEP_SECTIONS: { id: RelaunchSection; label: string }[] = [
  { id: "target_audience", label: "Target audience" },
  { id: "core_problem", label: "Core problem" },
  { id: "dream_outcome", label: "Dream outcome" },
  { id: "offer_format", label: "Offer format" },
];

const REVISIT_SECTIONS: { id: RelaunchSection; label: string }[] = [
  { id: "messaging", label: "Messaging" },
  { id: "funnel_path", label: "Funnel path" },
  { id: "content_direction", label: "Content direction" },
  { id: "launch_window", label: "Launch window" },
];

export function RelaunchSelectionScreen({
  onContinue,
  onBack,
}: RelaunchSelectionScreenProps) {
  // Keep sections are pre-selected by default
  const [keptSections, setKeptSections] = useState<RelaunchSection[]>(
    KEEP_SECTIONS.map((s) => s.id)
  );
  // Revisit sections are unchecked by default
  const [revisitSections, setRevisitSections] = useState<RelaunchSection[]>([]);

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
    onContinue(keptSections, revisitSections);
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

      {/* Keep by default section */}
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
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Checkbox
                checked={keptSections.includes(section.id)}
                onCheckedChange={() => toggleKeep(section.id)}
              />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                {section.label}
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Revisit section */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            We'll gently revisit these
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            You can keep these as-is or make small adjustments.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {REVISIT_SECTIONS.map((section) => (
            <label
              key={section.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Checkbox
                checked={revisitSections.includes(section.id)}
                onCheckedChange={() => toggleRevisit(section.id)}
              />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                {section.label}
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

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
