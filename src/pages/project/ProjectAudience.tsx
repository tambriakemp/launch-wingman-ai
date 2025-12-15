import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ArrowLeft, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AudienceDiscovery, AudienceData } from "@/components/funnel/AudienceDiscovery";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { useState, useEffect } from "react";

const ProjectAudience = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [audienceData, setAudienceData] = useState<AudienceData>({
    niche: '',
    targetAudience: '',
    primaryPainPoint: '',
    desiredOutcome: '',
    problemStatement: '',
  });

  // Fetch funnel
  const { data: funnel, isLoading } = useQuery({
    queryKey: ['funnel', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('project_id', projectId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Initialize from existing data
  useEffect(() => {
    if (funnel) {
      setAudienceData({
        niche: funnel.niche || '',
        targetAudience: funnel.target_audience || '',
        primaryPainPoint: funnel.primary_pain_point || '',
        desiredOutcome: funnel.desired_outcome || '',
        problemStatement: funnel.problem_statement || '',
      });
    }
  }, [funnel]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !projectId) throw new Error("Missing required data");

      if (funnel) {
        const { error } = await supabase
          .from('funnels')
          .update({
            niche: audienceData.niche,
            target_audience: audienceData.targetAudience,
            primary_pain_point: audienceData.primaryPainPoint,
            desired_outcome: audienceData.desiredOutcome,
            problem_statement: audienceData.problemStatement,
          })
          .eq('id', funnel.id);
        if (error) throw error;
      } else {
        // No funnel exists - redirect to funnel type first
        toast.error("Please select a funnel type first");
        navigate(`/projects/${projectId}/funnel-type`);
        return;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel', projectId] });
      toast.success("Audience data saved!");
    },
    onError: (error) => {
      console.error("Error saving:", error);
      toast.error("Failed to save");
    },
  });

  const handleSaveAndContinue = async () => {
    await saveMutation.mutateAsync();
    navigate(`/projects/${projectId}/transformation`);
  };

  if (!projectId) return null;

  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </ProjectLayout>
    );
  }

  // No funnel or no funnel type selected - redirect to funnel type
  if (!funnel || !funnel.funnel_type) {
    navigate(`/projects/${projectId}/funnel-type`, { replace: true });
    return null;
  }

  const isComplete = !!(
    audienceData.niche &&
    audienceData.targetAudience &&
    audienceData.primaryPainPoint &&
    audienceData.desiredOutcome &&
    audienceData.problemStatement
  );

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <PlanPageHeader
          title="Audience & Strategy"
          description="Define who you're serving and the transformation you provide"
          icon={Users}
          breadcrumbs={[{ label: "Funnel Type", href: `/projects/${projectId}/funnel-type` }]}
        />

        {/* Audience Form */}
        <AudienceDiscovery
          data={audienceData}
          onChange={setAudienceData}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => navigate(`/projects/${projectId}/funnel-type`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Funnel Type
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
            <Button
              onClick={handleSaveAndContinue}
              disabled={!isComplete || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ProjectLayout>
  );
};

export default ProjectAudience;
