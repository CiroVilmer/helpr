import { cn } from "@/lib/utils";

/** Ancho de lectura cómodo + padding lateral mobile-first. */
export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}
      {...props}
    />
  );
}

type SectionProps = React.ComponentProps<"section"> & {
  /** Superficie oscura (bosque) con texto claro. */
  tone?: "crema" | "bosque";
};

export function Section({
  className,
  tone = "crema",
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "py-20 sm:py-28",
        tone === "bosque" && "bg-bosque text-crema-base",
        className
      )}
      {...props}
    >
      <Container>{children}</Container>
    </section>
  );
}

/** Etiqueta superior (Label MANIFEST §4): uppercase, tracking, color tenue. */
export function Eyebrow({
  className,
  tone = "crema",
  ...props
}: React.ComponentProps<"p"> & { tone?: "crema" | "bosque" }) {
  return (
    <p
      className={cn(
        "text-xs font-semibold tracking-[0.14em] uppercase",
        tone === "bosque" ? "text-lima" : "text-tinta-suave",
        className
      )}
      {...props}
    />
  );
}
