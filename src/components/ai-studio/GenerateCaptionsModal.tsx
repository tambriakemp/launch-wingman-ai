import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle2, Sparkles, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Offer {
  id: string;
  title: string;
  description: string | null;
  niche: string | null;
  target_audience: string | null;
  primary_pain_point: string | null;
  desired_outcome: string | null;
  problem_statement: string | null;
  transformation_statement: string | null;
  project_id: string;
}

interface Project {
  id: string;
  name: string;
}

interface ContextData {
  niche?: string;
  targetAudience?: string;
  painPoint?: string;
  desiredOutcome?: string;
  problemStatement?: string;
  transformationStatement?: string;
  coreMessage?: string;
  talkingPoints?: string;
  offerTitle?: string;
  offerDescription?: string;
}

interface GenerateCaptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sceneCount: number;
  onApplyCaptions: (captions: string[]) => void;
}

const GenerateCaptionsModal: React.FC<GenerateCaptionsModalProps> = ({
  open, onOpenChange, sceneCount, onApplyCaptions,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [inputMode, setInputMode] = useState<'offer' | 'custom'>('offer');

  const [contextComplete, setContextComplete] = useState<boolean | null>(null);
  const [contextData, setContextData] = useState<ContextData>({});
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  const [captions, setCaptions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'select' | 'review'>('select');

  // Load projects
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setProjects(data || []);
    };
    load();
  }, [open]);

  // Load offers + context when project selected
  useEffect(() => {
    if (!selectedProjectId) {
      setOffers([]);
      setContextComplete(null);
      setContextData({});
      return;
    }
    const load = async () => {
      setIsLoadingContext(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch offers
      const { data: offerData } = await supabase
        .from('offers')
        .select('id, title, description, niche, target_audience, primary_pain_point, desired_outcome, problem_statement, transformation_statement, project_id')
        .eq('project_id', selectedProjectId)
        .eq('user_id', user.id);
      setOffers((offerData as Offer[]) || []);

      // Check planning/messaging task completion
      const { data: tasks } = await supabase
        .from('project_tasks')
        .select('task_id, status, input_data')
        .eq('project_id', selectedProjectId)
        .eq('user_id', user.id);

      const relevantTasks = (tasks || []).filter(
        (t: any) => t.task_id.startsWith('planning_') || t.task_id.startsWith('messaging_')
      );
      const completedCount = relevantTasks.filter((t: any) => t.status === 'completed').length;
      setContextComplete(relevantTasks.length === 0 ? null : completedCount / relevantTasks.length >= 0.5);

      // Extract context from completed tasks
      const ctx: ContextData = {};
      for (const t of relevantTasks) {
        if (t.status !== 'completed' || !t.input_data) continue;
        const d = t.input_data as Record<string, any>;
        // Merge any relevant fields
        if (d.coreMessage) ctx.coreMessage = d.coreMessage;
        if (d.core_message) ctx.coreMessage = d.core_message;
        if (d.talkingPoints) ctx.talkingPoints = Array.isArray(d.talkingPoints) ? d.talkingPoints.join(', ') : d.talkingPoints;
        if (d.talking_points) ctx.talkingPoints = Array.isArray(d.talking_points) ? d.talking_points.join(', ') : d.talking_points;
      }

      // Also get funnel data for richer context
      const { data: funnel } = await supabase
        .from('funnels')
        .select('niche, target_audience, primary_pain_point, desired_outcome, problem_statement')
        .eq('project_id', selectedProjectId)
        .maybeSingle();
      if (funnel) {
        if (funnel.niche) ctx.niche = funnel.niche;
        if (funnel.target_audience) ctx.targetAudience = funnel.target_audience;
        if (funnel.primary_pain_point) ctx.painPoint = funnel.primary_pain_point;
        if (funnel.desired_outcome) ctx.desiredOutcome = funnel.desired_outcome;
        if (funnel.problem_statement) ctx.problemStatement = funnel.problem_statement;
      }

      // Get project transformation statement
      const { data: proj } = await supabase
        .from('projects')
        .select('transformation_statement')
        .eq('id', selectedProjectId)
        .maybeSingle();
      if (proj?.transformation_statement) ctx.transformationStatement = proj.transformation_statement;

      setContextData(ctx);
      setIsLoadingContext(false);
    };
    load();
  }, [selectedProjectId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const selectedOffer = offers.find(o => o.id === selectedOfferId);
      const enrichedContext: ContextData = { ...contextData };
      if (selectedOffer) {
        enrichedContext.offerTitle = selectedOffer.title;
        enrichedContext.offerDescription = selectedOffer.description || undefined;
        if (selectedOffer.niche) enrichedContext.niche = selectedOffer.niche;
        if (selectedOffer.target_audience) enrichedContext.targetAudience = selectedOffer.target_audience;
        if (selectedOffer.primary_pain_point) enrichedContext.painPoint = selectedOffer.primary_pain_point;
        if (selectedOffer.desired_outcome) enrichedContext.desiredOutcome = selectedOffer.desired_outcome;
        if (selectedOffer.transformation_statement) enrichedContext.transformationStatement = selectedOffer.transformation_statement;
      }

      const topic = inputMode === 'custom' ? customTopic : (selectedOffer?.title || '');

      const { data, error } = await supabase.functions.invoke('generate-image-captions', {
        body: { topic, sceneCount, contextData: enrichedContext },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.captions || !Array.isArray(data.captions)) throw new Error('Invalid response');

      setCaptions(data.captions.slice(0, sceneCount));
      setStep('review');
    } catch (e: any) {
      toast({ title: 'Error generating captions', description: e.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    onApplyCaptions(captions);
    onOpenChange(false);
    // Reset
    setStep('select');
    setCaptions([]);
    toast({ title: 'Captions applied', description: `${captions.length} captions added as text overlays.` });
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('select');
    setCaptions([]);
  };

  const canGenerate = inputMode === 'custom' ? customTopic.trim().length > 0 : !!selectedOfferId;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Image Captions
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? `Generate ${sceneCount} sequential captions that build on each other, ending with a CTA.`
              : 'Review and edit your captions before applying.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' ? (
          <div className="space-y-4">
            {/* Project selector */}
            <div>
              <Label className="text-xs font-medium">Select a project</Label>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value || null);
                  setSelectedOfferId(null);
                }}
                className="w-full mt-1.5 bg-background border border-input rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Choose a project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Context status banner */}
            {selectedProjectId && contextComplete !== null && !contextComplete && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Complete your <strong>Planning</strong> and <strong>Messaging</strong> tasks for richer, more on-brand captions. The AI uses that context to write better copy.
                </p>
              </div>
            )}
            {selectedProjectId && contextComplete === true && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                <p className="text-xs text-green-700 dark:text-green-400">Planning & Messaging context loaded.</p>
              </div>
            )}

            {/* Input mode toggle */}
            {selectedProjectId && (
              <div>
                <div className="flex gap-1 p-0.5 bg-muted rounded-lg border border-border/50 mb-3">
                  <button
                    onClick={() => setInputMode('offer')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                      inputMode === 'offer' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Select Offer
                  </button>
                  <button
                    onClick={() => setInputMode('custom')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                      inputMode === 'custom' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Custom Topic
                  </button>
                </div>

                {inputMode === 'offer' ? (
                  <div className="space-y-2">
                    {isLoadingContext ? (
                      <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Loading offers...</span>
                      </div>
                    ) : offers.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No offers found for this project. Use a custom topic instead.
                      </p>
                    ) : (
                      offers.map(offer => (
                        <button
                          key={offer.id}
                          onClick={() => setSelectedOfferId(offer.id === selectedOfferId ? null : offer.id)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                            selectedOfferId === offer.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-border/80'
                          }`}
                        >
                          <p className="text-sm font-medium text-foreground">{offer.title}</p>
                          {offer.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{offer.description}</p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div>
                    <Textarea
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="What should the captions be about? e.g. 'My new coaching program that helps busy moms lose weight without dieting'"
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Review step */
          <div className="space-y-3">
            {captions.map((caption, i) => (
              <div key={i} className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Slide {i + 1}{i === captions.length - 1 ? ' (CTA)' : ''}
                </Label>
                <Textarea
                  value={caption}
                  onChange={(e) => {
                    const updated = [...captions];
                    updated[i] = e.target.value;
                    setCaptions(updated);
                  }}
                  className="min-h-[60px] text-sm"
                />
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'select' ? (
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating || !selectedProjectId}
              className="w-full"
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate {sceneCount} Captions</>
              )}
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleApply} className="flex-1">
                Apply to Images
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateCaptionsModal;
