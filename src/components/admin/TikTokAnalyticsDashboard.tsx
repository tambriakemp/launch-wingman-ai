import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Video, AlertCircle, CheckCircle } from "lucide-react";
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

export function TikTokAnalyticsDashboard() {
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
            TikTok Event Log
          </CardTitle>
          <CardDescription>
            Monitor TikTok webhook events
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
