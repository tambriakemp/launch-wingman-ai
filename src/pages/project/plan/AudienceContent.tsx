import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { AudienceProfileCard } from "@/components/audience/AudienceProfileCard";
import { ValueEquationTabs, ValueEquationData } from "@/components/audience/ValueEquationTabs";
import { useState, useEffect } from "react";

interface Props {
  projectId: string;
}

const AudienceContent = ({ projectId }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("who");

  const [audienceData, setAudienceData] = useState<ValueEquationData>({
    niche: '',
    targetAudience: '',
    subAudiences: [],
    specificityScore: 0,
    desiredOutcome: '',
    primaryPainPoint: '',
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

  // Initialize from existing data
  useEffect(() => {
    if (funnel) {
      // Parse sub_audiences from jsonb
      let subAudiences: ValueEquationData['subAudiences'] = [];
      if (funnel.sub_audiences) {
        try {
          const parsed = funnel.sub_audiences as unknown;
          subAudiences = Array.isArray(parsed) ? parsed as ValueEquationData['subAudiences'] : [];
        } catch {
          subAudiences = [];
        }
      }

      setAudienceData({
        niche: funnel.niche || '',
        targetAudience: funnel.target_audience || '',
        subAudiences,
        specificityScore: (funnel as any).specificity_score || 0,
        desiredOutcome: funnel.desired_outcome || '',
        primaryPainPoint: funnel.primary_pain_point || '',
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
            sub_audiences: audienceData.subAudiences,
            specificity_score: audienceData.specificityScore,
            desired_outcome: audienceData.desiredOutcome,
            primary_pain_point: audienceData.primaryPainPoint,
            problem_statement: audienceData.problemStatement,
          } as any)
          .eq('id', funnel.id);
        if (error) throw error;
      } else {
        // No funnel exists - redirect to funnel type first
        navigate(`/projects/${projectId}/funnel-type`);
        return;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel', projectId] });
    },
    onError: (error) => {
      console.error("Error saving:", error);
    },
  });

  const handleSaveAndContinue = async () => {
    await saveMutation.mutateAsync();
    navigate(`/projects/${projectId}/transformation`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
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
    audienceData.desiredOutcome
  );

  return (
    <div className="space-y-6">
      <PlanPageHeader
        title="Value Equation Builder"
        description="Define your audience using Alex Hormozi's Value Equation framework"
      />

      {/* Audience Profile Card - Live Preview */}
      <AudienceProfileCard
        niche={audienceData.niche}
        targetAudience={audienceData.targetAudience}
        primaryPainPoint={audienceData.primaryPainPoint}
        desiredOutcome={audienceData.desiredOutcome}
        specificityScore={audienceData.specificityScore}
      />

      {/* Tab-based Value Equation Form */}
      <ValueEquationTabs
        data={audienceData}
        onChange={setAudienceData}
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
  );
};

export default AudienceContent;
