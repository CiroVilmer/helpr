"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquareQuote,
  UserX,
} from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { dueBadge, type DueState, type TaskView } from "@/types/tasks/view";
import type { Prioridad } from "@/db/schema/tareas";

const priorityStyles: Record<Prioridad, string> = {
  alta: "bg-clay",
  media: "bg-ambar",
  baja: "bg-tinta-suave/40",
};

const priorityLabels: Record<Prioridad, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export function TaskCard({
  task,
  onOpen,
}: {
  task: TaskView;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { estado: task.estado },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const due = dueBadge(task.fecha_limite, task.estado);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-popover p-4 ring-1 ring-foreground/10 shadow-[var(--shadow-card)] transition-shadow",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Drag handle covers the title row + due badge — but the card-foot (avatar/source)
          stays clickable for the modal trigger. */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={() => onOpen(task.id)}
        className="flex flex-col gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md -m-1 p-1 cursor-grab active:cursor-grabbing"
        aria-label={`Abrir tarea: ${task.descripcion}`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <p className="text-sm font-medium leading-snug text-foreground">
            {task.descripcion}
          </p>
          <span
            className={cn(
              "mt-1 size-2 shrink-0 rounded-full",
              priorityStyles[task.prioridad]
            )}
            title={`Prioridad ${priorityLabels[task.prioridad]}`}
            aria-label={`Prioridad ${priorityLabels[task.prioridad]}`}
          />
        </div>

        {due && <DueBadge label={due.label} state={due.state} />}
      </button>

      <div className="flex items-center justify-between gap-2 border-t border-linea pt-3">
        {task.asignado ? (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback className="bg-bosque text-[10px] font-semibold text-crema-base">
                {task.asignado.initials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-tinta-suave">
              {task.asignado.nombre}
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-clay">
            <UserX className="size-3.5" aria-hidden="true" />
            Sin responsable
          </span>
        )}

        {task.creado_por_nombre && (
          <span
            className="inline-flex shrink-0 items-center gap-1 text-xs text-tinta-suave"
            title={`Creado por ${task.creado_por_nombre}`}
          >
            <MessageSquareQuote className="size-3.5" aria-hidden="true" />
            {task.creado_por_nombre}
          </span>
        )}
      </div>
    </article>
  );
}

function DueBadge({ label, state }: { label: string; state: DueState }) {
  const variant =
    state === "ok" ? "success" : state === "soon" ? "warning" : "risk";
  const Icon =
    state === "ok" ? CheckCircle2 : state === "overdue" ? AlertTriangle : Clock;

  return (
    <Badge variant={variant} className="w-fit">
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}
