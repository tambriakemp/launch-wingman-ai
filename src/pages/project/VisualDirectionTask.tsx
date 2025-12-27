import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, Check, Palette, Type, Camera, ExternalLink } from "lucide-react";
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
        navigate(`/projects/${projectId}/plan`);
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
        <div className="max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(`/projects/${projectId}/plan`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Set Your Launch Visual Direction</h1>
            <p className="text-muted-foreground">~10 minutes</p>
          </div>
        </div>

        {/* Why This Matters */}
        <Card className="p-6 bg-muted/30 border-muted">
          <h2 className="text-lg font-semibold mb-2">Why This Matters</h2>
          <p className="text-muted-foreground">
            When your visuals feel consistent, posting feels easier — and your audience understands you faster.
            This isn't about perfect branding. It's about choosing a direction so you don't second-guess every post.
          </p>
        </Card>

        {/* What To Do */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-3">What To Do</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              Choose a small set of visual cues for this launch
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              Keep it simple — less is better
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              You can change this later or use a different direction next launch
            </li>
          </ul>
        </Card>

        {/* Visual Direction Sections */}
        <Accordion type="multiple" defaultValue={["colors", "fonts", "photos"]} className="space-y-4">
          {/* Colors Section */}
          <AccordionItem value="colors" className="border rounded-lg px-6">
            <AccordionTrigger className="py-4">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Choose your color palette</p>
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
          <AccordionItem value="fonts" className="border rounded-lg px-6">
            <AccordionTrigger className="py-4">
              <div className="flex items-center gap-3">
                <Type className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Which font styles feel right for this launch?</p>
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
          <AccordionItem value="photos" className="border rounded-lg px-6">
            <AccordionTrigger className="py-4">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">What kind of visuals feel aligned?</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Pick what feels easiest to stay consistent with.
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <PhotosSection projectId={projectId!} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* AI Assist */}
        <Card className="p-6 border-dashed">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Assist (Optional)
              </h3>
              <p className="text-sm text-muted-foreground">Get suggestions based on your audience, offer, and tone</p>
            </div>
            <Button variant="outline" onClick={() => setShowAiHelp(true)}>
              Help me choose
            </Button>
          </div>
        </Card>

        {/* Completion Checkboxes */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">This task is complete when:</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="chosen_direction"
                checked={confirmations.chosen_direction}
                onCheckedChange={(checked) => handleConfirmationChange("chosen_direction", checked as boolean)}
              />
              <Label htmlFor="chosen_direction" className="text-sm leading-relaxed cursor-pointer">
                I've chosen a simple visual direction
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox 
                id="understand_launch_only"
                checked={confirmations.understand_launch_only}
                onCheckedChange={(checked) => handleConfirmationChange("understand_launch_only", checked as boolean)}
              />
              <Label htmlFor="understand_launch_only" className="text-sm leading-relaxed cursor-pointer">
                I understand this is just for this launch
              </Label>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline"
            onClick={() => navigate(`/projects/${projectId}/plan`)}
          >
            Save for Later
          </Button>
          <Button 
            onClick={handleSaveAndComplete}
            disabled={!allConfirmed || saveMutation.isPending}
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
