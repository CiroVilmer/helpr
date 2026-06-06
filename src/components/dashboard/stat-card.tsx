import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "default" | "warning" | "risk";

const toneStyles: Record<Tone, string> = {
  default: "bg-bosque text-lima",
  warning: "bg-ambar/20 text-ambar",
  risk: "bg-clay/15 text-clay",
};

/** Tarjeta de métrica del dashboard. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-tinta-suave">{label}</span>
        <span
          className={cn("grid size-8 place-items-center rounded-lg", toneStyles[tone])}
        >
          <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-tinta">
        {value}
      </p>
    </div>
  );
}
