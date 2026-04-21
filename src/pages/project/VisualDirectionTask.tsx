import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, Clock, Palette, Type, Camera, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ColorsSection from "@/components/branding/ColorsSection";
import FontsSection from "@/components/branding/FontsSection";
import PhotosSection from "@/components/branding/PhotosSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const VisualDirectionTask = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [confirmations, setConfirmations] = useState({
    chosen_direction: false,
    understand_launch_only: false,
  });
  const [showAiHelp, setShowAiHelp] = useState(false);

  // Fetch existing task data
  const { data: taskData, isLoading } = useQuery({
    queryKey: ["project-task", projectId, "messaging_visual_direction"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", projectId)
        .eq("task_id", "messaging_visual_direction")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !!user,
  });

  // Initialize confirmations from saved data
  useState(() => {
    if (taskData?.input_data) {
      const inputData = taskData.input_data as Record<string, boolean>;
      setConfirmations({
        chosen_direction: inputData.chosen_direction || false,
        understand_launch_only: inputData.understand_launch_only || false,
      });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { status: string; input_data: Record<string, boolean> }) => {
      if (!user || !projectId) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("project_tasks")
        .upsert({
          project_id: projectId,
          user_id: user.id,
          task_id: "messaging_visual_direction",
          status: data.status,
          input_data: data.input_data,
          completed_at: data.status === "completed" ? new Date().toISOString() : null,
        }, { onConflict: "project_id,task_id" });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-task", projectId, "messaging_visual_direction"] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      if (variables.status === "completed") {
        toast({ title: "Task completed!", description: "Your visual direction has been saved." });
        navigate(`/projects/${projectId}/dashboard`);
      }
    },
    onError: (error) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    },
  });

  const handleConfirmationChange = (key: keyof typeof confirmations, checked: boolean) => {
    setConfirmations(prev => ({ ...prev, [key]: checked }));
  };

  const handleSaveAndComplete = () => {
    if (!confirmations.chosen_direction || !confirmations.understand_launch_only) {
      toast({ 
        title: "Please confirm both items", 
        description: "Check both boxes to complete this task.",
        variant: "destructive" 
      });
      return;
    }

    saveMutation.mutate({
      status: "completed",
      input_data: confirmations,
    });
  };

  const allConfirmed = confirmations.chosen_direction && confirmations.understand_launch_only;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <EditorialTaskShell
        projectId={projectId!}
        taskId="messaging_visual_direction"
        phase={"messaging" as const}
        title="Set Your Launch Visual Direction"
        whyItMatters="When your visuals feel consistent, posting feels easier — and your audience understands you faster. This isn't about perfect branding. It's about choosing a direction so you don't second-guess every post."
        instructions={[
          "Choose a small set of visual cues for this launch",
          "Keep it simple — less is better",
          "You can change this later or use a different direction next launch",
        ]}
        estimatedTimeRange="~10 minutes"
        footer={
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(`/projects/${projectId}/dashboard`)} className="w-full sm:w-auto">
              Save for Later
            </Button>
            <Button onClick={handleSaveAndComplete} disabled={!allConfirmed || saveMutation.isPending} className="w-full sm:w-auto">
              {saveMutation.isPending ? "Saving..." : "Save & Complete"}
            </Button>
          </div>
        }
      >
        <h2 className="editorial-eyebrow mb-4">Your visual direction</h2>
        <Accordion type="multiple" defaultValue={["colors", "fonts", "photos"]} className="space-y-4">
          <AccordionItem value="colors" className="border rounded-lg px-4">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-ink-900">Choose your color palette</p>
                  <p className="text-sm text-fg-muted font-normal">
                    These don't have to be perfect. <a href="https://coolors.co" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Coolors.co <ExternalLink className="h-3 w-3" /></a> is a great site to get inspiration.
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <ColorsSection projectId={projectId!} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fonts" className="border rounded-lg px-4">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <Type className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-ink-900">Which font styles feel right for this launch?</p>
                  <p className="text-sm text-fg-muted font-normal">You're choosing a feel, not a font file.</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <FontsSection projectId={projectId!} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="photos" className="border rounded-lg px-4">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-ink-900">What kind of visuals feel aligned?</p>
                  <p className="text-sm text-fg-muted font-normal">Pick what feels easiest to stay consistent with.</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <PhotosSection />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <section className="mt-10 p-5 rounded-xl bg-paper-200/30 border border-hairline">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-ink-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Need help choosing?
              </h3>
              <p className="text-sm text-fg-muted">Get suggestions based on your audience, offer, and tone</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAiHelp(true)}>
              Help me choose
            </Button>
          </div>
        </section>

        <div className="h-px bg-hairline my-10" />

        <h2 className="editorial-eyebrow mb-4">This step is complete when</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox id="chosen_direction" checked={confirmations.chosen_direction} onCheckedChange={(checked) => handleConfirmationChange("chosen_direction", checked as boolean)} />
            <Label htmlFor="chosen_direction" className="text-sm leading-relaxed cursor-pointer text-ink-800">
              I've chosen a simple visual direction
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox id="understand_launch_only" checked={confirmations.understand_launch_only} onCheckedChange={(checked) => handleConfirmationChange("understand_launch_only", checked as boolean)} />
            <Label htmlFor="understand_launch_only" className="text-sm leading-relaxed cursor-pointer text-ink-800">
              I understand this is just for this launch
            </Label>
          </div>
        </div>
      </EditorialTaskShell>

      {/* AI Help Dialog */}
      <Dialog open={showAiHelp} onOpenChange={setShowAiHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Help Me Choose
            </DialogTitle>
            <DialogDescription>Visual direction suggestions based on your launch</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="font-medium">Colors</h4>
              <p className="text-sm text-fg-muted">Consider your audience's expectations. For professional services, lean toward muted, sophisticated tones. For creative or lifestyle offers, you can be bolder.</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Fonts</h4>
              <p className="text-sm text-fg-muted">Match your tone: playful audiences appreciate rounded, friendly fonts; professional audiences respond to clean, structured typography.</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Photos</h4>
              <p className="text-sm text-fg-muted">Choose imagery that reflects the transformation you offer. Before/after, lifestyle shots, or behind-the-scenes can all work depending on your message.</p>
            </div>
            <div className="pt-2 text-xs text-fg-muted italic">These are suggestions only — they won't override your selections.</div>
          </div>
          <Button onClick={() => setShowAiHelp(false)} className="w-full">Got it</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VisualDirectionTask;
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header / Context Section */}
        <div className="mb-10">
          <Link
            to={`/projects/${projectId}/dashboard`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Messaging Phase
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Estimated time: ~10 minutes
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            Set Your Launch Visual Direction
          </h1>
        </div>

        {/* Why This Matters Section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Why this matters
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            When your visuals feel consistent, posting feels easier — and your audience understands you faster.
            This isn't about perfect branding. It's about choosing a direction so you don't second-guess every post.
          </p>
        </section>

        <div className="h-px bg-border mb-10" />

        {/* What to Do Section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            What to do
          </h2>
          <ol className="space-y-3">
            <li className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-medium text-muted-foreground">
                1
              </span>
              <span className="text-foreground/80 pt-0.5">Choose a small set of visual cues for this launch</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-medium text-muted-foreground">
                2
              </span>
              <span className="text-foreground/80 pt-0.5">Keep it simple — less is better</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-medium text-muted-foreground">
                3
              </span>
              <span className="text-foreground/80 pt-0.5">You can change this later or use a different direction next launch</span>
            </li>
          </ol>
        </section>

        <div className="h-px bg-border mb-10" />

        {/* Visual Direction Input Section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Your visual direction
          </h2>
          
          <Accordion type="multiple" defaultValue={["colors", "fonts", "photos"]} className="space-y-4">
            {/* Colors Section */}
            <AccordionItem value="colors" className="border rounded-lg px-4">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Choose your color palette</p>
                    <p className="text-sm text-muted-foreground font-normal">
                      These don't have to be perfect. <a href="https://coolors.co" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Coolors.co <ExternalLink className="h-3 w-3" /></a> is a great site to get inspiration.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <ColorsSection projectId={projectId!} />
              </AccordionContent>
            </AccordionItem>

            {/* Fonts Section */}
            <AccordionItem value="fonts" className="border rounded-lg px-4">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Type className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Which font styles feel right for this launch?</p>
                    <p className="text-sm text-muted-foreground font-normal">
                      You're choosing a feel, not a font file.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <FontsSection projectId={projectId!} />
              </AccordionContent>
            </AccordionItem>

            {/* Photos Section */}
            <AccordionItem value="photos" className="border rounded-lg px-4">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">What kind of visuals feel aligned?</p>
                    <p className="text-sm text-muted-foreground font-normal">
                      Pick what feels easiest to stay consistent with.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <PhotosSection />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <div className="h-px bg-border mb-10" />

        {/* AI Assist Section */}
        <section className="mb-10 p-5 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Need help choosing?
              </h3>
              <p className="text-sm text-muted-foreground">Get suggestions based on your audience, offer, and tone</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAiHelp(true)}>
              Help me choose
            </Button>
          </div>
        </section>

        <div className="h-px bg-border mb-10" />

        {/* Completion Criteria Section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            This step is complete when
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="chosen_direction"
                checked={confirmations.chosen_direction}
                onCheckedChange={(checked) => handleConfirmationChange("chosen_direction", checked as boolean)}
              />
              <Label htmlFor="chosen_direction" className="text-sm leading-relaxed cursor-pointer text-foreground/80">
                I've chosen a simple visual direction
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox 
                id="understand_launch_only"
                checked={confirmations.understand_launch_only}
                onCheckedChange={(checked) => handleConfirmationChange("understand_launch_only", checked as boolean)}
              />
              <Label htmlFor="understand_launch_only" className="text-sm leading-relaxed cursor-pointer text-foreground/80">
                I understand this is just for this launch
              </Label>
            </div>
          </div>
        </section>

        {/* Save Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button 
            variant="outline"
            onClick={() => navigate(`/projects/${projectId}/dashboard`)}
            className="w-full sm:w-auto"
          >
            Save for Later
          </Button>
          <Button 
            onClick={handleSaveAndComplete}
            disabled={!allConfirmed || saveMutation.isPending}
            className="w-full sm:w-auto"
          >
            {saveMutation.isPending ? "Saving..." : "Save & Complete"}
          </Button>
        </div>
      </div>

      {/* AI Help Dialog */}
      <Dialog open={showAiHelp} onOpenChange={setShowAiHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Help Me Choose
            </DialogTitle>
            <DialogDescription>
              Visual direction suggestions based on your launch
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="font-medium">Colors</h4>
              <p className="text-sm text-muted-foreground">
                Consider your audience's expectations. For professional services, lean toward muted, sophisticated tones. For creative or lifestyle offers, you can be bolder.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Fonts</h4>
              <p className="text-sm text-muted-foreground">
                Match your tone: playful audiences appreciate rounded, friendly fonts; professional audiences respond to clean, structured typography.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Photos</h4>
              <p className="text-sm text-muted-foreground">
                Choose imagery that reflects the transformation you offer. Before/after, lifestyle shots, or behind-the-scenes can all work depending on your message.
              </p>
            </div>
            <div className="pt-2 text-xs text-muted-foreground italic">
              These are suggestions only — they won't override your selections.
            </div>
          </div>
          <Button onClick={() => setShowAiHelp(false)} className="w-full">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisualDirectionTask;
