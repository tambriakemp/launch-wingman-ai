import { useState } from "react";
import { Plus, Users, MoreHorizontal, Pencil, Trash2, Instagram, Facebook, Twitter, Linkedin, AtSign, X, Lock, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

interface SocialBio {
  id: string;
  platform: string;
  formula: string;
  content: string;
}

interface TransformationVersions {
  one_liner?: string;
  standard?: string;
  expanded?: string;
}

interface SocialBioBuilderProps {
  projectId: string;
}

const platforms = [
  { id: "instagram", name: "Instagram", icon: Instagram, maxChars: 150 },
  { id: "facebook", name: "Facebook", icon: Facebook, maxChars: 101 },
  { id: "threads", name: "Threads", icon: AtSign, maxChars: 160 },
  { id: "twitter", name: "X (Twitter)", icon: Twitter, maxChars: 160 },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, maxChars: 220 },
  { id: "tiktok", name: "TikTok", icon: Users, maxChars: 80 },
];

const bioFormulas = [
  {
    id: "who-result",
    name: "Who You Help + Result",
    formula: "I help [who] [achieve result] using [method].",
    example: "I help coaches launch profitable memberships using simple funnels & content.",
    bestFor: "Clarity, conversions, first impressions",
    fields: [
      { key: "who", label: "Who do you help?", placeholder: "e.g., coaches, creators, entrepreneurs" },
      { key: "result", label: "What result do they achieve?", placeholder: "e.g., launch profitable memberships" },
      { key: "method", label: "What method do you use?", placeholder: "e.g., simple funnels & content" },
    ],
    build: (data: Record<string, string>) => `I help ${data.who || ""} ${data.result || ""} using ${data.method || ""}.`.trim(),
  },
  {
    id: "identity-transformation",
    name: "Identity + Transformation",
    formula: "[Your role/identity] helping [who] go from [pain] → [desired outcome].",
    example: "Digital marketer helping creators go from overwhelmed to confidently launching.",
    bestFor: "Emotional connection",
    fields: [
      { key: "identity", label: "Your role/identity", placeholder: "e.g., Digital marketer, Launch strategist" },
      { key: "who", label: "Who do you help?", placeholder: "e.g., creators, coaches" },
      { key: "pain", label: "Their current pain", placeholder: "e.g., overwhelmed, stuck" },
      { key: "outcome", label: "Desired outcome", placeholder: "e.g., confidently launching" },
    ],
    build: (data: Record<string, string>) => `${data.identity || ""} helping ${data.who || ""} go from ${data.pain || ""} → ${data.outcome || ""}.`.trim(),
  },
  {
    id: "niche-authority",
    name: "Niche Authority",
    formula: "[What you're known for] | [specific niche] | [core outcome]",
    example: "Launch strategy | Coaches & creators | Programs that actually convert",
    bestFor: "Positioning as an expert",
    fields: [
      { key: "knownFor", label: "What you're known for", placeholder: "e.g., Launch strategy" },
      { key: "niche", label: "Your specific niche", placeholder: "e.g., Coaches & creators" },
      { key: "outcome", label: "Core outcome", placeholder: "e.g., Programs that actually convert" },
    ],
    build: (data: Record<string, string>) => `${data.knownFor || ""} | ${data.niche || ""} | ${data.outcome || ""}`.trim(),
  },
  {
    id: "problem-promise",
    name: "Problem + Promise",
    formula: "Tired of [problem]?\nI help you [solution/result].",
    example: "Tired of launching with no sales?\nI help you build launches that convert.",
    bestFor: "Hooks + relatability",
    fields: [
      { key: "problem", label: "The problem they face", placeholder: "e.g., launching with no sales" },
      { key: "solution", label: "Your solution/result", placeholder: "e.g., build launches that convert" },
    ],
    build: (data: Record<string, string>) => `Tired of ${data.problem || ""}?\nI help you ${data.solution || ""}.`.trim(),
  },
  {
    id: "this-is-for-you",
    name: '"This Is For You If"',
    formula: "For [who] who want [result] without [pain point].",
    example: "For coaches who want consistent launches without burnout or confusion.",
    bestFor: "Calling in the right audience",
    fields: [
      { key: "who", label: "Who is this for?", placeholder: "e.g., coaches" },
      { key: "result", label: "What result do they want?", placeholder: "e.g., consistent launches" },
      { key: "painPoint", label: "Pain point to avoid", placeholder: "e.g., burnout or confusion" },
    ],
    build: (data: Record<string, string>) => `For ${data.who || ""} who want ${data.result || ""} without ${data.painPoint || ""}.`.trim(),
  },
  {
    id: "framework-based",
    name: "Framework-Based",
    formula: "Helping [who] launch using [named framework or system].",
    example: "Helping coaches launch with my 90-Day Clarity → Content → Cash system.",
    bestFor: "Brand-building + future offers",
    fields: [
      { key: "who", label: "Who do you help?", placeholder: "e.g., coaches" },
      { key: "framework", label: "Your named framework/system", placeholder: "e.g., 90-Day Clarity → Content → Cash system" },
    ],
    build: (data: Record<string, string>) => `Helping ${data.who || ""} launch with my ${data.framework || ""}.`.trim(),
  },
  {
    id: "results-credibility",
    name: "Results + Credibility",
    formula: "[Outcome or proof] | Helping [who] do the same",
    example: "Multiple 5-figure launches | Helping coaches build theirs",
    bestFor: "Trust + authority",
    fields: [
      { key: "proof", label: "Your outcome or proof", placeholder: "e.g., Multiple 5-figure launches" },
      { key: "who", label: "Who do you help?", placeholder: "e.g., coaches" },
    ],
    build: (data: Record<string, string>) => `${data.proof || ""} | Helping ${data.who || ""} build theirs`.trim(),
  },
  {
    id: "lifestyle-business",
    name: "Lifestyle + Business",
    formula: "Building [lifestyle goal] through [business skill].",
    example: "Building a freedom-first life through digital products & launches.",
    bestFor: "Aspirational brands",
    fields: [
      { key: "lifestyle", label: "Lifestyle goal", placeholder: "e.g., a freedom-first life" },
      { key: "skill", label: "Business skill", placeholder: "e.g., digital products & launches" },
    ],
    build: (data: Record<string, string>) => `Building ${data.lifestyle || ""} through ${data.skill || ""}.`.trim(),
  },
  {
    id: "short-punchy",
    name: "Short & Punchy One-Liner",
    formula: "[Bold statement about what you do]",
    example: "Launches made simple.",
    bestFor: "Minimalist bios",
    fields: [
      { key: "statement", label: "Your bold statement", placeholder: "e.g., Launches made simple." },
    ],
    build: (data: Record<string, string>) => (data.statement || "").trim(),
  },
  {
    id: "value-stack",
    name: "Value Stack Bio (3-Line)",
    formula: "Line 1: Who you help + result\nLine 2: How you help / what you focus on\nLine 3: CTA",
    example: "Helping coaches launch with clarity ✨\nFunnels • Content • Launch Strategy\n↓ Free launch planner",
    bestFor: "IG/TikTok bios",
    fields: [
      { key: "line1", label: "Line 1: Who you help + result", placeholder: "e.g., Helping coaches launch with clarity ✨" },
      { key: "line2", label: "Line 2: How you help", placeholder: "e.g., Funnels • Content • Launch Strategy" },
      { key: "line3", label: "Line 3: CTA", placeholder: "e.g., ↓ Free launch planner" },
    ],
    build: (data: Record<string, string>) => `${data.line1 || ""}\n${data.line2 || ""}\n${data.line3 || ""}`.trim(),
  },
  {
    id: "anti-bio",
    name: '"Anti-" Bio',
    formula: "Anti-[thing they hate] | Pro-[desired outcome]",
    example: "Anti-messy launches | Pro-simple, profitable systems",
    bestFor: "Strong brand voice",
    fields: [
      { key: "anti", label: "Thing they hate", placeholder: "e.g., messy launches" },
      { key: "pro", label: "Desired outcome", placeholder: "e.g., simple, profitable systems" },
    ],
    build: (data: Record<string, string>) => `Anti-${data.anti || ""} | Pro-${data.pro || ""}`.trim(),
  },
  {
    id: "cta-first",
    name: "CTA-First Bio",
    formula: "[Main benefit]\n→ [what to do next]",
    example: "Plan your next launch with confidence\n→ Grab the free planner below",
    bestFor: "Conversions",
    fields: [
      { key: "benefit", label: "Main benefit", placeholder: "e.g., Plan your next launch with confidence" },
      { key: "cta", label: "What to do next", placeholder: "e.g., Grab the free planner below" },
    ],
    build: (data: Record<string, string>) => `${data.benefit || ""}\n→ ${data.cta || ""}`.trim(),
  },
];

type Step = "platform" | "formula" | "content";

export const SocialBioBuilder = ({ projectId }: SocialBioBuilderProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddMode, setIsAddMode] = useState(false);
  const [step, setStep] = useState<Step>("platform");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedFormula, setSelectedFormula] = useState<string | null>(null);
  const [fieldData, setFieldData] = useState<Record<string, string>>({});
  const [editingBio, setEditingBio] = useState<SocialBio | null>(null);

  // Fetch bios from database
  const { data: bios = [], isLoading } = useQuery({
    queryKey: ["social-bios", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_bios")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        platform: item.platform,
        formula: item.formula_id,
        content: item.bio_content,
      }));
    },
    enabled: !!projectId,
  });

  // Fetch project's transformation data
  const { data: project } = useQuery({
    queryKey: ["project-transformation-bio", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("transformation_statement, transformation_locked, transformation_versions")
        .eq("id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const transformationStatement = project?.transformation_statement || '';
  const transformationLocked = project?.transformation_locked || false;
  const transformationVersions = (project?.transformation_versions as TransformationVersions) || null;

  const platform = platforms.find((p) => p.id === selectedPlatform);
  const formula = bioFormulas.find((f) => f.id === selectedFormula);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: { platform: string; formulaId: string; content: string; fieldData: Record<string, string> }) => {
      const { error } = await supabase.from("social_bios").insert({
        project_id: projectId,
        user_id: user?.id,
        platform: data.platform,
        formula_id: data.formulaId,
        bio_content: data.content,
        field_data: data.fieldData as Json,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-bios", projectId] });
      toast.success("Bio created");
      resetForm();
    },
    onError: () => toast.error("Failed to save bio"),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; platform: string; formulaId: string; content: string; fieldData: Record<string, string> }) => {
      const { error } = await supabase
        .from("social_bios")
        .update({
          platform: data.platform,
          formula_id: data.formulaId,
          bio_content: data.content,
          field_data: data.fieldData as Json,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-bios", projectId] });
      toast.success("Bio updated");
      resetForm();
    },
    onError: () => toast.error("Failed to update bio"),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_bios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-bios", projectId] });
      toast.success("Bio deleted");
    },
    onError: () => toast.error("Failed to delete bio"),
  });

  const resetForm = () => {
    setIsAddMode(false);
    setStep("platform");
    setSelectedPlatform(null);
    setSelectedFormula(null);
    setFieldData({});
    setEditingBio(null);
  };

  const handleAdd = () => {
    setEditingBio(null);
    setStep("platform");
    setSelectedPlatform(null);
    setSelectedFormula(null);
    setFieldData({});
    setIsAddMode(true);
  };

  const handleEdit = (bio: SocialBio) => {
    setEditingBio(bio);
    setSelectedPlatform(bio.platform);
    setSelectedFormula(bio.formula);
    setFieldData({ finalContent: bio.content });
    setStep("content");
    setIsAddMode(true);
  };

  const handleDelete = (bio: SocialBio) => {
    deleteMutation.mutate(bio.id);
  };

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setStep("formula");
  };

  const handleFormulaSelect = (formulaId: string) => {
    setSelectedFormula(formulaId);
    setFieldData({});
    setStep("content");
  };

  const generatedContent = formula && !editingBio ? formula.build(fieldData) : fieldData.finalContent || "";
  const charCount = generatedContent.length;
  const maxChars = platform?.maxChars || 150;
  const isOverLimit = charCount > maxChars;

  const handleSave = () => {
    if (!selectedPlatform || !selectedFormula) {
      toast.error("Please complete all steps");
      return;
    }

    const content = editingBio ? fieldData.finalContent : formula?.build(fieldData) || "";
    
    if (!content.trim()) {
      toast.error("Please fill in the bio content");
      return;
    }

    if (content.length > maxChars) {
      toast.error(`Bio exceeds ${maxChars} character limit for ${platform?.name}`);
      return;
    }

    // Check if a bio for this platform already exists
    const existingBioForPlatform = bios.find(b => b.platform === selectedPlatform);

    if (editingBio) {
      updateMutation.mutate({
        id: editingBio.id,
        platform: selectedPlatform,
        formulaId: selectedFormula,
        content,
        fieldData,
      });
    } else if (existingBioForPlatform) {
      // Update the existing bio for this platform instead of creating a duplicate
      updateMutation.mutate({
        id: existingBioForPlatform.id,
        platform: selectedPlatform,
        formulaId: selectedFormula,
        content,
        fieldData,
      });
    } else {
      createMutation.mutate({
        platform: selectedPlatform,
        formulaId: selectedFormula,
        content,
        fieldData,
      });
    }
  };

  const handleBack = () => {
    if (step === "formula") {
      setStep("platform");
      setSelectedPlatform(null);
    } else if (step === "content") {
      setStep("formula");
      setSelectedFormula(null);
      setFieldData({});
    }
  };

  const getPlatformIcon = (platformId: string) => {
    const p = platforms.find((pl) => pl.id === platformId);
    if (!p) return <Users className="w-4 h-4" />;
    const Icon = p.icon;
    return <Icon className="w-4 h-4" />;
  };

  // Show inline form when adding/editing
  if (isAddMode) {
    return (
      <Card className="border bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {step === "platform" && "Select Platform"}
                  {step === "formula" && "Choose Bio Formula"}
                  {step === "content" && "Build Your Bio"}
                </CardTitle>
                <CardDescription className="text-sm">
                  {step === "platform" && "Choose the platform you're creating a bio for"}
                  {step === "formula" && "Select a formula to structure your bio"}
                  {step === "content" && `Fill in the details for your ${platform?.name} bio`}
                </CardDescription>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "platform" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {platforms.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePlatformSelect(p.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                      "hover:border-primary hover:bg-primary/5",
                      selectedPlatform === p.id
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.maxChars} chars</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === "formula" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {bioFormulas.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFormulaSelect(f.id)}
                  className={cn(
                    "text-left p-4 rounded-lg border-2 transition-all",
                    "hover:border-primary hover:bg-primary/5",
                    selectedFormula === f.id
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  )}
                >
                  <h4 className="font-medium text-foreground text-sm mb-1">{f.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2 italic">{f.formula}</p>
                  <p className="text-xs text-muted-foreground">Best for: {f.bestFor}</p>
                </button>
              ))}
            </div>
          )}

          {step === "content" && (
            <div className="space-y-4">
              {/* Transformation Reference */}
              {transformationStatement && transformationLocked && (
                <div className="p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Your Transformation</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{transformationStatement}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Pre-fill fields based on transformation
                      if (formula?.id === "who-result" && transformationVersions?.one_liner) {
                        // Try to extract who/result from transformation
                        setFieldData(prev => ({
                          ...prev,
                          who: "your target audience",
                          result: transformationVersions.one_liner || "",
                        }));
                      }
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Use Transformation
                  </Button>
                </div>
              )}

              {editingBio ? (
                <div className="space-y-2">
                  <Label>Bio Content</Label>
                  <Textarea
                    value={fieldData.finalContent || ""}
                    onChange={(e) =>
                      setFieldData((prev) => ({ ...prev, finalContent: e.target.value }))
                    }
                    placeholder="Edit your bio content..."
                    rows={4}
                  />
                </div>
              ) : (
                formula?.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input
                      value={fieldData[field.key] || ""}
                      onChange={(e) =>
                        setFieldData((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                    />
                  </div>
                ))
              )}

              {generatedContent && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div
                    className={cn(
                      "p-4 rounded-lg border whitespace-pre-line text-sm",
                      isOverLimit ? "border-destructive bg-destructive/10" : "bg-muted/50"
                    )}
                  >
                    {generatedContent}
                  </div>
                  <p
                    className={cn(
                      "text-xs",
                      isOverLimit ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {charCount}/{maxChars} characters
                    {isOverLimit && " - Over limit!"}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between gap-3 pt-4 border-t">
            <div>
              {step !== "platform" && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              {step === "content" && (
                <Button onClick={handleSave} disabled={isOverLimit}>
                  {editingBio ? "Save Changes" : "Create Bio"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Category Header */}
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <Users className="w-5 h-5 text-purple-500" />
        <span className="font-medium text-foreground flex-1">Bios</span>
        <span className="text-sm text-muted-foreground">
          {bios.length} bio{bios.length !== 1 ? 's' : ''}
        </span>
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Add New
        </Button>
      </div>

      {/* List Items */}
      {bios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">No social media bios added yet</p>
          <Button size="sm" variant="ghost" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            Add Your First
          </Button>
        </div>
      ) : (
        <div>
          {bios.map((bio, index) => {
            const p = platforms.find((pl) => pl.id === bio.platform);
            const f = bioFormulas.find((fl) => fl.id === bio.formula);
            const Icon = p?.icon || Users;
            return (
              <div
                key={bio.id}
                className={`flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors ${
                  index !== bios.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                {/* Platform Icon as circle */}
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{p?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {f?.name} • {bio.content.length}/{p?.maxChars} chars
                  </p>
                </div>
                
                {/* More options dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(bio)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(bio)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
