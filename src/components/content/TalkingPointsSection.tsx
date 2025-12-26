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

const MAX_VISIBLE_CARDS = 3;

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
  const { user } = useAuth();
  
  const previousIdeasRef = useRef<string[]>([]);

  const generateTalkingPoints = async (isRefresh = false) => {
    if (!user) return;
    
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

      {/* Refresh button at bottom */}
      {talkingPoints.length > 0 && (
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
