import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TransformationBuilder } from "@/components/transformation/TransformationBuilder";
import { TransformationStyle } from "@/components/transformation/StyleSelector";
import { TransformationVersionsData } from "@/components/transformation/TransformationVersions";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { useState, useEffect, useCallback } from "react";

interface PainSymptom {
  id: string;
  text: string;
}

interface LikelihoodElement {
  id: string;
  type: 'objection_counter' | 'proof' | 'credibility';
  text: string;
}

interface TimeEffortElement {
  id: string;
  type: 'quick_win' | 'friction_reducer';
  text: string;
}

interface Props {
  projectId: string;
}

const TransformationContent = ({ projectId }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Transformation state
  const [transformationStatement, setTransformationStatement] = useState('');
  const [transformationStyle, setTransformationStyle] = useState<TransformationStyle>('practical');
  const [transformationVersions, setTransformationVersions] = useState<TransformationVersionsData | null>(null);
  const [primaryVersion, setPrimaryVersion] = useState<'one_liner' | 'standard' | 'expanded'>('standard');
  const [isLocked, setIsLocked] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Audience data state
  const [audienceData, setAudienceData] = useState({
    niche: '',
    targetAudience: '',
    primaryPainPoint: '',
    painSymptoms: [] as PainSymptom[],
    desiredOutcome: '',
    mainObjections: '',
    likelihoodElements: [] as LikelihoodElement[],
    timeEffortElements: [] as TimeEffortElement[],
    specificityScore: 0,
  });

  // Fetch funnel data for audience info
  const { data: funnel, isLoading: funnelLoading } = useQuery({
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

  // Fetch project data for transformation
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project-transformation', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('transformation_statement, transformation_style, transformation_locked, transformation_versions')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Initialize audience data from funnel
  useEffect(() => {
    if (funnel) {
      const parsePainSymptoms = (data: unknown): PainSymptom[] => {
        if (!data || !Array.isArray(data)) return [];
        return data.map((item: unknown) => {
          if (typeof item === 'object' && item !== null && 'id' in item && 'text' in item) {
            return item as PainSymptom;
          }
          return { id: crypto.randomUUID(), text: String(item) };
        });
      };

      const parseLikelihoodElements = (data: unknown): LikelihoodElement[] => {
        if (!data || !Array.isArray(data)) return [];
        return data.filter((item): item is LikelihoodElement => 
          typeof item === 'object' && 
          item !== null && 
          'id' in item && 
          'type' in item && 
          'text' in item
        );
      };

      const parseTimeEffortElements = (data: unknown): TimeEffortElement[] => {
        if (!data || !Array.isArray(data)) return [];
        return data.filter((item): item is TimeEffortElement => 
          typeof item === 'object' && 
          item !== null && 
          'id' in item && 
          'type' in item && 
          'text' in item
        );
      };

      setAudienceData({
        niche: funnel.niche || '',
        targetAudience: funnel.target_audience || '',
        primaryPainPoint: funnel.primary_pain_point || '',
        painSymptoms: parsePainSymptoms(funnel.pain_symptoms),
        desiredOutcome: funnel.desired_outcome || '',
        mainObjections: funnel.main_objections || '',
        likelihoodElements: parseLikelihoodElements(funnel.likelihood_elements),
        timeEffortElements: parseTimeEffortElements(funnel.time_effort_elements),
        specificityScore: funnel.specificity_score || 0,
      });
    }
  }, [funnel]);

  // Initialize transformation data from project
  useEffect(() => {
    if (project) {
      if (project.transformation_statement) {
        setTransformationStatement(project.transformation_statement);
      }
      if (project.transformation_style) {
        setTransformationStyle(project.transformation_style as TransformationStyle);
      }
      if (project.transformation_locked !== null) {
        setIsLocked(project.transformation_locked);
      }
      if (project.transformation_versions) {
        const versions = project.transformation_versions as unknown as TransformationVersionsData;
        setTransformationVersions(versions);
        // Determine primary version from statement match
        if (project.transformation_statement) {
          if (versions.one_liner === project.transformation_statement) {
            setPrimaryVersion('one_liner');
          } else if (versions.expanded === project.transformation_statement) {
            setPrimaryVersion('expanded');
          } else {
            setPrimaryVersion('standard');
          }
        }
      }
    }
  }, [project]);

  // Auto-save with debounce
  const performSave = useCallback(async () => {
    if (!user || !projectId) return;
    
    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          transformation_statement: transformationStatement,
          transformation_style: transformationStyle,
          transformation_locked: isLocked,
          transformation_versions: transformationVersions ? JSON.parse(JSON.stringify(transformationVersions)) : null,
        })
        .eq('id', projectId);
      
      if (error) throw error;
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['project-transformation', projectId] });
    } catch (error) {
      console.error("Error saving:", error);
      setSaveStatus('idle');
    }
  }, [user, projectId, transformationStatement, transformationStyle, isLocked, transformationVersions, queryClient]);

  // Debounced auto-save
  useEffect(() => {
    if (!project) return; // Don't save until initial data is loaded

    const timer = setTimeout(() => {
      performSave();
    }, 1500);

    return () => clearTimeout(timer);
  }, [transformationStatement, transformationStyle, isLocked, transformationVersions, performSave, project]);

  // Reset save status after showing "saved"
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleSaveAndContinue = async () => {
    await performSave();
    navigate(`/projects/${projectId}/offers`);
  };

  if (funnelLoading || projectLoading) {
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
      <div className="flex items-center justify-between">
        <PlanPageHeader
          title="Transformation Statement"
          description="Turn your audience insights into powerful messaging"
        />
        {saveStatus !== 'idle' && (
          <span className="text-xs text-muted-foreground">
            {saveStatus === 'saving' ? 'Saving...' : 'Saved ✓'}
          </span>
        )}
      </div>

      {/* Transformation Builder */}
      <TransformationBuilder
        audienceData={audienceData}
        funnelType={funnel.funnel_type}
        initialStyle={transformationStyle}
        initialVersions={transformationVersions}
        initialPrimaryVersion={primaryVersion}
        initialLocked={isLocked}
        onStyleChange={setTransformationStyle}
        onVersionsChange={setTransformationVersions}
        onPrimaryVersionChange={setPrimaryVersion}
        onLockedChange={setIsLocked}
        onStatementChange={setTransformationStatement}
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
            onClick={handleSaveAndContinue}
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransformationContent;
