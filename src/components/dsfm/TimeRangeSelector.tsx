import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export type TimeRange = "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y" | "custom";

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDatesChange?: (start: Date | undefined, end: Date | undefined) => void;
}

const TimeRangeSelector = ({
  selectedRange,
  onRangeChange,
  customStartDate,
  customEndDate,
  onCustomDatesChange
}: TimeRangeSelectorProps) => {
  const ranges: Array<{ value: TimeRange; label: string }> = [
    { value: "1M", label: "1 Month" },
    { value: "3M", label: "3 Months" },
    { value: "6M", label: "6 Months" },
    { value: "1Y", label: "1 Year" },
    { value: "3Y", label: "3 Years" },
    { value: "5Y", label: "5 Years" },
    { value: "custom", label: "Custom" }
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {ranges.map((range) => (
          <Button
            key={range.value}
            variant={selectedRange === range.value ? "default" : "outline"}
            size="sm"
            onClick={() => onRangeChange(range.value)}
            className="text-xs"
          >
            {range.label}
          </Button>
        ))}
      </div>
      
      {selectedRange === "custom" && onCustomDatesChange && (
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate ? format(customStartDate, "PPP") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                selected={customStartDate}
                onSelect={(date) => onCustomDatesChange(date, customEndDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate ? format(customEndDate, "PPP") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                selected={customEndDate}
                onSelect={(date) => onCustomDatesChange(customStartDate, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

export default TimeRangeSelector;

