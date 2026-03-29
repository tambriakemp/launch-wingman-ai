import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Key, Plus, Copy, Trash2, Loader2, AlertTriangle, Check } from "lucide-react";

export function ApiKeysCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newKeyLabel, setNewKeyLabel] = useState("Default");
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: keys, isLoading } = useQuery({
    queryKey: ["personal-api-keys", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal_api_keys")
        .select("id, key_prefix, label, last_used_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const generateMutation = useMutation({
    mutationFn: async (label: string) => {
      const { data, error } = await supabase.functions.invoke("generate-personal-api-key", {
        body: { label },
      });
      if (error) throw error;
      return data as { key: string; prefix: string; label: string };
    },
    onSuccess: (data) => {
      setJustCreatedKey(data.key);
      setCopied(false);
      setNewKeyLabel("Default");
      queryClient.invalidateQueries({ queryKey: ["personal-api-keys"] });
      toast.success("API key generated — copy it now!");
    },
    onError: (err: any) => {
      toast.error("Failed to generate key: " + (err.message || "Unknown error"));
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase.from("personal_api_keys").delete().eq("id", keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-api-keys"] });
      toast.success("API key revoked");
    },
    onError: () => toast.error("Failed to revoke key"),
  });

  const handleCopy = async () => {
    if (!justCreatedKey) return;
    await navigator.clipboard.writeText(justCreatedKey);
    setCopied(true);
    toast.success("Copied to clipboard");
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <Key className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <CardTitle>Personal API Keys</CardTitle>
            <CardDescription>Long-lived keys for the AI Studio API</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New key creation */}
        {justCreatedKey ? (
          <div className="space-y-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Copy this key now — it won't be shown again</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm font-mono break-all select-all">
                {justCreatedKey}
              </code>
              <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setJustCreatedKey(null)} className="text-xs">
              I've saved it — dismiss
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Key label (e.g. Automation)"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={() => generateMutation.mutate(newKeyLabel)}
              disabled={generateMutation.isPending}
              className="shrink-0"
            >
              {generateMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Plus className="w-3.5 h-3.5 mr-1.5" />
              )}
              Generate
            </Button>
          </div>
        )}

        {/* Existing keys */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : keys && keys.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Keys</p>
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-foreground">{k.key_prefix}{"•".repeat(12)}</code>
                    <span className="text-xs text-muted-foreground">({k.label})</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {k.last_used_at
                      ? `Last used ${formatDistanceToNow(new Date(k.last_used_at), { addSuffix: true })}`
                      : "Never used"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeMutation.mutate(k.id)}
                  disabled={revokeMutation.isPending}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            No API keys yet. Generate one to use with the AI Studio API.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Use these keys as <code className="text-xs">Authorization: Bearer lw_sk_...</code> when calling the AI Studio API.
        </p>
      </CardContent>
    </Card>
  );
}
