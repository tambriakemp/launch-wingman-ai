import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";

interface Snapshot {
  id: string;
  project_id: string;
  snapshot_type: string;
  instagram_followers?: number | null;
  facebook_followers?: number | null;
  tiktok_followers?: number | null;
  email_list_size?: number | null;
  monthly_revenue?: number | null;
  ytd_revenue?: number | null;
  confidence_level?: string | null;
  sales_count?: number | null;
  launch_revenue?: number | null;
  new_followers?: number | null;
  email_list_growth?: number | null;
  reflection_note?: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface ComparisonViewProps {
  currentProject?: Project | null;
  currentSnapshots: Snapshot[];
  allProjects: Project[];
  allSnapshots: Snapshot[];
}

export function ComparisonView({ 
  currentProject, 
  currentSnapshots, 
  allProjects, 
  allSnapshots 
}: ComparisonViewProps) {
  // Get the most recent previous launch with snapshots
  const previousProjects = allProjects
    .filter(p => p.id !== currentProject?.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const previousProjectWithSnapshots = previousProjects.find(p => {
    const snapshots = allSnapshots.filter(s => s.project_id === p.id);
    return snapshots.length > 0;
  });

  if (!previousProjectWithSnapshots) return null;

  const previousSnapshots = allSnapshots.filter(s => s.project_id === previousProjectWithSnapshots.id);
  const prevStarting = previousSnapshots.find(s => s.snapshot_type === 'starting');
  const prevEnding = previousSnapshots.find(s => s.snapshot_type === 'ending');
  
  const currentStarting = currentSnapshots.find(s => s.snapshot_type === 'starting');
  const currentEnding = currentSnapshots.find(s => s.snapshot_type === 'ending');

  // Generate comparison insights
  const insights: string[] = [];

  // Confidence comparison
  if (currentStarting?.confidence_level && prevStarting?.confidence_level) {
    const confidenceOrder = ['unsure', 'somewhat', 'confident'];
    const currentIndex = confidenceOrder.indexOf(currentStarting.confidence_level);
    const prevIndex = confidenceOrder.indexOf(prevStarting.confidence_level);
    
    if (currentIndex > prevIndex) {
      insights.push("You felt more confident going into this launch than last time.");
    } else if (currentIndex < prevIndex) {
      insights.push("You started this launch with more uncertainty, which is okay.");
    }
  }

  // Follower comparison at start
  const currentStartFollowers = 
    (currentStarting?.instagram_followers || 0) + 
    (currentStarting?.facebook_followers || 0) + 
    (currentStarting?.tiktok_followers || 0);
  
  const prevStartFollowers = 
    (prevStarting?.instagram_followers || 0) + 
    (prevStarting?.facebook_followers || 0) + 
    (prevStarting?.tiktok_followers || 0);

  if (currentStartFollowers > 0 && prevStartFollowers > 0) {
    const diff = currentStartFollowers - prevStartFollowers;
    if (diff > 0) {
      insights.push(`You started this launch with ${diff.toLocaleString()} more followers.`);
    }
  }

  // Email list comparison
  if (currentStarting?.email_list_size && prevStarting?.email_list_size) {
    const diff = currentStarting.email_list_size - prevStarting.email_list_size;
    if (diff > 0) {
      insights.push(`Your email list grew by ${diff.toLocaleString()} subscribers since your last launch.`);
    }
  }

  // Sales comparison (if both have ending snapshots)
  if (currentEnding?.sales_count && prevEnding?.sales_count) {
    const diff = currentEnding.sales_count - prevEnding.sales_count;
    if (diff > 0) {
      insights.push(`You made ${diff} more sales than your previous launch.`);
    } else if (diff < 0) {
      insights.push(`You made ${Math.abs(diff)} fewer sales, but each launch teaches you something.`);
    } else {
      insights.push("You matched your previous sales count.");
    }
  }

  // Revenue comparison
  if (currentEnding?.launch_revenue && prevEnding?.launch_revenue) {
    const diff = currentEnding.launch_revenue - prevEnding.launch_revenue;
    if (diff > 0) {
      insights.push(`You generated $${diff.toLocaleString()} more revenue from this launch.`);
    }
  }

  // Follower growth comparison
  if (currentEnding?.new_followers && prevEnding?.new_followers) {
    const diff = currentEnding.new_followers - prevEnding.new_followers;
    if (diff > 0) {
      insights.push(`You gained ${diff.toLocaleString()} more new followers during this launch.`);
    }
  }

  // Email growth comparison
  if (currentEnding?.email_list_growth && prevEnding?.email_list_growth) {
    const diff = currentEnding.email_list_growth - prevEnding.email_list_growth;
    if (diff > 0) {
      insights.push(`Your email list grew by ${diff.toLocaleString()} more subscribers this time.`);
    }
  }

  // If no specific comparisons can be made
  if (insights.length === 0) {
    insights.push("Keep recording your snapshots to unlock meaningful comparisons.");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Compared to your last launch</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="text-muted-foreground">{previousProjectWithSnapshots.name}</span>
              <ArrowRight className="w-3 h-3" />
              <span className="text-foreground font-medium">{currentProject?.name}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{insight}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
