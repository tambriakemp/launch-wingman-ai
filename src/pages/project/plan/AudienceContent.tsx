import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { AudienceProfileCard } from "@/components/audience/AudienceProfileCard";
import { ValueEquationSections, ValueEquationData } from "@/components/audience/ValueEquationSections";
import { useState, useEffect, useRef, useCallback } from "react";

interface Props {
  projectId: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

const AudienceContent = ({ projectId }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [audienceData, setAudienceData] = useState<ValueEquationData>({
    niche: '',
    targetAudience: '',
    subAudiences: [],
    specificityScore: 0,
    desiredOutcome: '',
    primaryPainPoint: '',
    painSymptoms: [],
    problemStatement: '',
    mainObjections: '',
    likelihoodElements: [],
    timeEffortElements: [],
  });

  // Track if initial load is done to avoid auto-save on first render
  const [isInitialized, setIsInitialized] = useState(false);

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

      // Parse pain_symptoms from jsonb
      let painSymptoms: string[] = [];
      if ((funnel as any).pain_symptoms) {
        try {
          const parsed = (funnel as any).pain_symptoms as unknown;
          painSymptoms = Array.isArray(parsed) ? parsed as string[] : [];
        } catch {
          painSymptoms = [];
        }
      }

      // Parse likelihood_elements from jsonb
      let likelihoodElements: ValueEquationData['likelihoodElements'] = [];
      if ((funnel as any).likelihood_elements) {
        try {
          const parsed = (funnel as any).likelihood_elements as unknown;
          likelihoodElements = Array.isArray(parsed) ? parsed as ValueEquationData['likelihoodElements'] : [];
        } catch {
          likelihoodElements = [];
        }
      }

      // Parse time_effort_elements from jsonb
      let timeEffortElements: ValueEquationData['timeEffortElements'] = [];
      if ((funnel as any).time_effort_elements) {
        try {
          const parsed = (funnel as any).time_effort_elements as unknown;
          timeEffortElements = Array.isArray(parsed) ? parsed as ValueEquationData['timeEffortElements'] : [];
        } catch {
          timeEffortElements = [];
        }
      }

      setAudienceData({
        niche: funnel.niche || '',
        targetAudience: funnel.target_audience || '',
        subAudiences,
        specificityScore: (funnel as any).specificity_score || 0,
        desiredOutcome: funnel.desired_outcome || '',
        primaryPainPoint: funnel.primary_pain_point || '',
        painSymptoms,
        problemStatement: funnel.problem_statement || '',
        mainObjections: (funnel as any).main_objections || '',
        likelihoodElements,
        timeEffortElements,
      });

      // Mark as initialized after data is loaded
      setTimeout(() => setIsInitialized(true), 100);
    }
  }, [funnel]);

  // Auto-save function
  const performSave = useCallback(async () => {
    if (!user || !projectId || !funnel) return;

    setSaveStatus('saving');

    try {
      const { error } = await supabase
        .from('funnels')
        .update({
          niche: audienceData.niche,
          target_audience: audienceData.targetAudience,
          sub_audiences: audienceData.subAudiences,
          specificity_score: audienceData.specificityScore,
          desired_outcome: audienceData.desiredOutcome,
          primary_pain_point: audienceData.primaryPainPoint,
          pain_symptoms: audienceData.painSymptoms,
          problem_statement: audienceData.problemStatement,
          main_objections: audienceData.mainObjections,
          likelihood_elements: audienceData.likelihoodElements,
          time_effort_elements: audienceData.timeEffortElements,
        } as any)
        .eq('id', funnel.id);

      if (error) throw error;

      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['funnel', projectId] });

      // Reset to idle after 2 seconds
      statusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error("Error auto-saving:", error);
      setSaveStatus('idle');
    }
  }, [audienceData, funnel, projectId, user, queryClient]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!isInitialized || !funnel) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }

    // Set new timeout for auto-save (1.5 seconds)
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [audienceData, isInitialized, funnel, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  // Manual save mutation (for explicit save button)
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
            pain_symptoms: audienceData.painSymptoms,
            problem_statement: audienceData.problemStatement,
            main_objections: audienceData.mainObjections,
            likelihood_elements: audienceData.likelihoodElements,
            time_effort_elements: audienceData.timeEffortElements,
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
      setSaveStatus('saved');
      statusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
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
      {/* Header with Save Status */}
      <div className="flex items-start justify-between">
        <PlanPageHeader
          title="Value Equation Builder"
          description="Define your audience using the Value Equation framework"
        />
        {/* Auto-save Status Indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[100px] justify-end">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-500">Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Audience Profile Card - Live Preview */}
      <AudienceProfileCard
        niche={audienceData.niche}
        targetAudience={audienceData.targetAudience}
        primaryPainPoint={audienceData.primaryPainPoint}
        desiredOutcome={audienceData.desiredOutcome}
        specificityScore={audienceData.specificityScore}
        likelihoodElements={audienceData.likelihoodElements}
      />

      {/* Value Equation Sections */}
      <ValueEquationSections
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
  );
};

export default AudienceContent;