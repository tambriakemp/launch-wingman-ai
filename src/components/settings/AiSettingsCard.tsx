import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAiUsage, getFunctionLabel } from "@/hooks/useAiUsage";
import { useVideoCredits } from "@/hooks/useVideoCredits";
import { useUserApiKey } from "@/hooks/useUserApiKey";
import { useVideoProvider } from "@/hooks/useVideoProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Loader2,
  Settings2,
  ChevronDown,
  BarChart3,
  Coins,
  Key,
  Video,
  Sparkles,
  X,
  Check,
} from "lucide-react";

const CREDIT_PACKS = [
  { credits: 10, price: "$4.99", priceId: "price_1T6ccEF2gaEq7adwjWGNlVGy" },
  { credits: 25, price: "$9.99", priceId: "price_1T6cdJF2gaEq7adwYb8ikBfa", popular: true },
  { credits: 50, price: "$17.99", priceId: "price_1T6cdzF2gaEq7adwIQ3V6Wr0" },
];

export function AiSettingsCard() {
  const { data: aiUsage, isLoading: isLoadingAi } = useAiUsage();
  const { data: credits, isLoading: isLoadingCredits } = useVideoCredits();
  const { data: videoProvider, isLoading: isLoadingProvider } = useVideoProvider();
  const falApiKey = useUserApiKey("fal_ai");
  const klingAccessKey = useUserApiKey("kling_access_key");
  const klingSecretKey = useUserApiKey("kling_secret_key");

  const isKlingMode = videoProvider === "kling";

  const [usageOpen, setUsageOpen] = useState(true);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [klingAccessInput, setKlingAccessInput] = useState("");
  const [klingSecretInput, setKlingSecretInput] = useState("");
  const [purchasingPack, setPurchasingPack] = useState<string | null>(null);

  const topFunctions = aiUsage?.byFunction
    ? Object.entries(aiUsage.byFunction)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    : [];

  const handleBuyCredits = async (priceId: string) => {
    setPurchasingPack(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-video-credits", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Failed to start checkout: " + (err.message || "Unknown error"));
    } finally {
      setPurchasingPack(null);
    }
  };

  // fal.ai key handlers
  const handleSaveFalKey = async () => {
    if (!keyInput.trim()) return;
    try {
      await falApiKey.save(keyInput.trim());
      setKeyInput("");
      toast.success("API key saved");
    } catch {
      toast.error("Failed to save API key");
    }
  };

  const handleClearFalKey = async () => {
    try {
      await falApiKey.clear();
      toast.success("API key removed");
    } catch {
      toast.error("Failed to remove API key");
    }
  };

  // Kling key handlers
  const handleSaveKlingKeys = async () => {
    if (!klingAccessInput.trim() || !klingSecretInput.trim()) return;
    try {
      await klingAccessKey.save(klingAccessInput.trim());
      await klingSecretKey.save(klingSecretInput.trim());
      setKlingAccessInput("");
      setKlingSecretInput("");
      toast.success("Kling API keys saved");
    } catch {
      toast.error("Failed to save Kling API keys");
    }
  };

  const handleClearKlingKeys = async () => {
    try {
      await klingAccessKey.clear();
      await klingSecretKey.clear();
      toast.success("Kling API keys removed");
    } catch {
      toast.error("Failed to remove Kling API keys");
    }
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <CardTitle>AI Settings</CardTitle>
            <CardDescription>Usage, credits & API keys</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Usage Section */}
        <Collapsible open={usageOpen} onOpenChange={setUsageOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Usage</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${usageOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-3">
            {isLoadingAi || isLoadingCredits ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span className="text-sm text-foreground">AI Calls</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{aiUsage?.totalCalls || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-foreground">Video Generations</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{credits?.videoGenerationsThisMonth || 0}</span>
                </div>
                {topFunctions.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By Feature</p>
                    {topFunctions.map(([fn, count]) => (
                      <div key={fn} className="flex items-center justify-between text-sm px-1">
                        <span className="text-muted-foreground">{getFunctionLabel(fn)}</span>
                        <span className="text-foreground font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center">{format(new Date(), "MMMM yyyy")}</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Video Credits Section — only show in fal.ai mode */}
        {!isKlingMode && (
          <>
            <Collapsible open={creditsOpen} onOpenChange={setCreditsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Video Credits</span>
                </div>
                <div className="flex items-center gap-2">
                  {!isLoadingCredits && (
                    <span className="text-xs text-muted-foreground">
                      {(credits?.monthlyFreeRemaining ?? 0) + (credits?.balance ?? 0)} available
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${creditsOpen ? "rotate-180" : ""}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
                {isLoadingCredits ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold text-foreground">{credits?.monthlyFreeRemaining ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Free this month</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold text-foreground">{credits?.balance ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Purchased</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Buy Credits</p>
                      <div className="grid gap-2">
                        {CREDIT_PACKS.map((pack) => (
                          <Button
                            key={pack.priceId}
                            variant={pack.popular ? "default" : "outline"}
                            size="sm"
                            className="justify-between h-auto py-2.5"
                            disabled={!!purchasingPack}
                            onClick={() => handleBuyCredits(pack.priceId)}
                          >
                            <span className="flex items-center gap-2">
                              {purchasingPack === pack.priceId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Coins className="w-3.5 h-3.5" />
                              )}
                              {pack.credits} credits
                              {pack.popular && (
                                <span className="text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">Popular</span>
                              )}
                            </span>
                            <span>{pack.price}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
            <Separator />
          </>
        )}

        {/* API Key Section */}
        <Collapsible open={apiKeyOpen} onOpenChange={setApiKeyOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {isKlingMode ? "Kling API Keys" : "API Key (BYOK)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isKlingMode && klingAccessKey.hasKey && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">Active</span>
              )}
              {!isKlingMode && falApiKey.hasKey && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">Active</span>
              )}
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${apiKeyOpen ? "rotate-180" : ""}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-3">
            <div className="space-y-3 mt-2">
              {isKlingMode ? (
                // Kling key fields
                <>
                  <p className="text-xs text-muted-foreground">
                    Enter your Kling API keys from{" "}
                    <a href="https://app.klingai.com/global/dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      app.klingai.com/global/dev
                    </a>
                    . Both keys are required for video generation.
                  </p>

                  {klingAccessKey.isLoading || klingSecretKey.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : klingAccessKey.hasKey ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 rounded-lg bg-muted/50 text-sm font-mono text-muted-foreground truncate">
                          Access: {klingAccessKey.maskedKey}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 rounded-lg bg-muted/50 text-sm font-mono text-muted-foreground truncate">
                          Secret: {klingSecretKey.maskedKey || "••••••••"}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearKlingKeys}
                          disabled={klingAccessKey.isClearing}
                          className="text-destructive hover:text-destructive shrink-0"
                        >
                          {klingAccessKey.isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="Access Key"
                        value={klingAccessInput}
                        onChange={(e) => setKlingAccessInput(e.target.value)}
                        className="text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="password"
                          placeholder="Secret Key"
                          value={klingSecretInput}
                          onChange={(e) => setKlingSecretInput(e.target.value)}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveKlingKeys}
                          disabled={!klingAccessInput.trim() || !klingSecretInput.trim() || klingAccessKey.isSaving}
                          className="shrink-0"
                        >
                          {klingAccessKey.isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // fal.ai key field (original)
                <>
                  <p className="text-xs text-muted-foreground">
                    Use your own fal.ai API key for unlimited video generation without credits.
                  </p>

                  {falApiKey.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : falApiKey.hasKey ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-lg bg-muted/50 text-sm font-mono text-muted-foreground truncate">
                        {falApiKey.maskedKey}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearFalKey}
                        disabled={falApiKey.isClearing}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        {falApiKey.isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        placeholder="fal_..."
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveFalKey}
                        disabled={!keyInput.trim() || falApiKey.isSaving}
                        className="shrink-0"
                      >
                        {falApiKey.isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
