import { useState, useEffect, useRef } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TalkingPointCard } from "./TalkingPointCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const [showRefreshHint, setShowRefreshHint] = useState(false);
  const { user } = useAuth();
  
  // Track previous ideas to avoid repetition (stores titles as simple identifiers)
  const previousIdeasRef = useRef<string[]>([]);

  const generateTalkingPoints = async (isRefresh = false) => {
    if (!user) return;
    
    if (isRefresh) {
      setRefreshing(true);
      setShowRefreshHint(false);
    } else {
      setLoading(true);
      // Reset previous ideas when context changes (category, phase, funnel)
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
        // Store current ideas for future refresh calls
        const currentTitles = data.talkingPoints.map((p: TalkingPoint) => p.title);
        previousIdeasRef.current = [...previousIdeasRef.current, ...currentTitles].slice(-15); // Keep last 15 to avoid too much context
        
        setTalkingPoints(data.talkingPoints);
        
        if (isRefresh) {
          setShowRefreshHint(true);
          // Hide hint after a few seconds
          setTimeout(() => setShowRefreshHint(false), 4000);
        }
      }
    } catch (error) {
      console.error("Error generating talking points:", error);
      // Fallback to default talking points if AI fails
      setTalkingPoints(getDefaultTalkingPoints(contentType, currentPhase));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    generateTalkingPoints();
  }, [contentType, currentPhase, funnelType]);

  const handleRefresh = () => {
    generateTalkingPoints(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Generating ideas...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-5">
          {showRefreshHint && (
            <p className="text-xs text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
              Here's another angle you could explore.
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs text-muted-foreground"
        >
          {refreshing ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          )}
          Refresh ideas
        </Button>
      </div>

      <div className="grid gap-3">
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
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No talking points available right now. Try refreshing or changing the content type.
          </p>
        </div>
      )}
    </div>
  );
};

// Fallback talking points if AI generation fails
function getDefaultTalkingPoints(contentType: ContentType, phase: string): TalkingPoint[] {
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
    ],
  };

  return defaults[contentType] || defaults.general;
}
