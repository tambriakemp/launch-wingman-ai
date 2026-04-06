import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CalendarDays, Loader2, Link2, Unlink, Apple, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";

interface CalendarConnection {
  id: string;
  provider: string;
  account_email: string | null;
  feed_token: string | null;
  created_at: string;
}

const PROVIDERS = [
  {
    id: "google",
    name: "Google Calendar",
    description: "Connect via Google account",
    color: "#4285F4",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: "microsoft",
    name: "Outlook Calendar",
    description: "Connect via Microsoft account",
    color: "#0078D4",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z" fill="#0078D4"/>
      </svg>
    ),
  },
  {
    id: "apple",
    name: "Apple Calendar",
    description: "Subscribe via calendar feed",
    color: "#333",
    icon: <Apple className="w-5 h-5" />,
  },
];

export const CalendarIntegrationsCard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);
  const [appleDialogOpen, setAppleDialogOpen] = useState(false);
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatingFeed, setGeneratingFeed] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["calendar-connections"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("calendar_connections")
        .select("id, provider, account_email, feed_token, created_at")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []) as CalendarConnection[];
    },
    enabled: !!user,
  });

  const getConnection = (provider: string) => connections.find((c) => c.provider === provider);

  const handleConnect = async (provider: string) => {
    if (provider === "apple") {
      const existing = getConnection("apple");
      if (existing?.feed_token) {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        setFeedUrl(`https://${projectId}.supabase.co/functions/v1/calendar-feed?token=${existing.feed_token}`);
      }
      setAppleDialogOpen(true);
      if (!existing?.feed_token) {
        await generateAppleFeed();
      }
      return;
    }

    setConnectingProvider(provider);
    try {
      const fnName = provider === "google" ? "google-calendar-auth-start" : "microsoft-calendar-auth-start";
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast.error("Please sign in first");
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${fnName}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      const result = await res.json();
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Failed to start authentication");
      }
    } catch (err) {
      console.error("Connect error:", err);
      toast.error("Failed to connect calendar");
    } finally {
      setConnectingProvider(null);
    }
  };

  const generateAppleFeed = async () => {
    if (!user) return;
    setGeneratingFeed(true);
    try {
      const feedToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

      const { error } = await supabase.from("calendar_connections").upsert(
        {
          user_id: user.id,
          provider: "apple",
          feed_token: feedToken,
          account_email: user.email || null,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "user_id,provider" }
      );

      if (error) throw error;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      setFeedUrl(`https://${projectId}.supabase.co/functions/v1/calendar-feed?token=${feedToken}`);
      queryClient.invalidateQueries({ queryKey: ["calendar-connections"] });
    } catch (err) {
      console.error("Feed generation error:", err);
      toast.error("Failed to generate calendar feed");
    } finally {
      setGeneratingFeed(false);
    }
  };

  const handleCopyFeedUrl = async () => {
    if (!feedUrl) return;
    await navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    toast.success("Feed URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBulkSync = async () => {
    setBulkSyncing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast.error("Please sign in first");
        return;
      }
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/bulk-sync-calendar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const result = await res.json();
      if (result.success) {
        toast.success(result.message || `Synced ${result.synced} task(s)`);
      } else {
        toast.error(result.error || "Sync failed");
      }
    } catch (err) {
      console.error("Bulk sync error:", err);
      toast.error("Failed to sync tasks");
    } finally {
      setBulkSyncing(false);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!user) return;
    setDisconnectingProvider(provider);
    try {
      const conn = getConnection(provider);
      if (conn) {
        await supabase.from("calendar_sync_mappings").delete().eq("calendar_connection_id", conn.id);
      }
      await supabase.from("calendar_connections").delete().eq("user_id", user.id).eq("provider", provider);
      toast.success(`${provider === "google" ? "Google" : provider === "microsoft" ? "Outlook" : "Apple"} Calendar disconnected`);
      queryClient.invalidateQueries({ queryKey: ["calendar-connections"] });
      if (provider === "apple") {
        setFeedUrl(null);
      }
    } catch (err) {
      toast.error("Failed to disconnect");
    } finally {
      setDisconnectingProvider(null);
    }
  };

  return (
    <>
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Calendar Sync</CardTitle>
              <CardDescription>Sync your planner tasks to external calendars</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PROVIDERS.map((provider) => {
              const conn = getConnection(provider.id);
              const isConnecting = connectingProvider === provider.id;
              const isDisconnecting = disconnectingProvider === provider.id;

              return (
                <div key={provider.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${provider.color}15` }}>
                      {provider.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{provider.name}</p>
                      {conn ? (
                        <p className="text-sm text-muted-foreground">
                          {provider.id === "apple" ? "Subscribed via feed" : `Connected${conn.account_email ? ` as ${conn.account_email}` : ""}`}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">{provider.description}</p>
                      )}
                    </div>
                  </div>
                  {conn ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(provider.id)}
                      disabled={isDisconnecting}
                      className="text-destructive hover:text-destructive"
                    >
                      {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Unlink className="w-4 h-4 mr-1" />Disconnect</>}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleConnect(provider.id)} disabled={isConnecting}>
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : provider.id === "apple" ? (
                        <><CalendarDays className="w-4 h-4 mr-1" />Subscribe</>
                      ) : (
                        <><Link2 className="w-4 h-4 mr-1" />Connect</>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          {connections.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkSync}
                disabled={bulkSyncing}
                className="w-full"
              >
                {bulkSyncing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Syncing existing tasks…</>
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" />Sync all existing tasks</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Push all current planner tasks to your connected calendars
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apple Calendar Subscribe Dialog */}
      <Dialog open={appleDialogOpen} onOpenChange={setAppleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Apple className="w-5 h-5" />
              Subscribe to Calendar Feed
            </DialogTitle>
            <DialogDescription>
              Add your Launchely tasks to Apple Calendar by subscribing to this feed URL. Your calendar will automatically stay up to date.
            </DialogDescription>
          </DialogHeader>

          {generatingFeed ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : feedUrl ? (
            <div className="space-y-4">
              {/* Feed URL */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Your feed URL</p>
                <div className="flex gap-2">
                  <Input value={feedUrl} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={handleCopyFeedUrl} className="shrink-0">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">How to subscribe:</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground shrink-0">Mac:</span>
                    <span>Open Calendar app → File → New Calendar Subscription → paste the URL</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground shrink-0">iPhone:</span>
                    <span>Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar → paste the URL</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground shrink-0">iPad:</span>
                    <span>Same as iPhone steps above</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Your calendar will refresh automatically (typically every 15–30 minutes depending on your device).
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAppleDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
