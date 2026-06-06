import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Marca de Helpr usando los assets reales (public/).
 * - `tone="brand"` (default): assets verde bosque, para fondos claros (crema).
 * - `tone="light"`: assets reversados (crema), para fondos oscuros (bosque).
 */
const LOGO_RATIO = 2172 / 724;

type HelprMarkProps = {
  /** Alto en px (mín. recomendado 24px). */
  size?: number;
  /** Logo completo (ícono + wordmark) en vez de solo el ícono. */
  withWordmark?: boolean;
  /** "brand" para fondos claros, "light" para fondos oscuros. */
  tone?: "brand" | "light";
  /** Carga prioritaria (logo above-the-fold, ej. navbar). */
  priority?: boolean;
  className?: string;
};

export function HelprMark({
  size = 40,
  withWordmark = false,
  tone = "brand",
  priority = false,
  className,
}: HelprMarkProps) {
  const light = tone === "light";

  if (withWordmark) {
    return (
      <Image
        src={light ? "/helpr-logo-light.png" : "/helpr-logo.png"}
        alt="Helpr"
        width={Math.round(size * LOGO_RATIO)}
        height={size}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    <span className={cn("inline-flex", className)}>
      <Image
        src={light ? "/helpr-icon-light.png" : "/helpr-icon.png"}
        alt="Helpr"
        width={size}
        height={size}
        priority={priority}
      />
    </span>
  );
}
