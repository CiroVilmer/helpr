import { cn } from "@/lib/utils";

/**
 * Monograma de Helpr — MANIFEST §5.
 * "H" en Bricolage 800, lima sobre bosque, dentro de un cuadrado de esquinas
 * redondeadas (~28%) que evoca una foto de perfil / burbuja de WhatsApp.
 */
type HelprMarkProps = {
  /** Lado del cuadrado en px (mínimo recomendado 24px). */
  size?: number;
  /** Muestra el wordmark "Helpr" a la derecha del monograma. */
  withWordmark?: boolean;
  /** monocromo: contenedor tinta + H crema (bajo color / impresión). */
  variant?: "default" | "mono";
  className?: string;
};

export function HelprMark({
  size = 40,
  withWordmark = false,
  variant = "default",
  className,
}: HelprMarkProps) {
  const isMono = variant === "mono";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "grid shrink-0 place-items-center rounded-[28%] font-display font-extrabold leading-none select-none",
          isMono ? "bg-tinta text-crema-base" : "bg-bosque text-lima"
        )}
        style={{
          width: size,
          height: size,
          fontSize: Math.round(size * 0.6),
        }}
      >
        H
      </span>
      {withWordmark && (
        <span
          className="font-display font-bold tracking-tight text-bosque"
          style={{ fontSize: Math.round(size * 0.62) }}
        >
          Helpr
        </span>
      )}
    </span>
  );
}
