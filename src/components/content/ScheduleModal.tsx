import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Globe, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (date: Date, time: string) => Promise<void>;
  isScheduling: boolean;
  isReschedule?: boolean;
  initialDate?: Date | null;
  initialTime?: string;
}

// Generate time options in 15-minute increments
const generateTimeOptions = () => {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = hour.toString().padStart(2, "0");
      const minuteStr = minute.toString().padStart(2, "0");
      const value = `${hourStr}:${minuteStr}`;
      
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? "AM" : "PM";
      const label = `${hour12}:${minuteStr} ${ampm}`;
      
      options.push({ value, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function ScheduleModal({
  open,
  onOpenChange,
  onSchedule,
  isScheduling,
  isReschedule = false,
  initialDate,
  initialTime = "09:00",
}: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate || undefined
  );
  const [selectedTime, setSelectedTime] = useState(initialTime);

  // Sync selectedDate when initialDate prop changes
  useEffect(() => {
    setSelectedDate(initialDate || undefined);
  }, [initialDate]);

  // Sync selectedTime when initialTime prop changes
  useEffect(() => {
    setSelectedTime(initialTime);
  }, [initialTime]);

  const handleSchedule = async () => {
    if (!selectedDate) return;
    await onSchedule(selectedDate, selectedTime);
  };

  const disablePastDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Get user's timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {isReschedule ? "Reschedule Post" : "Schedule Post"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Date Display */}
          {selectedDate && (
            <div className="text-center py-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, "yyyy")}
              </p>
              <p className="text-2xl font-semibold">
                {format(selectedDate, "EEEE, MMMM d")}
              </p>
            </div>
          )}

          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={disablePastDates}
              className="rounded-md border pointer-events-auto"
              initialFocus
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Time
            </div>
            <div className="flex gap-2">
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="flex-1">
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

          {/* Timezone Display */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="w-3 h-3" />
            <span>{timezone}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!selectedDate || isScheduling}
            className={cn(!isReschedule && "bg-primary")}
          >
            {isScheduling ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isReschedule ? "Reschedule" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
