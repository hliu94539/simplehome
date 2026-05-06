import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BulkFillKind = "minor" | "major";
export type BulkFillMode = "fill-empty-only" | "overwrite";

interface BulkFillDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  isSubmitting?: boolean;
  onSubmit: (payload: { kind: BulkFillKind; date: string; mode: BulkFillMode }) => Promise<void>;
}

export default function BulkFillDatesModal({
  isOpen,
  onClose,
  selectedCount,
  isSubmitting = false,
  onSubmit,
}: BulkFillDatesModalProps) {
  const [kind, setKind] = useState<BulkFillKind>("minor");
  const [date, setDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mode, setMode] = useState<BulkFillMode>("fill-empty-only");
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 10;
  const maxYear = currentYear + 30;
  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  const monthOptions = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const toDateOnlyString = (value: Date): string => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!isOpen) {
      setKind("minor");
      setDate(null);
      setMode("fill-empty-only");
      setCalendarMonth(new Date());
      setCalendarOpen(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      return;
    }
    await onSubmit({ kind, date: toDateOnlyString(date), mode });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Fill Next Maintenance Date</DialogTitle>
          <DialogDescription>
            Update {selectedCount} selected item(s) in one action.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor="bulk-kind">Date kind</Label>
            <select
              id="bulk-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as BulkFillKind)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              disabled={isSubmitting}
            >
              <option value="minor">Minor</option>
              <option value="major">Major</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-date">Date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="bulk-date"
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex items-center gap-2 p-3 border-b bg-gray-50">
                  <Select
                    value={String(calendarMonth.getMonth())}
                    onValueChange={(value) => {
                      const next = new Date(calendarMonth);
                      next.setMonth(parseInt(value, 10));
                      setCalendarMonth(next);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[150px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((monthLabel, index) => (
                        <SelectItem key={monthLabel} value={String(index)}>
                          {monthLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(calendarMonth.getFullYear())}
                    onValueChange={(value) => {
                      const next = new Date(calendarMonth);
                      next.setFullYear(parseInt(value, 10));
                      setCalendarMonth(next);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[110px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Calendar
                  mode="single"
                  selected={date ?? undefined}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  onSelect={(selectedDate) => {
                    if (!selectedDate) {
                      return;
                    }
                    setDate(selectedDate);
                    setCalendarMonth(selectedDate);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-mode">Apply mode</Label>
            <select
              id="bulk-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as BulkFillMode)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              disabled={isSubmitting}
            >
              <option value="fill-empty-only">Fill empty only</option>
              <option value="overwrite">Overwrite existing</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedCount === 0 || !date}>
              {isSubmitting ? "Applying..." : "Apply"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
