import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  const [date, setDate] = useState("");
  const [mode, setMode] = useState<BulkFillMode>("fill-empty-only");

  useEffect(() => {
    if (!isOpen) {
      setKind("minor");
      setDate("");
      setMode("fill-empty-only");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ kind, date, mode });
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
            <Input
              id="bulk-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting}
              required
            />
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
