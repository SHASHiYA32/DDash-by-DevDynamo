"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** "2026-11-24" → local Date at midnight (no timezone shifts). */
export function parseIso(iso: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined;
}

export function toIsoLocal(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

interface Props {
  id?: string;
  value: string; // YYYY-MM-DD or ""
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
}

/** shadcn date picker: Popover + Calendar. Works with ISO date strings. */
export function DatePicker({ id, value, onChange, min, max, placeholder = "Pick a date", className }: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = parseIso(value);
  const minD = min ? parseIso(min) : undefined;
  const maxD = max ? parseIso(max) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-start gap-2 bg-transparent px-3 font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarDays className="size-4 opacity-60" />
          {selected
            ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? maxD}
          onSelect={(d) => {
            if (d) {
              onChange(toIsoLocal(d));
              setOpen(false);
            }
          }}
          disabled={[...(minD ? [{ before: minD }] : []), ...(maxD ? [{ after: maxD }] : [])]}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
