import * as React from "react";
import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label?: string;
  maxDate?: Date;
  minDate?: Date;
}

export function DateTimePicker({ date, setDate, label, maxDate, minDate }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);

  // Sync internal state when prop changes
  React.useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
        setSelectedDate(undefined);
        return;
    }
    
    // Preserve time from current selection or default to 00:00 or current time
    // If we have a minDate and no selectedDate, default to minDate time?
    const timePreserved = new Date(newDate);
    if (selectedDate) {
        timePreserved.setHours(selectedDate.getHours());
        timePreserved.setMinutes(selectedDate.getMinutes());
    } else {
        timePreserved.setHours(0, 0, 0, 0);
    }
    
    // Clamp logic
    if (minDate && timePreserved < minDate) {
        // If selected day is same as minDate day, snap time to minDate time
        if (isSameDay(timePreserved, minDate)) {
             timePreserved.setHours(minDate.getHours(), minDate.getMinutes(), 0, 0);
        }
        // If selected day is BEFORE minDate day (should be prevented by Calendar disabled, but safe check)
        else if (timePreserved < minDate) {
             // This shouldn't happen if Calendar works, but if it does, snap to minDate
             timePreserved.setTime(minDate.getTime());
        }
    }
    if (maxDate && timePreserved > maxDate) {
         if (isSameDay(timePreserved, maxDate)) {
             timePreserved.setHours(maxDate.getHours(), maxDate.getMinutes(), 0, 0);
         } else {
             timePreserved.setTime(maxDate.getTime());
         }
    }

    setSelectedDate(timePreserved);
  };

  const handleTimeChange = (type: "hour" | "minute" | "ampm", value: string) => {
    const current = selectedDate ? new Date(selectedDate) : new Date();
    
    let hours = current.getHours();
    let minutes = current.getMinutes();
    
    if (type === "hour") {
        const val = parseInt(value);
        if (hours >= 12) { // PM
            hours = val === 12 ? 12 : val + 12;
        } else { // AM
            hours = val === 12 ? 0 : val;
        }
    } else if (type === "minute") {
        minutes = parseInt(value);
    } else if (type === "ampm") {
        if (value === "AM" && hours >= 12) hours -= 12;
        if (value === "PM" && hours < 12) hours += 12;
    }

    current.setHours(hours);
    current.setMinutes(minutes);

    // Clamp logic for time change
    if (minDate && current < minDate) {
         current.setTime(minDate.getTime());
    }
    if (maxDate && current > maxDate) {
         current.setTime(maxDate.getTime());
    }

    setSelectedDate(current);
  };

  const handleOk = () => {
    setDate(selectedDate);
    setIsOpen(false);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10...

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MM/dd/yyyy hh:mm aa") : <span>{label || "Pick a date"}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex h-[350px]">
            <div className="p-3">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(d) => {
                        const startOfD = new Date(d); startOfD.setHours(0,0,0,0);
                        const startOfMax = maxDate ? new Date(maxDate) : null; 
                        if (startOfMax) startOfMax.setHours(0,0,0,0);
                        
                        const startOfMin = minDate ? new Date(minDate) : null;
                        if (startOfMin) startOfMin.setHours(0,0,0,0);

                        if (startOfMax && startOfD > startOfMax) return true;
                        if (startOfMin && startOfD < startOfMin) return true;
                        return false;
                    }}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={2020}
                    toYear={2030}
                    className="rounded-md border-r pr-3"
                />
            </div>
            
            <div className="flex flex-col p-3 w-[180px]">
                <div className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Time
                </div>
                <div className="flex flex-1 gap-1 h-full overflow-hidden">
                    {/* Hours */}
                    <div className="flex flex-col flex-1 border rounded-md overflow-hidden">
                         <div className="bg-muted p-1 text-center text-xs font-medium border-b">Hr</div>
                         <ScrollArea className="h-full">
                            <div className="flex flex-col p-1 gap-1">
                                {hours.map((h) => (
                                    <Button
                                        key={h}
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-8 w-full justify-center text-xs",
                                            selectedDate && (selectedDate.getHours() % 12 || 12) === h ? "bg-primary text-primary-foreground" : ""
                                        )}
                                        onClick={() => handleTimeChange("hour", h.toString())}
                                    >
                                        {h.toString().padStart(2, "0")}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar orientation="vertical" />
                         </ScrollArea>
                    </div>

                    {/* Minutes */}
                    <div className="flex flex-col flex-1 border rounded-md overflow-hidden">
                         <div className="bg-muted p-1 text-center text-xs font-medium border-b">Min</div>
                         <ScrollArea className="h-full">
                            <div className="flex flex-col p-1 gap-1">
                                {minutes.map((m) => (
                                    <Button
                                        key={m}
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-8 w-full justify-center text-xs",
                                            selectedDate && Math.floor(selectedDate.getMinutes() / 5) * 5 === m ? "bg-primary text-primary-foreground" : ""
                                            // Simplification: just matching the 5-min step for highlighting
                                        )}
                                        onClick={() => handleTimeChange("minute", m.toString())}
                                    >
                                        {m.toString().padStart(2, "0")}
                                    </Button>
                                ))}
                            </div>
                             <ScrollBar orientation="vertical" />
                         </ScrollArea>
                    </div>

                    {/* AM/PM */}
                    <div className="flex flex-col flex-1 border rounded-md overflow-hidden">
                         <div className="bg-muted p-1 text-center text-xs font-medium border-b">Pd</div>
                         <ScrollArea className="h-full">
                            <div className="flex flex-col p-1 gap-1">
                                {["AM", "PM"].map((pd) => (
                                    <Button
                                        key={pd}
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-8 w-full justify-center text-xs",
                                            selectedDate && ((selectedDate.getHours() >= 12 && pd === "PM") || (selectedDate.getHours() < 12 && pd === "AM")) ? "bg-primary text-primary-foreground" : ""
                                        )}
                                        onClick={() => handleTimeChange("ampm", pd)}
                                    >
                                        {pd}
                                    </Button>
                                ))}
                            </div>
                         </ScrollArea>
                    </div>
                </div>
                
                <div className="mt-3">
                    <Button size="sm" className="w-full" onClick={handleOk}>OK</Button>
                </div>
            </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
