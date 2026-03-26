import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ProjectLayout } from '@/components/layout/ProjectLayout';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Loader2, Rocket, ArrowRight, ArrowLeft, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { FunnelDiagram } from '@/components/funnel/FunnelDiagram';
import { LAUNCH_PATH_FUNNEL_STEPS } from '@/data/launchPathFunnels';
import { getDeltaTasksForFunnel } from '@/data/funnelDeltaTasks';
import { getUniversalTasks } from '@/data/taskTemplates';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

interface LastProjectInfo {
  id: string;
  name: string;
}

const FUNNEL_OPTIONS = [
  {
    value: 'content_to_offer',
    label: 'Content → Offer',
    description: 'Share content that leads directly to your offer — simple and direct',
  },
  {
    value: 'freebie_email_offer',
    label: 'Freebie → Email → Offer',
    description: 'Offer something free to build your list, then nurture with emails',
  },
  {
    value: 'live_training_offer',
    label: 'Live Training → Offer',
    description: 'Teach something valuable live, then invite viewers to join your program',
  },
  {
    value: 'application_call',
    label: 'Application → Call',
    description: 'Qualify leads through an application, then close on a call',
  },
  {
    value: 'membership',
    label: 'Membership',
    description: 'An ongoing subscription where members receive continuous value over time, rather than a one-time outcome',
  },
  {
    value: 'challenge',
    label: 'Challenge',
    description: 'A short, time-bound experience designed to help people take focused action and experience momentum within a defined window',
  },
  {
    value: 'launch',
    label: 'Launch',
    description: 'A time-bound window where your offer is introduced, explained, and made available for a limited period',
  },
];

const AppRedirect = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(searchParams.get('new') === '1');
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Wizard state
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFunnelType, setSelectedFunnelType] = useState<string | null>(null);

  const { tier, hasAdminAccess } = useFeatureAccess();
  const FREE_FUNNEL_TYPES = ['content_to_offer', 'freebie_email_offer'];
  const isPro = tier === 'pro' || tier === 'advanced' || tier === 'admin' || hasAdminAccess;

  // Routing logic

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading) return;

      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking onboarding status:', error);
        }

        if (!profile?.onboarding_completed_at) {
          navigate('/onboarding', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const redirectToProject = async () => {
      if (authLoading || checkingOnboarding) return;
      if (searchParams.get('new') === '1') { setChecking(false); return; }
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      const stored = localStorage.getItem('lastProjectInfo');
      if (stored) {
        try {
          const lastProject: LastProjectInfo = JSON.parse(stored);
          if (lastProject.id) {
            const { data: existingProject } = await supabase
              .from('projects')
              .select('id')
              .eq('id', lastProject.id)
              .eq('user_id', user.id)
              .maybeSingle();

            if (existingProject) {
              navigate(`/projects/${lastProject.id}/dashboard`, { replace: true });
              return;
            } else {
              localStorage.removeItem('lastProjectInfo');
            }
          }
        } catch (e) {
          // Invalid JSON, continue to fetch
        }
      }

      try {
        const { data: projects, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (projects && projects.length > 0) {
          localStorage.setItem('lastProjectInfo', JSON.stringify({
            id: projects[0].id,
            name: projects[0].name
          }));
          navigate(`/projects/${projects[0].id}/dashboard`, { replace: true });
        } else {
          setShowCreateProject(true);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setShowCreateProject(true);
      } finally {
        setChecking(false);
      }
    };

    redirectToProject();
  }, [user, authLoading, navigate, checkingOnboarding]);

  // Project creation

  const handleCreateProject = async (overrideFunnelType?: string | null) => {
    if (!projectName.trim() || !user) return;

    const funnelToUse = overrideFunnelType !== undefined ? overrideFunnelType : selectedFunnelType;

    setIsCreating(true);
    try {
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name: projectName.trim(),
          user_id: user.id,
          status: 'active',
          project_type: 'launch',
          selected_funnel_type: funnelToUse,
        })
        .select('id, name')
        .single();

      if (error) throw error;

      if (funnelToUse) {
        // Mark planning_choose_launch_path as completed
        await supabase.from('project_tasks').insert({
          project_id: newProject.id,
          user_id: user.id,
          task_id: 'planning_choose_launch_path',
          status: 'completed',
          input_data: { selected: funnelToUse },
          completed_at: new Date().toISOString(),
        });

        // Create funnels row
        await supabase.from('funnels').insert({
          project_id: newProject.id,
          user_id: user.id,
          funnel_type: funnelToUse,
        });

        // Inject universal tasks for non-planning/messaging phases + funnel delta tasks
        const universalTasks = getUniversalTasks().filter(
          t => t.phase !== 'planning' && t.phase !== 'messaging'
        );
        const deltaTasks = getDeltaTasksForFunnel(funnelToUse as any);
        const allTasksToInject = [...universalTasks, ...deltaTasks];

        if (allTasksToInject.length > 0) {
          await supabase.from('project_tasks').insert(
            allTasksToInject.map(t => ({
              project_id: newProject.id,
              user_id: user.id,
              task_id: t.taskId,
              status: 'not_started',
            }))
          );
        }
      }

      localStorage.setItem('lastProjectInfo', JSON.stringify({
        id: newProject.id,
        name: newProject.name,
      }));

      toast.success('Project created!');

      supabase.functions.invoke('send-notification-email', {
        body: {
          email_type: 'project_created',
          user_id: user.id,
          data: { projectId: newProject.id, projectName: newProject.name },
        },
      }).catch((err) => console.error('Failed to send project created email:', err));

      navigate(`/projects/${newProject.id}/dashboard`, { replace: true });
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  // Loading state

  if (authLoading || checking || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Project creation wizard

  if (showCreateProject) {
    return (
      <ProjectLayout>
        <div className="flex-1 flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="text-center max-w-md space-y-6"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Rocket className="w-7 h-7 text-primary" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-foreground">Let's set up your launch</h1>
                  <p className="text-muted-foreground">
                    Give your project a name — this is just for you.
                  </p>
                </div>

                <div className="space-y-3 w-full">
                  <Input
                    placeholder="e.g., Q1 Launch, Coaching Program"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && projectName.trim() && setStep(2)}
                    autoFocus
                  />
                  <Button
                    className="w-full"
                    onClick={() => setStep(2)}
                    disabled={!projectName.trim()}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="max-w-xl w-full space-y-6"
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-foreground">How are you planning to sell?</h1>
                  <p className="text-muted-foreground">
                    This shapes your entire task list. Choose the path that fits where you are now — you can change it later.
                  </p>
                </div>

                <RadioGroup
                  value={selectedFunnelType || ''}
                  onValueChange={(value) => {
                    const isLocked = !isPro && !FREE_FUNNEL_TYPES.includes(value);
                    if (isLocked) return;
                    setSelectedFunnelType(value);
                  }}
                  className="space-y-3"
                >
                  {FUNNEL_OPTIONS.map((option) => {
                    const funnelConfig = LAUNCH_PATH_FUNNEL_STEPS[option.value];
                    const isSelected = selectedFunnelType === option.value;
                    const isLocked = !isPro && !FREE_FUNNEL_TYPES.includes(option.value);

                    return (
                      <div key={option.value}>
                        <Label
                          htmlFor={option.value}
                          className={`flex flex-col gap-0 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : isLocked
                              ? 'border-border/50 opacity-60 cursor-not-allowed'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value={option.value} id={option.value} disabled={isLocked} />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">
                                  {option.label}
                                </span>
                                {isLocked && (
                                  <Crown className="w-4 h-4 text-amber-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {option.description}
                              </p>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isSelected && funnelConfig && !isLocked && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t border-border/50">
                                  <FunnelDiagram
                                    steps={funnelConfig.steps}
                                    color={funnelConfig.color}
                                    bgColor={funnelConfig.bgColor}
                                  />
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Offer Slots: {funnelConfig.offerSlots}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>

                <p className="text-sm text-muted-foreground text-center">
                  Not sure yet?{' '}
                  <button
                    className="text-primary underline hover:no-underline"
                    onClick={() => handleCreateProject(null)}
                    disabled={isCreating}
                  >
                    Skip this and choose later in your tasks
                  </button>
                </p>

                <Button
                  className="w-full"
                  onClick={() => handleCreateProject()}
                  disabled={!selectedFunnelType || isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Project
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ProjectLayout>
    );
  }

  return null;
};

export default AppRedirect;
