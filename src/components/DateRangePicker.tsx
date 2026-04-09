import * as React from "react"
import { addDays, format } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/DateTimePicker"

interface DatePickerWithRangeProps {
  className?: string
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {

  const handleStartDateChange = (newDate: Date | undefined) => {
    // If setting start date after end date, clear end date? Or just let user fix it.
    // Let's just update normally.
    setDate({
        from: newDate,
        to: date?.to
    });
  };

  const handleEndDateChange = (newDate: Date | undefined) => {
     setDate({
        from: date?.from,
        to: newDate
     });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DateTimePicker 
        date={date?.from} 
        setDate={handleStartDateChange} 
        label="Start Date"
        maxDate={date?.to ? (date.to < new Date() ? date.to : new Date()) : new Date()}
      />
      <span className="text-muted-foreground">-</span>
      <DateTimePicker 
        date={date?.to} 
        setDate={handleEndDateChange} 
        label="End Date"
        minDate={date?.from}
        maxDate={new Date()}
      />
    </div>
  )
}
