import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, Rocket, Clock, Coffee, Sparkles, Package } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

interface LaunchCalendarEventDialogProps {
  projectId: string;
  onEventAdded?: () => void;
  trigger?: React.ReactNode;
}

type EventType = 
  | "launch_window"
  | "prelaunch_start"
  | "content_creation_start"
  | "enrollment_opens"
  | "enrollment_closes"
  | "program_delivery"
  | "rest_period"
  | "creation_period"
  | "launch_season"
  | "delivery_period";

interface EventTypeOption {
  value: EventType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "launch" | "program" | "rest" | "season";
}

const eventTypes: EventTypeOption[] = [
  // Launch Windows
  {
    value: "enrollment_opens",
    label: "Enrollment Opens (Launch Date)",
    description: "When cart opens for enrollment",
    icon: <Rocket className="w-4 h-4" />,
    category: "launch",
  },
  {
    value: "enrollment_closes",
    label: "Enrollment Closes",
    description: "When cart closes",
    icon: <Clock className="w-4 h-4" />,
    category: "launch",
  },
  {
    value: "prelaunch_start",
    label: "Prelaunch Starts",
    description: "6-8 weeks before enrollment opens",
    icon: <Sparkles className="w-4 h-4" />,
    category: "launch",
  },
  {
    value: "content_creation_start",
    label: "Content Creation Starts",
    description: "2 weeks before prelaunch",
    icon: <Sparkles className="w-4 h-4" />,
    category: "launch",
  },
  // Program Delivery
  {
    value: "program_delivery",
    label: "Program Delivery Period",
    description: "Active program delivery timeframe",
    icon: <Package className="w-4 h-4" />,
    category: "program",
  },
  // Rest Periods
  {
    value: "rest_period",
    label: "Rest Period",
    description: "Strategic rest and recovery time",
    icon: <Coffee className="w-4 h-4" />,
    category: "rest",
  },
  // Business Seasons
  {
    value: "creation_period",
    label: "Creation Season",
    description: "Planning, content creation, curriculum building",
    icon: <Sparkles className="w-4 h-4" />,
    category: "season",
  },
  {
    value: "launch_season",
    label: "Launch Season",
    description: "Prelaunch + Launch week (7-9 weeks total)",
    icon: <Rocket className="w-4 h-4" />,
    category: "season",
  },
  {
    value: "delivery_period",
    label: "Delivery Season",
    description: "Active program delivery, client support",
    icon: <Package className="w-4 h-4" />,
    category: "season",
  },
];

const launchNumbers = ["1", "2", "3", "4"];

export function LaunchCalendarEventDialog({ 
  projectId, 
  onEventAdded, 
  trigger 
}: LaunchCalendarEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [eventType, setEventType] = useState<EventType | "">("");
  const [launchNumber, setLaunchNumber] = useState("1");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [programLength, setProgramLength] = useState("");
  const [restWeeks, setRestWeeks] = useState("");
  const [title, setTitle] = useState("");

  const selectedEventType = eventTypes.find(e => e.value === eventType);
  const needsEndDate = ["program_delivery", "rest_period", "creation_period", "launch_season", "delivery_period"].includes(eventType);
  const needsProgramLength = eventType === "program_delivery";
  const needsRestWeeks = eventType === "rest_period";

  const handleSave = () => {
    if (!eventType || !startDate) {
      toast.error("Please select an event type and start date");
      return;
    }

    if (needsEndDate && !endDate) {
      toast.error("Please select an end date");
      return;
    }

    // For now, just show success - actual DB save will come later
    const eventTitle = title || `Launch #${launchNumber} - ${selectedEventType?.label}`;
    toast.success(`Event "${eventTitle}" added to calendar`);
    
    // Reset form
    setEventType("");
    setLaunchNumber("1");
    setStartDate(undefined);
    setEndDate(undefined);
    setProgramLength("");
    setRestWeeks("");
    setTitle("");
    setOpen(false);
    
    onEventAdded?.();
  };

  const groupedEventTypes = {
    launch: eventTypes.filter(e => e.category === "launch"),
    program: eventTypes.filter(e => e.category === "program"),
    rest: eventTypes.filter(e => e.category === "rest"),
    season: eventTypes.filter(e => e.category === "season"),
  };

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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Launch Calendar Event</DialogTitle>
          <DialogDescription>
            Plan your year-at-a-glance with launch windows, prelaunch dates, program delivery, and rest periods.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Event Type Selection */}
          <Accordion type="single" collapsible className="w-full" defaultValue="launch">
            <AccordionItem value="launch">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-primary" />
                  Launch Planning
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {groupedEventTypes.launch.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setEventType(type.value)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
                        eventType === type.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      <div className="mt-0.5">{type.icon}</div>
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="program">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Program Delivery
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {groupedEventTypes.program.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setEventType(type.value)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
                        eventType === type.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      <div className="mt-0.5">{type.icon}</div>
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rest">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-primary" />
                  Rest Periods
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {groupedEventTypes.rest.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setEventType(type.value)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
                        eventType === type.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      <div className="mt-0.5">{type.icon}</div>
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Aim for 8-12 weeks of rest per year. Suggested periods: After program delivery, Summer (July/August), Late December.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="season">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Business Seasons
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {groupedEventTypes.season.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setEventType(type.value)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
                        eventType === type.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      <div className="mt-0.5">{type.icon}</div>
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Event Details */}
          {eventType && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-4">
                {selectedEventType?.icon}
                <span className="font-medium">{selectedEventType?.label}</span>
              </div>

              {/* Custom Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Event Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder={`Launch #${launchNumber} - ${selectedEventType?.label}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Launch Number */}
              <div className="space-y-2">
                <Label>Associated Launch</Label>
                <Select value={launchNumber} onValueChange={setLaunchNumber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select launch" />
                  </SelectTrigger>
                  <SelectContent>
                    {launchNumbers.map((num) => (
                      <SelectItem key={num} value={num}>
                        Launch #{num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label>{needsEndDate ? "Start Date" : "Date"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date (for ranges) */}
              {needsEndDate && (
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className="pointer-events-auto"
                        disabled={(date) => startDate ? date < startDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Program Length */}
              {needsProgramLength && (
                <div className="space-y-2">
                  <Label htmlFor="programLength">Program Length (weeks)</Label>
                  <Input
                    id="programLength"
                    type="number"
                    min="1"
                    placeholder="e.g., 8"
                    value={programLength}
                    onChange={(e) => setProgramLength(e.target.value)}
                  />
                </div>
              )}

              {/* Rest Weeks */}
              {needsRestWeeks && (
                <div className="space-y-2">
                  <Label htmlFor="restWeeks">Rest Period Length (weeks)</Label>
                  <Input
                    id="restWeeks"
                    type="number"
                    min="1"
                    placeholder="e.g., 2"
                    value={restWeeks}
                    onChange={(e) => setRestWeeks(e.target.value)}
                  />
                </div>
              )}

              {/* Tips based on event type */}
              {eventType === "enrollment_opens" && (
                <div className="bg-accent/50 rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">Hot Launch Windows:</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• <strong>January - February:</strong> New year energy, fresh start mindset</li>
                    <li>• <strong>September - October:</strong> Back-to-school energy, Q4 preparation</li>
                  </ul>
                  <p className="mt-2 text-muted-foreground">
                    Avoid: July-August (summer mode) and Late Nov-Dec (holidays)
                  </p>
                </div>
              )}

              {eventType === "prelaunch_start" && (
                <div className="bg-accent/50 rounded-lg p-3 text-sm text-muted-foreground">
                  <p>Plan for 6-8 weeks of prelaunch before enrollment opens. Work backward from your launch date.</p>
                </div>
              )}

              {eventType === "launch_season" && (
                <div className="bg-accent/50 rounded-lg p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Launch Season Breakdown:</p>
                  <ul className="space-y-1">
                    <li>• Week 1-2: Education phase prelaunch</li>
                    <li>• Week 3-5: Demonstration phase prelaunch</li>
                    <li>• Week 6-8: Anticipation phase prelaunch</li>
                    <li>• Week 9: Launch week (enrollment open)</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!eventType || !startDate}>
              Add Event
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}