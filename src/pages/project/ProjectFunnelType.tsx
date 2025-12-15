import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FunnelTypeSelector } from "@/components/funnel/FunnelTypeSelector";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useState, useEffect } from "react";

const ProjectFunnelType = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedFunnelType, setSelectedFunnelType] = useState<string | null>(null);

  // Fetch existing funnel
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
    if (funnel?.funnel_type) {
      setSelectedFunnelType(funnel.funnel_type);
    }
  }, [funnel]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !projectId || !selectedFunnelType) throw new Error("Missing required data");

      const funnelData = {
        project_id: projectId,
        user_id: user.id,
        funnel_type: selectedFunnelType,
      };

      if (funnel) {
        const { error } = await supabase
          .from('funnels')
          .update({ funnel_type: selectedFunnelType })
          .eq('id', funnel.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('funnels')
          .insert(funnelData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel', projectId] });
      toast.success("Funnel type saved!");
    },
    onError: (error) => {
      console.error("Error saving:", error);
      toast.error("Failed to save");
    },
  });

  const handleSaveAndContinue = async () => {
    await saveMutation.mutateAsync();
    navigate(`/projects/${projectId}/audience`);
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

  return (
    <ProjectLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Select Funnel Type</h1>
            <p className="text-muted-foreground">
              Choose the type of funnel that best fits your business model
            </p>
          </div>
        </div>

        {/* Funnel Type Selector */}
        <FunnelTypeSelector
          selectedFunnelType={selectedFunnelType}
          onSelect={setSelectedFunnelType}
        />

        {/* Navigation */}
        <div className="flex items-center justify-end pt-4 border-t border-border gap-2">
          <Button
            variant="outline"
            onClick={() => saveMutation.mutate()}
            disabled={!selectedFunnelType || saveMutation.isPending}
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
            disabled={!selectedFunnelType || saveMutation.isPending}
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
    </ProjectLayout>
  );
};

export default ProjectFunnelType;
