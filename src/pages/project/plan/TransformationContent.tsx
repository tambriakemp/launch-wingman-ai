import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TransformationStep } from "@/components/funnel/TransformationStep";
import { AudienceData } from "@/components/funnel/AudienceDiscovery";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { useState, useEffect } from "react";

interface Props {
  projectId: string;
}

const TransformationContent = ({ projectId }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [transformationStatement, setTransformationStatement] = useState('');
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
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch project for transformation statement
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('transformation_statement')
        .eq('id', projectId)
        .single();
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

  useEffect(() => {
    if (project?.transformation_statement) {
      setTransformationStatement(project.transformation_statement);
    }
  }, [project]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !projectId) throw new Error("Missing required data");

      const { error } = await supabase
        .from('projects')
        .update({ transformation_statement: transformationStatement })
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (error) => {
      console.error("Error saving:", error);
    },
  });

  const handleSaveAndContinue = async () => {
    await saveMutation.mutateAsync();
    navigate(`/projects/${projectId}/offers`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No funnel or funnel type - redirect to funnel type
  if (!funnel || !funnel.funnel_type) {
    navigate(`/projects/${projectId}/funnel-type`, { replace: true });
    return null;
  }

  // Audience not complete - redirect to audience
  if (!funnel.niche || !funnel.target_audience) {
    navigate(`/projects/${projectId}/audience`, { replace: true });
    return null;
  }

  return (
    <div className="space-y-6">
      <PlanPageHeader
        title="Transformation Statement"
        description="Create a powerful statement that articulates the transformation you provide"
      />

      {/* Transformation Form */}
      <TransformationStep
        audienceData={audienceData}
        transformationStatement={transformationStatement}
        onChange={setTransformationStatement}
        funnelType={funnel.funnel_type || undefined}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => navigate(`/projects/${projectId}/audience`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Audience
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
            disabled={saveMutation.isPending}
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
  );
};

export default TransformationContent;
