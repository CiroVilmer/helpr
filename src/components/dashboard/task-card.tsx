import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  UserX,
  MessageSquareQuote,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Task, DueState, Priority } from "@/components/dashboard/data";

const priorityStyles: Record<Priority, string> = {
  alta: "bg-clay",
  media: "bg-ambar",
  baja: "bg-tinta-suave/40",
};

export function TaskCard({ task }: { task: Task }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl bg-popover p-4 ring-1 ring-foreground/10 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-2.5">
        <p className="text-sm font-medium leading-snug text-foreground">
          {task.title}
        </p>
        <span
          className={cn(
            "mt-1 size-2 shrink-0 rounded-full",
            priorityStyles[task.priority]
          )}
          title={`Prioridad ${task.priority}`}
          aria-label={`Prioridad ${task.priority}`}
        />
      </div>

      {task.due && <DueBadge label={task.due.label} state={task.due.state} />}

      <div className="flex items-center justify-between gap-2 border-t border-linea pt-3">
        {task.assignee ? (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback className="bg-bosque text-[10px] font-semibold text-crema-base">
                {task.assignee.initials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-tinta-suave">
              {task.assignee.name}
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-clay">
            <UserX className="size-3.5" aria-hidden="true" />
            Sin responsable
          </span>
        )}

        <span
          className="inline-flex shrink-0 items-center gap-1 text-xs text-tinta-suave"
          title={`de un mensaje de ${task.source.author} · ${task.source.when}`}
        >
          <MessageSquareQuote className="size-3.5" aria-hidden="true" />
          {task.source.author}
        </span>
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
