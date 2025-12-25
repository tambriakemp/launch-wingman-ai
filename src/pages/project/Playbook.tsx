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
} from "lucide-react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlaybookData, PatternInsight } from "@/hooks/usePlaybookData";

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

// Empty state for users without enough completed projects
function PlaybookEmptyState() {
  const navigate = useNavigate();
  
  return (
    <ProjectLayout>
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <BookMarked className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Your Launch Playbook will grow over time
          </h1>
          
          <p className="text-muted-foreground max-w-md mx-auto">
            Once you've completed a couple of projects, Launchely will start reflecting patterns back to you here.
          </p>
          
          <Button
            onClick={() => navigate('/app')}
            className="mt-8 gap-2"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to projects
          </Button>
        </motion.div>
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
  
  if (isLoading) {
    return <PlaybookSkeleton />;
  }
  
  if (!data?.hasEnoughData) {
    return <PlaybookEmptyState />;
  }
  
  return (
    <ProjectLayout>
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Your Launch Playbook
            </h1>
          </div>
          <p className="text-muted-foreground pl-[52px]">
            A reflection of how you tend to plan, message, and launch — based on what you've completed.
          </p>
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
