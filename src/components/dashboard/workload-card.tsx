import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type WorkloadBucket = "libre" | "ocupado" | "sobrecargado";

// Bar fills relative to this cap (a bit above the "sobrecargado" threshold, so 7+ reads near-full).
export const WORKLOAD_BAR_CAP = 8;

const styles: Record<WorkloadBucket, { bar: string; chip: string }> = {
  libre: { bar: "bg-bosque", chip: "bg-bosque/10 text-bosque" },
  ocupado: { bar: "bg-ambar", chip: "bg-ambar/20 text-ambar" },
  sobrecargado: { bar: "bg-clay", chip: "bg-clay/15 text-clay" },
};

export function WorkloadCard({
  nombre,
  initials,
  count,
  bucket,
  action,
}: {
  nombre: string;
  initials: string;
  count: number;
  bucket: WorkloadBucket;
  action?: ReactNode;
}) {
  const pct = Math.min(count / WORKLOAD_BAR_CAP, 1) * 100;
  const s = styles[bucket];

  return (
    <article className="group flex flex-col rounded-xl bg-popover p-4 ring-1 ring-foreground/10 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback className="bg-bosque text-[10px] font-semibold text-crema-base">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {nombre}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
              s.chip,
            )}
          >
            {count} {count === 1 ? "tarea" : "tareas"}
          </span>
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="meter"
          aria-valuenow={count}
          aria-valuemin={0}
          aria-label={`Carga de ${nombre}`}
        >
          <div className={cn("h-full rounded-full", s.bar)} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Action slot: 0 height by default (no reserved space), expands in/out on hover.
          Also opens on keyboard focus and on small screens (no hover there). */}
      {action ? (
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out group-hover:grid-rows-[1fr] focus-within:grid-rows-[1fr] max-md:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <div className="flex flex-col gap-2 pt-3">{action}</div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
