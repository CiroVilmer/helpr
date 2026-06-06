"use client";

import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// "yyyy-mm-dd" <-> Date en horario local (sin saltos de timezone de toISOString).
function toDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Date picker del dashboard: trigger estilo "field" (igual que SelectMenu) que abre
 * el Calendar de shadcn dentro de un Popover.
 */
export function DateField({
  id,
  value,
  onChange,
  placeholder = "Elegí una fecha",
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);

  return (
    <div className="flex items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          className={cn(
            "flex h-9 flex-1 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:ring-2 data-[popup-open]:ring-ring"
          )}
        >
          <CalendarIcon
            className="size-4 shrink-0 text-tinta-suave"
            aria-hidden="true"
          />
          <span
            className={cn(
              "flex-1 truncate text-left",
              !selected && "text-muted-foreground"
            )}
          >
            {selected
              ? format(selected, "d 'de' MMM, yyyy", { locale: es })
              : placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            locale={es}
            onSelect={(date) => {
              if (date) {
                onChange(toValue(date));
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>

      {selected && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Quitar fecha"
          className="grid size-9 shrink-0 place-items-center rounded-md text-tinta-suave transition-colors hover:bg-muted hover:text-clay focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
