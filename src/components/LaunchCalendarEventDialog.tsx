import { useState, useEffect } from "react";
import { format, addWeeks, subWeeks } from "date-fns";
import { CalendarIcon, Plus, Rocket, Clock, Coffee, Package, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

interface LaunchCalendarEventDialogProps {
  projectId: string;
  onEventAdded?: () => void;
  trigger?: React.ReactNode;
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
const PRELAUNCH_WEEKS = 7; // 6-8 weeks, using 7 as middle
const CONTENT_CREATION_WEEKS = 2;
const ENROLLMENT_DAYS = 7; // 1 week enrollment window

export function LaunchCalendarEventDialog({ 
  projectId, 
  onEventAdded, 
  trigger 
}: LaunchCalendarEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [showDates, setShowDates] = useState(false);
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

  // Calculate suggested dates when prelaunch start date changes
  useEffect(() => {
    if (dates.prelaunchStart) {
      const prelaunch = dates.prelaunchStart;
      
      // Content creation starts 2 weeks before prelaunch
      const contentCreation = subWeeks(prelaunch, CONTENT_CREATION_WEEKS);
      
      // Enrollment opens 7 weeks after prelaunch starts
      const enrollmentOpen = addWeeks(prelaunch, PRELAUNCH_WEEKS);
      
      // Enrollment closes 1 week after it opens
      const enrollmentClose = addWeeks(enrollmentOpen, 1);
      
      // Program delivery starts when enrollment closes
      const programStart = enrollmentClose;
      
      // Program delivery ends based on program length
      const programEnd = addWeeks(programStart, programWeeks);
      
      // Rest period starts after program ends
      const restStart = programEnd;
      
      // Rest period ends based on rest weeks
      const restEnd = addWeeks(restStart, restWeeks);

      setDates(prev => ({
        ...prev,
        contentCreationStart: prev.contentCreationStart || contentCreation,
        enrollmentOpens: prev.enrollmentOpens || enrollmentOpen,
        enrollmentCloses: prev.enrollmentCloses || enrollmentClose,
        programDeliveryStart: prev.programDeliveryStart || programStart,
        programDeliveryEnd: prev.programDeliveryEnd || programEnd,
        restPeriodStart: prev.restPeriodStart || restStart,
        restPeriodEnd: prev.restPeriodEnd || restEnd,
      }));
      
      setShowDates(true);
    }
  }, [dates.prelaunchStart, programWeeks, restWeeks]);

  const updateDate = (key: keyof LaunchDates, date: Date | undefined) => {
    setDates(prev => ({ ...prev, [key]: date }));
  };

  const recalculateDates = () => {
    if (dates.prelaunchStart) {
      const prelaunch = dates.prelaunchStart;
      const contentCreation = subWeeks(prelaunch, CONTENT_CREATION_WEEKS);
      const enrollmentOpen = addWeeks(prelaunch, PRELAUNCH_WEEKS);
      const enrollmentClose = addWeeks(enrollmentOpen, 1);
      const programStart = enrollmentClose;
      const programEnd = addWeeks(programStart, programWeeks);
      const restStart = programEnd;
      const restEnd = addWeeks(restStart, restWeeks);

      setDates({
        prelaunchStart: prelaunch,
        contentCreationStart: contentCreation,
        enrollmentOpens: enrollmentOpen,
        enrollmentCloses: enrollmentClose,
        programDeliveryStart: programStart,
        programDeliveryEnd: programEnd,
        restPeriodStart: restStart,
        restPeriodEnd: restEnd,
      });
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a launch title");
      return;
    }
    
    if (!dates.prelaunchStart) {
      toast.error("Please select a prelaunch start date");
      return;
    }

    // For now, just show success - actual DB save will come later
    toast.success(`Launch "${title}" added to calendar`);
    
    // Reset form
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
    setOpen(false);
    
    onEventAdded?.();
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
      <div className="mt-1 text-muted-foreground">{icon}</div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div>
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
                  "w-[160px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3 w-3" />
                {date ? format(date, "MMM d, yyyy") : "Select"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={onChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );

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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plan Your Launch</DialogTitle>
          <DialogDescription>
            Enter your launch title and prelaunch start date. We'll suggest dates for everything else.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Launch Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Launch Title</Label>
            <Input
              id="title"
              placeholder="e.g., Spring Cohort 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

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
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dates.prelaunchStart}
                  onSelect={(date) => updateDate("prelaunchStart", date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              This is when you'll start building relationships and warming up your audience (6-8 weeks before enrollment opens).
            </p>
          </div>

          {/* Program & Rest Duration */}
          {dates.prelaunchStart && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="programWeeks">Program Length (weeks)</Label>
                <Input
                  id="programWeeks"
                  type="number"
                  min="1"
                  max="52"
                  value={programWeeks}
                  onChange={(e) => {
                    setProgramWeeks(parseInt(e.target.value) || DEFAULT_PROGRAM_WEEKS);
                  }}
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
                  onChange={(e) => {
                    setRestWeeks(parseInt(e.target.value) || DEFAULT_REST_WEEKS);
                  }}
                />
              </div>
            </div>
          )}

          {/* Recalculate button */}
          {dates.prelaunchStart && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={recalculateDates}
              className="w-full"
            >
              Recalculate All Dates
            </Button>
          )}

          {/* Suggested Dates Section */}
          {showDates && dates.prelaunchStart && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <span className="text-sm font-semibold">Suggested Timeline</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="rounded-lg border bg-card">
                  {/* Content Creation */}
                  <DatePickerField
                    label="Content Creation Starts"
                    date={dates.contentCreationStart}
                    onChange={(d) => updateDate("contentCreationStart", d)}
                    icon={<Sparkles className="w-4 h-4" />}
                    description="2 weeks before prelaunch"
                  />

                  {/* Prelaunch */}
                  <DatePickerField
                    label="Prelaunch Starts"
                    date={dates.prelaunchStart}
                    onChange={(d) => updateDate("prelaunchStart", d)}
                    icon={<Rocket className="w-4 h-4" />}
                    description="Your selected start date"
                  />

                  {/* Enrollment Opens */}
                  <DatePickerField
                    label="Enrollment Opens"
                    date={dates.enrollmentOpens}
                    onChange={(d) => updateDate("enrollmentOpens", d)}
                    icon={<Rocket className="w-4 h-4" />}
                    description="~7 weeks after prelaunch"
                  />

                  {/* Enrollment Closes */}
                  <DatePickerField
                    label="Enrollment Closes"
                    date={dates.enrollmentCloses}
                    onChange={(d) => updateDate("enrollmentCloses", d)}
                    icon={<Clock className="w-4 h-4" />}
                    description="1 week enrollment window"
                  />

                  {/* Program Delivery */}
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

                  {/* Rest Period */}
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
                </div>

                {/* Tips */}
                <div className="mt-4 bg-accent/50 rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">Hot Launch Windows:</p>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>• <strong>January - February:</strong> New year energy</li>
                    <li>• <strong>September - October:</strong> Back-to-school energy</li>
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Avoid: July-August (summer) and Late Nov-Dec (holidays)
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim() || !dates.prelaunchStart}>
              Add Launch
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
