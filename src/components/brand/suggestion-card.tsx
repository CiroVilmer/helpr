import { Check, Pencil, X, MessageSquareQuote } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelprMark } from "@/components/brand/helpr-mark";

/**
 * Tarjeta de sugerencia de Helpr — MANIFEST §9.1 (el sello del producto).
 * Implementa "confianza visible" + "humano en el loop": Helpr propone, cita la
 * fuente y deja a la persona decidir (Confirmar / Editar / Descartar).
 */
type Kind = "tarea" | "decisión" | "responsable" | "riesgo";
type Confidence = "alta" | "media" | "baja";

type SuggestionCardProps = {
  kind?: Kind;
  /** Título del ítem propuesto en lenguaje claro. */
  title: string;
  /** Detalle opcional. */
  detail?: string;
  confidence?: Confidence;
  /** Fuente citada: autor + cuándo. */
  source: { author: string; when: string };
  className?: string;
};

const confidenceCopy: Record<Confidence, string> = {
  alta: "Confianza alta",
  media: "Confianza media",
  baja: "Confianza baja",
};

export function SuggestionCard({
  kind = "tarea",
  title,
  detail,
  confidence = "alta",
  source,
  className,
}: SuggestionCardProps) {
  return (
    <div
      data-slot="ranzo-suggestion"
      className={cn(
        "flex w-full flex-col gap-4 rounded-2xl bg-popover p-5 text-left ring-1 ring-foreground/10 shadow-[var(--shadow-card)]",
        className
      )}
    >
      {/* Encabezado: monograma + qué detectó + confianza */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <HelprMark size={32} />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">
              Helpr detectó {indefinite(kind)} {kind}
            </p>
            <ConfidenceMeter confidence={confidence} />
          </div>
        </div>
      </div>

      {/* Contenido propuesto */}
      <div className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/5">
        <p className="font-medium text-foreground">{title}</p>
        {detail && (
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        )}
      </div>

      {/* Fuente citada */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MessageSquareQuote className="size-3.5 shrink-0" aria-hidden="true" />
        <span>
          de un mensaje de{" "}
          <span className="font-medium text-foreground">{source.author}</span> ·{" "}
          {source.when}
        </span>
      </div>

      {/* Acciones — el humano cierra */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm">
          <Check aria-hidden="true" />
          Confirmar
        </Button>
        <Button size="sm" variant="outline">
          <Pencil aria-hidden="true" />
          Editar
        </Button>
        <Button size="sm" variant="ghost" className="text-muted-foreground">
          <X aria-hidden="true" />
          Descartar
        </Button>
      </div>
    </div>
  );
}

function ConfidenceMeter({ confidence }: { confidence: Confidence }) {
  const level = confidence === "alta" ? 3 : confidence === "media" ? 2 : 1;
  const variant =
    confidence === "alta"
      ? "success"
      : confidence === "media"
        ? "warning"
        : "risk";

  return (
    <span className="mt-0.5 inline-flex items-center gap-2">
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 w-3.5 rounded-full transition-colors",
              i <= level ? "bg-bosque" : "bg-foreground/15"
            )}
          />
        ))}
      </span>
      <Badge variant={variant} className="px-1.5 text-[10px]">
        {confidenceCopy[confidence]}
      </Badge>
    </span>
  );
}

function indefinite(kind: Kind) {
  // "una tarea" / "una decisión" / "un responsable" / "un riesgo"
  return kind === "responsable" || kind === "riesgo" ? "un" : "una";
}
