import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookMarked,
  MessageSquare,
  GitBranch,
  FileText,
  Check,
  ThumbsUp,
  Pencil,
  ArrowLeft,
  Loader2,
  Lightbulb,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlaybookData, PatternInsight } from "@/hooks/usePlaybookData";

// Phase-keyed wisdom from experienced creators
const PHASE_WISDOM: Record<string, { tip: string; source: string }[]> = {
  setup: [
    { tip: "Choosing your launch path early prevents scope creep. The path shapes everything — your pages, your emails, your content. Pick one and commit.", source: "On getting started" },
    { tip: "Most creators who struggle with launches never made a clear decision about how they'd sell. You're already ahead by choosing a path.", source: "On clarity" },
  ],
  planning: [
    { tip: "The more specific your audience, the easier every other decision becomes. Vague audiences lead to vague offers, vague messaging, and vague results.", source: "On audience clarity" },
    { tip: "You don't need to have your offer fully built to start planning. The plan shapes the build — not the other way around.", source: "On sequencing" },
    { tip: "Most launches fail in the planning phase — not because of bad execution, but because the audience and problem weren't specific enough.", source: "On foundations" },
  ],
  messaging: [
    { tip: "Your transformation statement is often more powerful than your offer description. Lead with the change, not the content.", source: "On messaging" },
    { tip: "Write your messaging for the person who almost didn't buy — not the one who was already sold. Address the hesitation directly.", source: "On objections" },
    { tip: "The best messaging sounds like something your audience would say to a friend — not like a sales page.", source: "On voice" },
  ],
  build: [
    { tip: "A simple page that clearly explains the offer, the audience, and the next step will always outperform a complex page that tries to do everything.", source: "On simplicity" },
    { tip: "Test everything before you launch — every link, every button, every email. One broken checkout can cost you the entire window.", source: "On tech" },
    { tip: "Your delivery mechanism is a trust signal. How someone receives your product affects how they feel about the purchase.", source: "On delivery" },
  ],
  content: [
    { tip: "Content that teaches builds more trust than content that sells. Save the selling for launch week — use the content phase to warm people up.", source: "On content strategy" },
    { tip: "You don't need 30 pieces of content. You need 5–7 that each do one specific job: build awareness, create curiosity, or address an objection.", source: "On volume" },
    { tip: "The best pre-launch content makes people feel understood before you've asked them for anything.", source: "On connection" },
  ],
  'pre-launch': [
    { tip: "People who heard about your offer multiple times before launch day are far more likely to buy. Repetition isn't annoying — it's necessary.", source: "On warming up" },
    { tip: "Share one small signal before you launch. It makes the announcement feel like a continuation, not a cold pitch.", source: "On preparation" },
    { tip: "If you only do one thing in pre-launch, test your tech. A broken checkout on launch day is the most common and most avoidable launch failure.", source: "On testing" },
  ],
  launch: [
    { tip: "Most sales happen on the last day of the launch window. If you close early, you leave money on the table. Send the close email.", source: "On close day" },
    { tip: "People who DM with questions are often your warmest leads. Answer them personally. One conversation can convert better than ten posts.", source: "On DMs" },
    { tip: "Don't interpret early silence as failure. Most people decide in the last 24–48 hours of a launch window.", source: "On patience" },
  ],
  'post-launch': [
    { tip: "The most important thing after a launch isn't the revenue number. It's what you learned about your audience and your offer.", source: "On reflection" },
    { tip: "Follow up with people who showed interest but didn't buy. A simple check-in — not a pitch — is often enough to convert them.", source: "On follow-up" },
    { tip: "Every launch teaches you something the next one can use. The creators who improve fastest are the ones who take time to write it down.", source: "On learning" },
  ],
};

// Insight card component
function InsightCard({ insight, delay }: { insight: PatternInsight; delay: number }) {
  const iconMap = {
    messaging: MessageSquare,
    launch_path: GitBranch,
    content: FileText,
    offer: BookMarked,
    general: Check,
  };
  const Icon = iconMap[insight.category] || Check;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {insight.text}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Section wrapper for consistent styling
function PlaybookSection({
  icon: Icon,
  title,
  children,
  helperText,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  helperText?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base font-medium text-foreground">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {children}
          {helperText && (
            <p className="text-xs text-muted-foreground/70 italic pt-2">
              {helperText}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Wisdom card component
function WisdomCard({ tip, source, delay }: { tip: string; source: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-foreground leading-relaxed">
                {tip}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{source}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Empty state for users without enough completed projects
function PlaybookEmptyState({ wisdomCards, currentPhase }: { wisdomCards: { tip: string; source: string }[]; currentPhase: string | null }) {
  const navigate = useNavigate();
  const phaseLabels: Record<string, string> = {
    setup: 'Setup', planning: 'Planning', messaging: 'Messaging', build: 'Build',
    content: 'Content', 'pre-launch': 'Pre-Launch', launch: 'Launch', 'post-launch': 'Post-Launch',
  };

  return (
    <ProjectLayout>
      <div className="max-w-7xl mx-auto px-2.5 md:px-6 py-8 space-y-8">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-4 mb-8">
            <div className="p-3 bg-violet-100/50 dark:bg-violet-900/20 rounded-xl shrink-0">
              <BookMarked className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Your Launch Playbook
              </h1>
              <p className="text-muted-foreground">
                Patterns and insights will appear here as you complete projects. In the meantime, here's what experienced creators know about where you are right now.
              </p>
            </div>
          </div>
        </motion.header>

        {wisdomCards.length > 0 && (
          <div className="space-y-3">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1"
            >
              {currentPhase && phaseLabels[currentPhase] ? `What helps in the ${phaseLabels[currentPhase]} phase` : 'What experienced creators know'}
            </motion.h2>
            <div className="space-y-3">
              {wisdomCards.map((card, i) => (
                <WisdomCard key={i} tip={card.tip} source={card.source} delay={0.15 + i * 0.05} />
              ))}
            </div>
          </div>
        )}

        {wisdomCards.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <BookMarked className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Your Playbook will grow as you launch
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Once you've completed a project, Launchely will reflect your patterns back to you here.
            </p>
          </motion.div>
        )}
      </div>
    </ProjectLayout>
  );
}

// Loading skeleton
function PlaybookSkeleton() {
  return (
    <ProjectLayout>
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="space-y-2 mb-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </ProjectLayout>
  );
}

// Reflection dialog (simple implementation)
function ReflectionPrompt() {
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionNote, setReflectionNote] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState<'accurate' | 'adjust' | null>(null);
  
  if (feedbackGiven === 'adjust' && showReflection) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-foreground">
              What feels different now?
            </p>
            <textarea
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              placeholder="Share any thoughts... (this is just for you)"
              className="w-full h-24 p-3 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowReflection(false)}>
                Done
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60">
              This note stays with you — it won't change anything in the system.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  if (feedbackGiven) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-4"
      >
        <p className="text-sm text-muted-foreground">
          Thanks for reflecting.
        </p>
      </motion.div>
    );
  }
  
  return (
    <Card className="border-border/30 bg-card/30">
      <CardContent className="pt-6 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Does this feel accurate right now?
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFeedbackGiven('accurate')}
            className="gap-2"
          >
            <ThumbsUp className="w-4 h-4" />
            Mostly
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFeedbackGiven('adjust');
              setShowReflection(true);
            }}
            className="gap-2"
          >
            <Pencil className="w-4 h-4" />
            I'd like to adjust something
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Playbook() {
  const { data, isLoading } = usePlaybookData();
  const { user } = useAuth();

  const { data: activePhaseData } = useQuery({
    queryKey: ["playbook-active-phase", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("projects")
        .select("active_phase")
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.active_phase || null;
    },
    enabled: !!user?.id,
  });

  const currentPhase = activePhaseData as string | null;
  const wisdomCards = currentPhase ? (PHASE_WISDOM[currentPhase] || []) : [];

  const phaseLabels: Record<string, string> = {
    setup: 'Setup', planning: 'Planning', messaging: 'Messaging', build: 'Build',
    content: 'Content', 'pre-launch': 'Pre-Launch', launch: 'Launch', 'post-launch': 'Post-Launch',
  };

  if (isLoading) {
    return <PlaybookSkeleton />;
  }
  
  if (!data?.hasEnoughData) {
    return <PlaybookEmptyState wisdomCards={wisdomCards} currentPhase={currentPhase} />;
  }
  
  return (
    <ProjectLayout>
      <div className="max-w-7xl mx-auto px-2.5 md:px-6 py-8 space-y-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-4 mb-8">
            <div className="p-3 bg-violet-100/50 dark:bg-violet-900/20 rounded-xl shrink-0">
              <BookMarked className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Your Launch Playbook
              </h1>
              <p className="text-muted-foreground">
                A reflection of how you tend to plan, message, and launch — based on what you've completed.
              </p>
            </div>
          </div>
        </motion.header>
        
        {/* How You Tend to Launch - Primary Section */}
        <div className="space-y-3">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1"
          >
            How you tend to launch
          </motion.h2>
          
          <div className="space-y-3">
            {data.insights.map((insight, i) => (
              <InsightCard 
                key={insight.id} 
                insight={insight} 
                delay={0.15 + i * 0.05} 
              />
            ))}
          </div>
        </div>

        {/* Phase Wisdom Section */}
        {wisdomCards.length > 0 && (
          <div className="space-y-3">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1"
            >
              {currentPhase && phaseLabels[currentPhase] ? `What helps in the ${phaseLabels[currentPhase]} phase` : 'What experienced creators know'}
            </motion.h2>
            <div className="space-y-3">
              {wisdomCards.map((card, i) => (
                <WisdomCard key={i} tip={card.tip} source={card.source} delay={0.3 + i * 0.05} />
              ))}
            </div>
          </div>
        )}
        
        {/* Messaging Patterns - Conditional */}
        {data.messagingPatterns.toneDescription && (
          <PlaybookSection
            icon={MessageSquare}
            title="Messaging Patterns"
            helperText="This isn't something you need to stick to — it's just something we've noticed."
            delay={0.3}
          >
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tone</p>
              <p className="text-sm text-foreground capitalize">
                {data.messagingPatterns.toneDescription}
              </p>
            </div>
          </PlaybookSection>
        )}
        
        {/* Launch Paths - Conditional */}
        {data.launchPaths.length > 0 && (
          <PlaybookSection
            icon={GitBranch}
            title="Launch Paths You Use"
            helperText="This isn't something you need to stick to — it's just something we've noticed."
            delay={0.35}
          >
            <div className="flex flex-wrap gap-2">
              {data.launchPaths.map((path) => (
                <Badge 
                  key={path.funnelType} 
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {path.label}
                </Badge>
              ))}
            </div>
          </PlaybookSection>
        )}
        
        {/* Content Themes - Conditional */}
        {data.contentThemes.length > 0 && (
          <PlaybookSection
            icon={FileText}
            title="Content Themes You Return To"
            helperText="This isn't something you need to stick to — it's just something we've noticed."
            delay={0.4}
          >
            <div className="flex flex-wrap gap-2">
              {data.contentThemes.map((theme) => (
                <Badge 
                  key={theme} 
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {theme}
                </Badge>
              ))}
            </div>
          </PlaybookSection>
        )}
        
        {/* What You Usually Reuse */}
        <PlaybookSection
          icon={Check}
          title="What You Usually Reuse"
          helperText="These tend to stay consistent for you."
          delay={0.45}
        >
          <div className="space-y-2">
            {[
              { key: 'audienceClarity', label: 'Audience clarity' },
              { key: 'coreProblem', label: 'Core problem' },
              { key: 'dreamOutcome', label: 'Dream outcome' },
              { key: 'offerFormat', label: 'Offer format' },
            ].map((item) => (
              <div 
                key={item.key}
                className="flex items-center gap-2 text-sm"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  data.consistentElements[item.key as keyof typeof data.consistentElements]
                    ? 'bg-primary/10 border-primary/30'
                    : 'border-border'
                }`}>
                  {data.consistentElements[item.key as keyof typeof data.consistentElements] && (
                    <Check className="w-3 h-3 text-primary" />
                  )}
                </div>
                <span className="text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </PlaybookSection>
        
        {/* Reflection Prompt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <ReflectionPrompt />
        </motion.div>
      </div>
    </ProjectLayout>
  );
}
