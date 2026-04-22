import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { supabase } from "@/integrations/supabase/client";

const PLATFORMS = ["Any Platform", "Instagram", "TikTok", "LinkedIn", "X / Twitter", "YouTube", "Email"];
const HOOK_STYLES = ["Curiosity Gap", "Bold Claim", "Personal Story", "Controversial Take", "How-To", "Number List", "Before & After", "Question"];
const TONES = ["Conversational", "Professional", "Energetic", "Thoughtful", "Witty"];

const HookGenerator = () => {
  const navigate = useNavigate();
  const [idea, setIdea] = useState("");
  const [platform, setPlatform] = useState("Any Platform");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [tone, setTone] = useState("Conversational");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hooks, setHooks] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setIsGenerating(true);
    setHooks([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-hooks", {
        body: { idea, platform, selectedStyles, tone },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setHooks(data.hooks);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate hooks. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(hooks.join("\n\n"));
    toast.success("All hooks copied!");
  };

  return (
    <ProjectLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Hook Generator</h1>
              <p className="text-sm text-muted-foreground">
                Generate 10 scroll-stopping hooks for any content idea.
              </p>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* LEFT — Form */}
          <div className="space-y-4 mb-8 lg:mb-0">
            <div>
              <Label htmlFor="idea">Content idea</Label>
              <Textarea
                id="idea"
                rows={3}
                required
                placeholder="e.g. 3 mistakes coaches make when pricing their offers — or paste any content idea here"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Hook styles</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {HOOK_STYLES.map((style) => {
                  const active = selectedStyles.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={!idea.trim() || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {isGenerating ? "Generating…" : "Generate 10 Hooks"}
            </Button>
          </div>

          {/* RIGHT — Output */}
          <div>
            {hooks.length === 0 && !isGenerating && (
              <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-2xl p-12 text-center">
                <Zap className="w-10 h-10 text-amber-500/30 mb-3" />
                <p className="text-sm font-medium text-foreground">Your hooks will appear here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fill in your idea and click Generate
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            )}

            {hooks.length > 0 && !isGenerating && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    10 Hooks Generated
                  </span>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={copyAll}>
                    <Copy className="w-3.5 h-3.5" />
                    Copy All
                  </Button>
                </div>

                {hooks.map((hook, index) => (
                  <div
                    key={index}
                    className="relative group bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 transition-colors"
                  >
                    <p className="text-sm leading-relaxed text-foreground pr-8">{hook}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {hook.length} chars
                      </span>
                      <button
                        onClick={() => copyToClipboard(hook, index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProjectLayout>
  );
};

export default HookGenerator;
