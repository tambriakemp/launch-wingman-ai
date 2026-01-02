import { useState, useEffect, useRef } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TalkingPointCard } from "./TalkingPointCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess, FREE_PLAN_LIMITS } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import type { ContentType } from "./ContentTab";

interface TalkingPoint {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
}

interface AudienceData {
  target_audience?: string | null;
  desired_outcome?: string | null;
  primary_pain_point?: string | null;
  niche?: string | null;
}

interface TalkingPointsSectionProps {
  projectId: string;
  contentType: ContentType;
  currentPhase: string;
  funnelType: string | null;
  audienceData: AudienceData | null;
  onTurnIntoPost: (talkingPoint: TalkingPoint) => void;
}

const MAX_VISIBLE_CARDS = 3;
const DAILY_LIMIT_STORAGE_KEY = 'daily_ideas_usage';

interface DailyUsage {
  date: string;
  count: number;
}

function getDailyUsage(): DailyUsage {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(DAILY_LIMIT_STORAGE_KEY);
  
  if (stored) {
    const usage = JSON.parse(stored) as DailyUsage;
    if (usage.date === today) {
      return usage;
    }
  }
  
  return { date: today, count: 0 };
}

function incrementDailyUsage(): void {
  const usage = getDailyUsage();
  usage.count += 1;
  localStorage.setItem(DAILY_LIMIT_STORAGE_KEY, JSON.stringify(usage));
}

export const TalkingPointsSection = ({
  projectId,
  contentType,
  currentPhase,
  funnelType,
  audienceData,
  onTurnIntoPost,
}: TalkingPointsSectionProps) => {
  const [talkingPoints, setTalkingPoints] = useState<TalkingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>(() => getDailyUsage());
  const { user } = useAuth();
  const { isSubscribed, hasAdminAccess, getRemainingDailyIdeas } = useFeatureAccess();
  const hasFullAccess = isSubscribed || hasAdminAccess;
  
  const previousIdeasRef = useRef<string[]>([]);
  
  const remainingIdeas = getRemainingDailyIdeas(dailyUsage.count);
  const hasReachedLimit = !hasFullAccess && remainingIdeas !== null && remainingIdeas <= 0;

  const generateTalkingPoints = async (isRefresh = false) => {
    if (!user) return;
    
    // Check daily limit for free users
    if (!hasFullAccess && isRefresh) {
      const currentUsage = getDailyUsage();
      if (currentUsage.count >= FREE_PLAN_LIMITS.dailyIdeas) {
        setDailyUsage(currentUsage);
        return;
      }
    }
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      previousIdeasRef.current = [];
    }

    try {
      const { data, error } = await supabase.functions.invoke("generate-talking-points", {
        body: {
          projectId,
          contentType,
          currentPhase,
          funnelType,
          audienceData,
          previousIdeas: isRefresh ? previousIdeasRef.current : [],
        },
      });

      if (error) throw error;

      if (data?.talkingPoints) {
        const currentTitles = data.talkingPoints.map((p: TalkingPoint) => p.title);
        previousIdeasRef.current = [...previousIdeasRef.current, ...currentTitles].slice(-15);
        
        // Limit to max visible cards
        setTalkingPoints(data.talkingPoints.slice(0, MAX_VISIBLE_CARDS));
        
        // Increment usage for free users on refresh
        if (!hasFullAccess && isRefresh) {
          incrementDailyUsage();
          setDailyUsage(getDailyUsage());
        }
      }
    } catch (error) {
      console.error("Error generating talking points:", error);
      setTalkingPoints(getDefaultTalkingPoints(contentType).slice(0, MAX_VISIBLE_CARDS));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    generateTalkingPoints();
  }, [contentType, currentPhase, funnelType]);

  const handleRefresh = () => {
    if (hasReachedLimit) return;
    generateTalkingPoints(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Finding ideas for you...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards with increased spacing */}
      <div className="space-y-4">
        {talkingPoints.map((point) => (
          <TalkingPointCard
            key={point.id}
            id={point.id}
            title={point.title}
            description={point.description}
            projectId={projectId}
            contentType={contentType}
            phase={currentPhase}
            funnelType={funnelType}
            onTurnIntoPost={() => onTurnIntoPost(point)}
          />
        ))}
      </div>

      {talkingPoints.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No ideas right now. Try refreshing or changing the filter.
          </p>
        </div>
      )}

      {/* Daily limit warning for free users */}
      {!hasFullAccess && remainingIdeas !== null && (
        <div className="text-center">
          {hasReachedLimit ? (
            <UpgradePrompt
              feature="unlimited_ideas"
              variant="inline"
              customMessage="You've used all 5 daily ideas. Upgrade for unlimited."
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              {remainingIdeas} idea refresh{remainingIdeas !== 1 ? 'es' : ''} remaining today
            </p>
          )}
        </div>
      )}

      {/* Refresh button at bottom */}
      {talkingPoints.length > 0 && !hasReachedLimit && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh ideas
          </Button>
        </div>
      )}
    </div>
  );
};

function getDefaultTalkingPoints(contentType: ContentType): TalkingPoint[] {
  const defaults: Record<ContentType, TalkingPoint[]> = {
    general: [
      {
        id: "1",
        title: "Share your journey",
        description: "Talk about why you started this project and what drives you.",
        contentType: "general",
      },
      {
        id: "2",
        title: "Address a common question",
        description: "Answer something your audience frequently asks about.",
        contentType: "general",
      },
      {
        id: "3",
        title: "Share a quick win",
        description: "Give your audience a simple tip they can use today.",
        contentType: "general",
      },
    ],
    stories: [
      {
        id: "1",
        title: "A moment that changed your perspective",
        description: "Share a story about when you realized something important.",
        contentType: "stories",
      },
      {
        id: "2",
        title: "Behind the work",
        description: "Show what a day in your world looks like.",
        contentType: "stories",
      },
      {
        id: "3",
        title: "A lesson you learned the hard way",
        description: "Share a mistake that taught you something valuable.",
        contentType: "stories",
      },
    ],
    offer: [
      {
        id: "1",
        title: "The problem you solve",
        description: "Explain the challenge your audience faces in simple terms.",
        contentType: "offer",
      },
      {
        id: "2",
        title: "What makes your approach different",
        description: "Share what's unique about how you help people.",
        contentType: "offer",
      },
      {
        id: "3",
        title: "Who this is for",
        description: "Help people self-identify if they're a good fit.",
        contentType: "offer",
      },
    ],
    "behind-the-scenes": [
      {
        id: "1",
        title: "Work in progress",
        description: "Show something you're currently working on.",
        contentType: "behind-the-scenes",
      },
      {
        id: "2",
        title: "Your workspace",
        description: "Share a glimpse of where you create.",
        contentType: "behind-the-scenes",
      },
      {
        id: "3",
        title: "Tools you love",
        description: "Share resources that help you do your best work.",
        contentType: "behind-the-scenes",
      },
    ],
  };

  return defaults[contentType] || defaults.general;
}
