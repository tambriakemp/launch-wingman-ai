import { useNavigate } from "react-router-dom";
import { Calendar, ArrowRight, Instagram, Youtube, FileText, Mail, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  scheduled_platforms?: string[] | null;
}

interface UpcomingContentCardProps {
  today: ContentItem[];
  tomorrow: ContentItem[];
  projectId: string;
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  youtube: Youtube,
  email: Mail,
  blog: FileText,
};

const CONTENT_TYPE_ICONS: Record<string, React.ElementType> = {
  post: Megaphone,
  story: Instagram,
  reel: Youtube,
  email: Mail,
  blog: FileText,
};

const ContentItemRow = ({ item }: { item: ContentItem }) => {
  const ContentIcon = CONTENT_TYPE_ICONS[item.content_type] || FileText;
  const platform = item.scheduled_platforms?.[0];
  const PlatformIcon = platform ? PLATFORM_ICONS[platform] : null;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        <ContentIcon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{item.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">{item.content_type}</span>
          {PlatformIcon && (
            <>
              <span>•</span>
              <PlatformIcon className="w-3 h-3" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const UpcomingContentCard = ({
  today,
  tomorrow,
  projectId,
}: UpcomingContentCardProps) => {
  const navigate = useNavigate();

  if (today.length === 0 && tomorrow.length === 0) {
    return null;
  }

  return (
    <Card className="border bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider">
              Upcoming Content
            </Badge>
          </div>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="space-y-4">
          {today.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Today
              </h4>
              <div className="space-y-1">
                {today.slice(0, 3).map((item) => (
                  <ContentItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {tomorrow.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Tomorrow
              </h4>
              <div className="space-y-1">
                {tomorrow.slice(0, 3).map((item) => (
                  <ContentItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/projects/${projectId}/content`)}
        >
          View content plan
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
