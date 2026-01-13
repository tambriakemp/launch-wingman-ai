import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Video, MessageCircle, Heart, Share2, Users, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface WebhookLog {
  id: string;
  provider: string;
  event_type: string | null;
  payload: Record<string, unknown> | null;
  status: string | null;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
}

interface EventStats {
  event_type: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

export function TikTokAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: webhookLogs, isLoading, refetch } = useQuery({
    queryKey: ["tiktok-webhook-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_logs")
        .select("*")
        .eq("provider", "tiktok")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as WebhookLog[];
    },
  });

  const eventStats: EventStats[] = [
    {
      event_type: "video.publish.complete",
      count: webhookLogs?.filter(l => l.event_type === "video.publish.complete").length || 0,
      icon: <Video className="h-4 w-4" />,
      color: "bg-green-500/10 text-green-500",
    },
    {
      event_type: "video.publish.failed",
      count: webhookLogs?.filter(l => l.event_type === "video.publish.failed").length || 0,
      icon: <AlertCircle className="h-4 w-4" />,
      color: "bg-red-500/10 text-red-500",
    },
    {
      event_type: "comment.create",
      count: webhookLogs?.filter(l => l.event_type === "comment.create").length || 0,
      icon: <MessageCircle className="h-4 w-4" />,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      event_type: "like.create",
      count: webhookLogs?.filter(l => l.event_type === "like.create").length || 0,
      icon: <Heart className="h-4 w-4" />,
      color: "bg-pink-500/10 text-pink-500",
    },
    {
      event_type: "share.create",
      count: webhookLogs?.filter(l => l.event_type === "share.create").length || 0,
      icon: <Share2 className="h-4 w-4" />,
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      event_type: "follow",
      count: webhookLogs?.filter(l => l.event_type === "follow").length || 0,
      icon: <Users className="h-4 w-4" />,
      color: "bg-orange-500/10 text-orange-500",
    },
  ];

  const getEventBadgeVariant = (eventType: string | null) => {
    switch (eventType) {
      case "video.publish.complete":
        return "default";
      case "video.publish.failed":
        return "destructive";
      case "authorize":
      case "deauthorize":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string | null) => {
    if (status === "received") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            TikTok Analytics
          </CardTitle>
          <CardDescription>
            Monitor TikTok webhook events, video performance, and engagement
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Event Log</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {eventStats.map((stat) => (
                <Card key={stat.event_type} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {stat.event_type.replace(".", " ").replace("_", " ")}
                  </div>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : webhookLogs?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No TikTok webhook events yet. Events will appear here when TikTok sends notifications.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {webhookLogs?.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <Badge variant={getEventBadgeVariant(log.event_type)}>
                            {log.event_type || "unknown"}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Payload</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : webhookLogs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No events recorded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    webhookLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{getStatusIcon(log.status)}</TableCell>
                        <TableCell>
                          <Badge variant={getEventBadgeVariant(log.event_type)}>
                            {log.event_type || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <code className="text-xs bg-muted p-1 rounded block truncate">
                            {JSON.stringify(log.payload)?.slice(0, 100)}...
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), "MMM d, yyyy h:mm:ss a")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="videos">
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Video performance tracking will be populated as videos are published through TikTok.</p>
                  <p className="text-sm mt-2">
                    Events like <code>video.publish.complete</code> will show detailed video analytics here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
