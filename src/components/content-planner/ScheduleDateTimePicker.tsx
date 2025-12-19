import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ScheduleDateTimePickerProps {
  mode: "now" | "schedule";
  onModeChange: (mode: "now" | "schedule") => void;
  date: Date | null;
  onDateChange: (date: Date | null) => void;
  time: string;
  onTimeChange: (time: string) => void;
}

// Generate time options in 15-minute increments
const generateTimeOptions = () => {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = hour.toString().padStart(2, "0");
      const minuteStr = minute.toString().padStart(2, "0");
      const value = `${hourStr}:${minuteStr}`;
      
      // Format for display (12-hour format)
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? "AM" : "PM";
      const label = `${displayHour}:${minuteStr} ${ampm}`;
      
      options.push({ value, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function ScheduleDateTimePicker({
  mode,
  onModeChange,
  date,
  onDateChange,
  time,
  onTimeChange,
}: ScheduleDateTimePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Get the scheduled datetime for display
  const getScheduledDateTime = () => {
    if (!date) return null;
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes, 0, 0);
    return scheduledDate;
  };

  const scheduledDateTime = getScheduledDateTime();

  // Disable past dates
  const disablePastDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <Label className="text-base font-medium">When to Post</Label>
      </div>

      {/* Pill Selector for Mode */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onModeChange("now")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            mode === "now"
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <Zap className="w-4 h-4" />
          <span>Post Now</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("schedule")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            mode === "schedule"
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Schedule for Later</span>
        </button>
      </div>

      {mode === "schedule" && (
        <div className="space-y-3 pl-6 border-l-2 border-muted">
          <div className="grid grid-cols-2 gap-3">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date || undefined}
                    onSelect={(newDate) => {
                      onDateChange(newDate || null);
                      setCalendarOpen(false);
                    }}
                    disabled={disablePastDates}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Time</Label>
              <Select value={time} onValueChange={onTimeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scheduled DateTime Preview */}
          {scheduledDateTime && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Will post:</p>
              <p className="font-medium text-foreground">
                {format(scheduledDateTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
