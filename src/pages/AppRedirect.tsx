import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sparkles, Plus, Loader2, Rocket, CalendarIcon, Clock, Coffee, Package, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, addWeeks, subWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import { APP_LEVEL_LEARN_MORE } from '@/data/taskLearnMoreLinks';

interface LastProjectInfo {
  id: string;
  name: string;
}

interface LaunchDates {
  prelaunchStart: Date | undefined;
  contentCreationStart: Date | undefined;
  enrollmentOpens: Date | undefined;
  enrollmentCloses: Date | undefined;
  programDeliveryStart: Date | undefined;
  programDeliveryEnd: Date | undefined;
  restPeriodStart: Date | undefined;
  restPeriodEnd: Date | undefined;
}

const DEFAULT_PROGRAM_WEEKS = 8;
const DEFAULT_REST_WEEKS = 2;
const PRELAUNCH_WEEKS = 7;
const CONTENT_CREATION_WEEKS = 2;

const DatePickerField = ({
  label,
  date,
  onChange,
  icon,
  description,
}: {
  label: string;
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
  icon: React.ReactNode;
  description?: string;
}) => (
  <div className="flex items-center gap-3 py-3 border-b last:border-b-0">
    <div className="text-muted-foreground">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{label}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "justify-start text-left font-normal h-8 px-2",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
          {date ? format(date, "MMM d, yyyy") : "Set date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          defaultMonth={date}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  </div>
);

const AppRedirect = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [programWeeks, setProgramWeeks] = useState(DEFAULT_PROGRAM_WEEKS);
  const [restWeeks, setRestWeeks] = useState(DEFAULT_REST_WEEKS);
  const [dates, setDates] = useState<LaunchDates>({
    prelaunchStart: undefined,
    contentCreationStart: undefined,
    enrollmentOpens: undefined,
    enrollmentCloses: undefined,
    programDeliveryStart: undefined,
    programDeliveryEnd: undefined,
    restPeriodStart: undefined,
    restPeriodEnd: undefined,
  });

  const calculateDatesFromPrelaunch = (prelaunch: Date, weeks: number, rest: number) => {
    const contentCreation = subWeeks(prelaunch, CONTENT_CREATION_WEEKS);
    const enrollmentOpen = addWeeks(prelaunch, PRELAUNCH_WEEKS);
    const enrollmentClose = addWeeks(enrollmentOpen, 1);
    const programStart = enrollmentClose;
    const programEnd = addWeeks(programStart, weeks);
    const restStart = programEnd;
    const restEnd = addWeeks(restStart, rest);

    return {
      contentCreationStart: contentCreation,
      enrollmentOpens: enrollmentOpen,
      enrollmentCloses: enrollmentClose,
      programDeliveryStart: programStart,
      programDeliveryEnd: programEnd,
      restPeriodStart: restStart,
      restPeriodEnd: restEnd,
    };
  };

  useEffect(() => {
    if (dates.prelaunchStart) {
      const calculatedDates = calculateDatesFromPrelaunch(dates.prelaunchStart, programWeeks, restWeeks);
      setDates(prev => ({
        ...prev,
        ...calculatedDates,
      }));
    }
  }, [dates.prelaunchStart, programWeeks, restWeeks]);

  useEffect(() => {
    const redirectToProject = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      // Check localStorage for last project
      const stored = localStorage.getItem('lastProjectInfo');
      if (stored) {
        try {
          const lastProject: LastProjectInfo = JSON.parse(stored);
          if (lastProject.id) {
            // Verify project still exists
            const { data: existingProject } = await supabase
              .from('projects')
              .select('id')
              .eq('id', lastProject.id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (existingProject) {
              navigate(`/projects/${lastProject.id}/offer`, { replace: true });
              return;
            } else {
              // Clear invalid localStorage
              localStorage.removeItem('lastProjectInfo');
            }
          }
        } catch (e) {
          // Invalid JSON, continue to fetch
        }
      }

      // No stored project - fetch most recent project
      try {
        const { data: projects, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (projects && projects.length > 0) {
          // Save to localStorage for next time
          localStorage.setItem('lastProjectInfo', JSON.stringify({
            id: projects[0].id,
            name: projects[0].name
          }));
          navigate(`/projects/${projects[0].id}/offer`, { replace: true });
        } else {
          // No projects exist - show create project UI
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
  }, [user, authLoading, navigate]);

  const handleNextStep = () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    setStep(2);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim() || !user) return;

    setIsCreating(true);
    try {
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name: projectName.trim(),
          user_id: user.id,
          status: 'active',
          project_type: 'launch'
        })
        .select('id, name')
        .single();

      if (error) throw error;

      // If launch dates provided, create launch event
      if (dates.prelaunchStart) {
        const { error: eventError } = await supabase.from("launch_events").insert({
          title: projectName.trim(),
          event_type: "launch",
          project_id: newProject.id,
          user_id: user.id,
          prelaunch_start: dates.prelaunchStart.toISOString().split('T')[0],
          content_creation_start: dates.contentCreationStart?.toISOString().split('T')[0],
          enrollment_opens: dates.enrollmentOpens?.toISOString().split('T')[0],
          enrollment_closes: dates.enrollmentCloses?.toISOString().split('T')[0],
          program_delivery_start: dates.programDeliveryStart?.toISOString().split('T')[0],
          program_delivery_end: dates.programDeliveryEnd?.toISOString().split('T')[0],
          rest_period_start: dates.restPeriodStart?.toISOString().split('T')[0],
          rest_period_end: dates.restPeriodEnd?.toISOString().split('T')[0],
          program_weeks: programWeeks,
          rest_weeks: restWeeks,
        });

        if (eventError) {
          console.error("Error creating launch event:", eventError);
          // Don't throw - project still created successfully
        }
      }

      // Save to localStorage
      localStorage.setItem('lastProjectInfo', JSON.stringify({
        id: newProject.id,
        name: newProject.name
      }));

      toast.success('Project created!');
      navigate(`/projects/${newProject.id}/offer`, { replace: true });
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSkipTimeline = () => {
    // Reset dates and create project without timeline
    setDates({
      prelaunchStart: undefined,
      contentCreationStart: undefined,
      enrollmentOpens: undefined,
      enrollmentCloses: undefined,
      programDeliveryStart: undefined,
      programDeliveryEnd: undefined,
      restPeriodStart: undefined,
      restPeriodEnd: undefined,
    });
    handleCreateProject();
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showCreateProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-6 h-6 text-accent-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {step === 1 ? "Welcome to Launchely!" : "Set Launch Timeline"}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "Let's create your first project to get started."
                : "Set your prelaunch start date and we'll suggest the rest (optional)"}
            </CardDescription>
            {step === 1 && (
              <a
                href={`https://docs.lovable.dev`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors inline-flex items-center gap-1 mt-2"
              >
                <HelpCircle className="w-3 h-3" />
                How Launchely works
              </a>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    placeholder="e.g., Q1 Launch, Coaching Program"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                    autoFocus
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleNextStep}
                  disabled={!projectName.trim()}
                >
                  Continue
                </Button>
              </>
            ) : (
              <div className="space-y-6">
                {/* Prelaunch Start Date */}
                <div className="space-y-2">
                  <Label>Prelaunch Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dates.prelaunchStart && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dates.prelaunchStart ? format(dates.prelaunchStart, "PPP") : "Pick your prelaunch start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={dates.prelaunchStart}
                        onSelect={(date) => setDates(prev => ({ ...prev, prelaunchStart: date }))}
                        defaultMonth={dates.prelaunchStart}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    This is when you'll start building relationships (6-8 weeks before enrollment opens).
                  </p>
                </div>

                {/* Program & Rest Weeks */}
                {dates.prelaunchStart && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="programWeeks">Program Length (weeks)</Label>
                        <Input
                          id="programWeeks"
                          type="number"
                          min="1"
                          max="52"
                          value={programWeeks}
                          onChange={(e) => setProgramWeeks(parseInt(e.target.value) || DEFAULT_PROGRAM_WEEKS)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="restWeeks">Rest Period (weeks)</Label>
                        <Input
                          id="restWeeks"
                          type="number"
                          min="1"
                          max="12"
                          value={restWeeks}
                          onChange={(e) => setRestWeeks(parseInt(e.target.value) || DEFAULT_REST_WEEKS)}
                        />
                      </div>
                    </div>

                    {/* Suggested Timeline */}
                    <div className="space-y-4">
                      <span className="text-sm font-semibold">Suggested Timeline</span>
                      <div className="rounded-lg border bg-card px-2.5">
                        <DatePickerField
                          label="Content Creation Starts"
                          date={dates.contentCreationStart}
                          onChange={(d) => setDates(prev => ({ ...prev, contentCreationStart: d }))}
                          icon={<Sparkles className="w-4 h-4" />}
                          description="2 weeks before prelaunch"
                        />
                        <DatePickerField
                          label="Prelaunch Starts"
                          date={dates.prelaunchStart}
                          onChange={(d) => setDates(prev => ({ ...prev, prelaunchStart: d }))}
                          icon={<Rocket className="w-4 h-4" />}
                          description="Your selected start date"
                        />
                        <DatePickerField
                          label="Enrollment Opens"
                          date={dates.enrollmentOpens}
                          onChange={(d) => setDates(prev => ({ ...prev, enrollmentOpens: d }))}
                          icon={<Clock className="w-4 h-4" />}
                          description="7 weeks after prelaunch"
                        />
                        <DatePickerField
                          label="Program Delivery"
                          date={dates.programDeliveryStart}
                          onChange={(d) => setDates(prev => ({ ...prev, programDeliveryStart: d }))}
                          icon={<Package className="w-4 h-4" />}
                          description={`${programWeeks} weeks of delivery`}
                        />
                        <DatePickerField
                          label="Rest Period"
                          date={dates.restPeriodStart}
                          onChange={(d) => setDates(prev => ({ ...prev, restPeriodStart: d }))}
                          icon={<Coffee className="w-4 h-4" />}
                          description={`${restWeeks} weeks of recovery`}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline"
                    className="flex-1" 
                    onClick={handleSkipTimeline}
                    disabled={isCreating}
                  >
                    Skip for now
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleCreateProject}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create Project
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default AppRedirect;
