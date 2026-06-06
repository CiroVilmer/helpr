"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SelectOption = { value: string; label: string };

type CommonProps = {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

type FieldProps = CommonProps & {
  variant?: "field";
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
};

type PillProps = CommonProps & {
  variant: "pill";
  /** Etiqueta corta a la izquierda del valor (ej. "Prioridad"). */
  label: string;
  /** Resalta el pill cuando hay un filtro activo. */
  active?: boolean;
};

/**
 * Select del dashboard, construido sobre el mismo DropdownMenu (radio) que los filtros.
 * - `variant="field"`: campo de formulario full-width (modal de tarea).
 * - `variant="pill"`: chip compacto (barra de filtros del board).
 */
export function SelectMenu(props: FieldProps | PillProps) {
  const { options, value, onValueChange, className } = props;
  const selected = options.find((o) => o.value === value);

  return (
    <DropdownMenu>
      {props.variant === "pill" ? (
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-linea bg-popover px-3 py-1.5 text-xs font-medium text-tinta shadow-sm ring-1 ring-foreground/5 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            props.active && "border-bosque/40 bg-bosque/5 text-bosque",
            className
          )}
        >
          <span className="text-tinta-suave">{props.label}:</span>
          <span>{selected?.label ?? "—"}</span>
          <ChevronDown className="size-3.5 text-tinta-suave" aria-hidden="true" />
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger
          id={props.id}
          aria-label={props.ariaLabel}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:ring-2 data-[popup-open]:ring-ring",
            className
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected?.label ?? props.placeholder ?? "Elegí…"}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-tinta-suave"
            aria-hidden="true"
          />
        </DropdownMenuTrigger>
      )}

      <DropdownMenuContent
        align="start"
        className={props.variant === "pill" ? "min-w-44" : undefined}
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
