import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Tarjeta de "Qué hace Helpr" — MANIFEST §10.1. Ícono Lucide + título + copy. */
export function FeatureCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/10 shadow-[var(--shadow-card)] transition-transform duration-200 ease-out hover:-translate-y-1",
        className
      )}
    >
      <span className="grid size-11 place-items-center rounded-xl bg-bosque text-lima">
        <Icon className="size-5" strokeWidth={1.85} aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
