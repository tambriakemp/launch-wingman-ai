import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Rocket, Users, Sparkles, Package, Server } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import {
  GreetingHeader,
  NextBestTaskCard,
  ProgressSnapshotCard,
  UpcomingContentCard,
  StuckHelpCard,
  StuckHelpDialog,
  DailyMotivationCard,
} from "@/components/dashboard";

interface Props {
  projectId: string;
}

// Step definitions with metadata
const STEP_DEFINITIONS = [
  {
    id: "funnel-type",
    label: "Funnel Type",
    route: "funnel-type",
    icon: Rocket,
    title: "Choose your funnel type",
    whyItMatters: "Your funnel type determines the journey your customers will take. This is the foundation of your entire launch strategy.",
    estimatedMinutes: 10,
  },
  {
    id: "audience",
    label: "Audience",
    route: "audience",
    icon: Users,
    title: "Define your ideal audience",
    whyItMatters: "Understanding exactly who you're serving helps you create messaging that resonates deeply and converts better.",
    estimatedMinutes: 20,
  },
  {
    id: "transformation",
    label: "Transformation",
    route: "transformation",
    icon: Sparkles,
    title: "Craft your transformation statement",
    whyItMatters: "A clear transformation statement shows your audience the bridge from where they are to where they want to be.",
    estimatedMinutes: 15,
  },
  {
    id: "offers",
    label: "Offers",
    route: "offers",
    icon: Package,
    title: "Configure your offers",
    whyItMatters: "Your offer stack is how you deliver value. Well-structured offers make it easy for people to say yes.",
    estimatedMinutes: 25,
  },
  {
    id: "tech-stack",
    label: "Tech Stack",
    route: "tech-stack",
    icon: Server,
    title: "Set up your tech stack",
    whyItMatters: "Choosing the right tools ensures a smooth experience for your customers and makes your life easier.",
    estimatedMinutes: 15,
  },
];

const getPhaseInfo = (completedSteps: number, totalSteps: number): { phase: string; isComplete: boolean; nextPhase?: string } => {
  // Planning phase: steps 0-4 (funnel-type, audience, transformation, offers, tech-stack)
  if (completedSteps < totalSteps) {
    return { phase: "Planning", isComplete: false };
  }
  // Planning complete, messaging unlocked
  return { phase: "Planning", isComplete: true, nextPhase: "Messaging" };
};

const getReassuranceText = (phaseInfo: { phase: string; isComplete: boolean; nextPhase?: string }): string => {
  if (!phaseInfo.isComplete) {
    return "You're laying the groundwork. Take your time with each piece.";
  }
  
  if (phaseInfo.nextPhase === "Messaging") {
    return "Amazing work! Your planning phase is complete. You're ready to move into messaging.";
  }
  
  if (phaseInfo.nextPhase === "Execution") {
    return "Great progress! Your messaging is ready. Time to execute your launch.";
  }
  
  return "Amazing work! You're ready to launch.";
};

const FunnelOverviewContent = ({ projectId }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stuckModalOpen, setStuckModalOpen] = useState(false);

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch funnel
  const { data: funnel, isLoading } = useQuery({
    queryKey: ["funnel", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funnels")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch offers
  const { data: offers = [] } = useQuery({
    queryKey: ["funnel-offers", projectId],
    queryFn: async () => {
      if (!funnel?.id) return [];
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("funnel_id", funnel.id)
        .order("slot_position");
      if (error) throw error;
      return data;
    },
    enabled: !!funnel?.id,
  });

  // Fetch upcoming content
  const { data: contentData } = useQuery({
    queryKey: ["upcoming-content", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_planner")
        .select("id, title, content_type, scheduled_at, scheduled_platforms")
        .eq("project_id", projectId)
        .not("scheduled_at", "is", null)
        .gte("scheduled_at", new Date().toISOString().split("T")[0])
        .order("scheduled_at")
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calculate completion status
  const hasAudience = !!(
    funnel?.niche &&
    funnel?.target_audience &&
    funnel?.primary_pain_point &&
    funnel?.desired_outcome
  );
  const hasTransformation = !!project?.transformation_statement;
  const hasOffers = offers.some((o) => o.title);
  const hasTechStack = !!(
    funnel?.funnel_platform ||
    funnel?.email_platform ||
    funnel?.community_platform
  );

  const stepCompletionMap: Record<string, boolean> = {
    "funnel-type": !!funnel?.funnel_type,
    audience: hasAudience,
    transformation: hasTransformation,
    offers: hasOffers,
    "tech-stack": hasTechStack,
  };

  const completedSteps = Object.values(stepCompletionMap).filter(Boolean).length;
  const totalSteps = STEP_DEFINITIONS.length;

  // Find the next incomplete step
  const nextStep = STEP_DEFINITIONS.find((step) => !stepCompletionMap[step.id]) || STEP_DEFINITIONS[0];

  // Organize content by day
  const todayContent = (contentData || []).filter((item) => {
    if (!item.scheduled_at) return false;
    return isToday(parseISO(item.scheduled_at));
  });

  const tomorrowContent = (contentData || []).filter((item) => {
    if (!item.scheduled_at) return false;
    return isTomorrow(parseISO(item.scheduled_at));
  });

  const hasContent = todayContent.length > 0 || tomorrowContent.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
      <GreetingHeader
        firstName={profile?.first_name}
        projectName={project?.name}
      />

      <NextBestTaskCard
        title={nextStep.title}
        whyItMatters={nextStep.whyItMatters}
        estimatedMinutes={nextStep.estimatedMinutes}
        route={`/projects/${projectId}/${nextStep.route}`}
      />

      <ProgressSnapshotCard
        currentPhase={getPhaseInfo(completedSteps, totalSteps).phase}
        isPhaseComplete={getPhaseInfo(completedSteps, totalSteps).isComplete}
        reassuranceText={getReassuranceText(getPhaseInfo(completedSteps, totalSteps))}
      />

      {hasContent && (
        <UpcomingContentCard
          today={todayContent}
          tomorrow={tomorrowContent}
          projectId={projectId}
        />
      )}

      <StuckHelpCard onOpenModal={() => setStuckModalOpen(true)} />

      <DailyMotivationCard />

      <StuckHelpDialog
        open={stuckModalOpen}
        onOpenChange={setStuckModalOpen}
        currentTask={{
          title: nextStep.title,
          whyItMatters: nextStep.whyItMatters,
        }}
        projectContext={project?.name}
      />
    </div>
  );
};

export default FunnelOverviewContent;
