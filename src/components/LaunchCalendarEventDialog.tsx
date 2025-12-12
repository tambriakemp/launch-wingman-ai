import { useState, useEffect } from "react";
import { format, addWeeks, subWeeks, parseISO } from "date-fns";
import { CalendarIcon, Plus, Rocket, Clock, Coffee, Package, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface LaunchEvent {
  id: string;
  title: string;
  event_type: string;
  content_creation_start: string | null;
  prelaunch_start: string | null;
  enrollment_opens: string | null;
  enrollment_closes: string | null;
  program_delivery_start: string | null;
  program_delivery_end: string | null;
  rest_period_start: string | null;
  rest_period_end: string | null;
  program_weeks?: number | null;
  rest_weeks?: number | null;
}

interface LaunchCalendarEventDialogProps {
  projectId: string;
  projectType: "launch" | "prelaunch";
  onEventAdded?: () => void;
  trigger?: React.ReactNode;
  editEvent?: LaunchEvent;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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

export function LaunchCalendarEventDialog({ 
  projectId,
  projectType,
  onEventAdded, 
  trigger,
  editEvent,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: LaunchCalendarEventDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;
  
  const isEditMode = !!editEvent;
  
  const [title, setTitle] = useState("");
  const [showDates, setShowDates] = useState(false);
  const [programWeeks, setProgramWeeks] = useState(DEFAULT_PROGRAM_WEEKS);
  const [restWeeks, setRestWeeks] = useState(DEFAULT_REST_WEEKS);
  const [isSaving, setIsSaving] = useState(false);
  
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

  useEffect(() => {
    if (editEvent && open) {
      setTitle(editEvent.title);
      setProgramWeeks(editEvent.program_weeks || DEFAULT_PROGRAM_WEEKS);
      setRestWeeks(editEvent.rest_weeks || DEFAULT_REST_WEEKS);
      
      const parsedDates: LaunchDates = {
        prelaunchStart: editEvent.prelaunch_start ? parseISO(editEvent.prelaunch_start) : undefined,
        contentCreationStart: editEvent.content_creation_start ? parseISO(editEvent.content_creation_start) : undefined,
        enrollmentOpens: editEvent.enrollment_opens ? parseISO(editEvent.enrollment_opens) : undefined,
        enrollmentCloses: editEvent.enrollment_closes ? parseISO(editEvent.enrollment_closes) : undefined,
        programDeliveryStart: editEvent.program_delivery_start ? parseISO(editEvent.program_delivery_start) : undefined,
        programDeliveryEnd: editEvent.program_delivery_end ? parseISO(editEvent.program_delivery_end) : undefined,
        restPeriodStart: editEvent.rest_period_start ? parseISO(editEvent.rest_period_start) : undefined,
        restPeriodEnd: editEvent.rest_period_end ? parseISO(editEvent.rest_period_end) : undefined,
      };
      
      setDates(parsedDates);
      setShowDates(!!parsedDates.prelaunchStart);
    }
  }, [editEvent, open]);

  useEffect(() => {
    if (!open && !isEditMode) {
      setTitle("");
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
      setProgramWeeks(DEFAULT_PROGRAM_WEEKS);
      setRestWeeks(DEFAULT_REST_WEEKS);
      setShowDates(false);
    }
  }, [open, isEditMode]);

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
    if (dates.prelaunchStart && !isEditMode) {
      const calculatedDates = calculateDatesFromPrelaunch(dates.prelaunchStart, programWeeks, restWeeks);
      
      setDates(prev => ({
        ...prev,
        contentCreationStart: prev.contentCreationStart || calculatedDates.contentCreationStart,
        enrollmentOpens: prev.enrollmentOpens || calculatedDates.enrollmentOpens,
        enrollmentCloses: prev.enrollmentCloses || calculatedDates.enrollmentCloses,
        programDeliveryStart: prev.programDeliveryStart || calculatedDates.programDeliveryStart,
        programDeliveryEnd: prev.programDeliveryEnd || calculatedDates.programDeliveryEnd,
        restPeriodStart: prev.restPeriodStart || calculatedDates.restPeriodStart,
        restPeriodEnd: prev.restPeriodEnd || calculatedDates.restPeriodEnd,
      }));
      
      setShowDates(true);
    }
  }, [dates.prelaunchStart, isEditMode]);

  const updateDate = (key: keyof LaunchDates, date: Date | undefined) => {
    setDates(prev => ({ ...prev, [key]: date }));
  };

  const recalculateDates = () => {
    if (dates.prelaunchStart) {
      const calculatedDates = calculateDatesFromPrelaunch(dates.prelaunchStart, programWeeks, restWeeks);
      setDates({
        prelaunchStart: dates.prelaunchStart,
        ...calculatedDates,
      });
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a launch title");
      return;
    }
    
    if (!dates.prelaunchStart) {
      toast.error("Please select a prelaunch start date");
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to save events");
        return;
      }

      const eventData = {
        title: title.trim(),
        event_type: projectType,
        prelaunch_start: dates.prelaunchStart?.toISOString().split('T')[0],
        content_creation_start: dates.contentCreationStart?.toISOString().split('T')[0],
        enrollment_opens: projectType === 'launch' ? dates.enrollmentOpens?.toISOString().split('T')[0] : null,
        enrollment_closes: projectType === 'launch' ? dates.enrollmentCloses?.toISOString().split('T')[0] : null,
        program_delivery_start: projectType === 'launch' ? dates.programDeliveryStart?.toISOString().split('T')[0] : null,
        program_delivery_end: projectType === 'launch' ? dates.programDeliveryEnd?.toISOString().split('T')[0] : null,
        rest_period_start: projectType === 'launch' ? dates.restPeriodStart?.toISOString().split('T')[0] : null,
        rest_period_end: projectType === 'launch' ? dates.restPeriodEnd?.toISOString().split('T')[0] : null,
        program_weeks: projectType === 'launch' ? programWeeks : null,
        rest_weeks: projectType === 'launch' ? restWeeks : null,
      };

      if (isEditMode && editEvent) {
        const { error } = await supabase
          .from("launch_events")
          .update(eventData)
          .eq("id", editEvent.id);

        if (error) {
          console.error("Error updating launch event:", error);
          toast.error("Failed to update launch event");
          return;
        }

        toast.success(`"${title}" updated successfully`);
      } else {
        const { error } = await supabase.from("launch_events").insert({
          ...eventData,
          project_id: projectId,
          user_id: user.id,
        });

        if (error) {
          console.error("Error saving launch event:", error);
          toast.error("Failed to save launch event");
          return;
        }

        toast.success(`${projectType === 'launch' ? 'Launch' : 'Prelaunch'} "${title}" added to calendar`);
      }
      
      setOpen(false);
      onEventAdded?.();
    } catch (err) {
      console.error("Error saving launch event:", err);
      toast.error("Failed to save launch event");
    } finally {
      setIsSaving(false);
    }
  };

  const DatePickerField = ({ 
    label, 
    date, 
    onChange,
    icon,
    description
  }: { 
    label: string; 
    date: Date | undefined; 
    onChange: (date: Date | undefined) => void;
    icon: React.ReactNode;
    description?: string;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="mt-1 text-muted-foreground flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Label className="text-sm font-medium">{label}</Label>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-full sm:w-[130px] flex-shrink-0 justify-start text-left font-normal text-xs",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1.5 h-3 w-3 flex-shrink-0" />
                <span className="truncate">{date ? format(date, "MMM d, yyyy") : "Select"}</span>
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
      </div>
    </div>
  );

  const dialogContent = (
    <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Edit Launch Event" : "Plan Your Launch"}</DialogTitle>
        <DialogDescription>
          {isEditMode 
            ? "Update the details of your launch event."
            : "Enter your launch title and prelaunch start date. We'll suggest dates for everything else."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="title">{projectType === 'launch' ? 'Launch' : 'Prelaunch'} Title</Label>
          <Input
            id="title"
            placeholder="e.g., Spring Cohort 2025"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

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
                onSelect={(date) => updateDate("prelaunchStart", date)}
                defaultMonth={dates.prelaunchStart}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            This is when you'll start building relationships and warming up your audience (6-8 weeks before enrollment opens).
          </p>
        </div>

        {dates.prelaunchStart && projectType === 'launch' && (
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
        )}

        {dates.prelaunchStart && projectType === 'launch' && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={recalculateDates}
            className="w-full"
            type="button"
          >
            Recalculate All Dates
          </Button>
        )}

        {showDates && dates.prelaunchStart && (
          <div className="space-y-4">
            <span className="text-sm font-semibold">Suggested Timeline</span>
            <div className="rounded-lg border bg-card px-2.5">
              <DatePickerField
                label="Content Creation Starts"
                date={dates.contentCreationStart}
                onChange={(d) => updateDate("contentCreationStart", d)}
                icon={<Sparkles className="w-4 h-4" />}
                description="2 weeks before prelaunch"
              />
              <DatePickerField
                label="Prelaunch Starts"
                date={dates.prelaunchStart}
                onChange={(d) => updateDate("prelaunchStart", d)}
                icon={<Rocket className="w-4 h-4" />}
                description="Your selected start date"
              />
              {projectType === 'launch' && (
                <>
                  <DatePickerField
                    label="Enrollment Opens"
                    date={dates.enrollmentOpens}
                    onChange={(d) => updateDate("enrollmentOpens", d)}
                    icon={<Rocket className="w-4 h-4" />}
                    description="~7 weeks after prelaunch"
                  />
                  <DatePickerField
                    label="Enrollment Closes"
                    date={dates.enrollmentCloses}
                    onChange={(d) => updateDate("enrollmentCloses", d)}
                    icon={<Clock className="w-4 h-4" />}
                    description="1 week enrollment window"
                  />
                  <DatePickerField
                    label="Program Delivery Starts"
                    date={dates.programDeliveryStart}
                    onChange={(d) => updateDate("programDeliveryStart", d)}
                    icon={<Package className="w-4 h-4" />}
                    description="After enrollment closes"
                  />
                  <DatePickerField
                    label="Program Delivery Ends"
                    date={dates.programDeliveryEnd}
                    onChange={(d) => updateDate("programDeliveryEnd", d)}
                    icon={<Package className="w-4 h-4" />}
                    description={`${programWeeks} week program`}
                  />
                  <DatePickerField
                    label="Rest Period Starts"
                    date={dates.restPeriodStart}
                    onChange={(d) => updateDate("restPeriodStart", d)}
                    icon={<Coffee className="w-4 h-4" />}
                    description="After program ends"
                  />
                  <DatePickerField
                    label="Rest Period Ends"
                    date={dates.restPeriodEnd}
                    onChange={(d) => updateDate("restPeriodEnd", d)}
                    icon={<Coffee className="w-4 h-4" />}
                    description={`${restWeeks} week rest`}
                  />
                </>
              )}
            </div>

            <div className="bg-accent/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Hot Launch Windows:</p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• <strong>January - February:</strong> New year energy</li>
                <li>• <strong>September - October:</strong> Back-to-school energy</li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Avoid: July-August (summer) and Late Nov-Dec (holidays)
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !dates.prelaunchStart || isSaving}>
            {isSaving ? "Saving..." : isEditMode ? "Save Changes" : `Add ${projectType === 'launch' ? 'Launch' : 'Prelaunch'}`}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4" />
            Add Event
          </Button>
        )}
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
