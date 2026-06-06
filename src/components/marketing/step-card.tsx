import { cn } from "@/lib/utils";

/** Paso de "Cómo funciona" — MANIFEST §10.1. Número grande + título + copy. */
export function StepCard({
  step,
  title,
  children,
  className,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/10 transition-transform duration-200 ease-out hover:-translate-y-0.5",
        className
      )}
    >
      <span
        className="font-display text-4xl font-extrabold tabular-nums text-bosque/15"
        aria-hidden="true"
      >
        {String(step).padStart(2, "0")}
      </span>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
