"use client";

import { useMemo, useState } from "react";
import { ChevronDown, CircleDashed, Loader, UserX, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { KanbanColumn } from "@/components/dashboard/kanban-column";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Priority, Task } from "@/components/dashboard/data";

type PriorityFilter = Priority | "all";
type AssigneeFilter = string | "all" | "none";

const PRIORITY_LABEL: Record<PriorityFilter, string> = {
  all: "Todas",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export function TasksBoard({ tasks }: { tasks: Task[] }) {
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [assignee, setAssignee] = useState<AssigneeFilter>("all");

  const assignees = useMemo(() => {
    const names = new Set<string>();
    for (const t of tasks) if (t.assignee) names.add(t.assignee.name);
    return Array.from(names).sort((a, b) => a.localeCompare(b, "es"));
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (priority !== "all" && t.priority !== priority) return false;
      if (assignee === "none") return t.assignee === null;
      if (assignee !== "all" && t.assignee?.name !== assignee) return false;
      return true;
    });
  }, [tasks, priority, assignee]);

  const todo = filtered.filter((t) => t.status === "todo");
  const doing = filtered.filter((t) => t.status === "doing");
  const done = filtered.filter((t) => t.status === "done");
  const sinResponsable = filtered.filter(
    (t) => !t.assignee && t.status !== "done"
  ).length;

  const hasFilters = priority !== "all" || assignee !== "all";
  const assigneeLabel =
    assignee === "all"
      ? "Todas"
      : assignee === "none"
      ? "Sin responsable"
      : assignee;

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pendientes" value={todo.length} icon={CircleDashed} />
        <StatCard
          label="En curso"
          value={doing.length}
          icon={Loader}
          tone="warning"
        />
        <StatCard
          label="Sin responsable"
          value={sinResponsable}
          icon={UserX}
          tone="risk"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <FilterMenu
          label="Prioridad"
          value={PRIORITY_LABEL[priority]}
          active={priority !== "all"}
        >
          <DropdownMenuRadioGroup
            value={priority}
            onValueChange={(v) => setPriority(v as PriorityFilter)}
          >
            <DropdownMenuRadioItem value="all">Todas</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="alta">Alta</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="media">Media</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="baja">Baja</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </FilterMenu>

        <FilterMenu
          label="Responsable"
          value={assigneeLabel}
          active={assignee !== "all"}
        >
          <DropdownMenuRadioGroup
            value={assignee}
            onValueChange={(v) => setAssignee(v as AssigneeFilter)}
          >
            <DropdownMenuRadioItem value="all">Todas</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="none">
              Sin responsable
            </DropdownMenuRadioItem>
            {assignees.map((name) => (
              <DropdownMenuRadioItem key={name} value={name}>
                {name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </FilterMenu>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPriority("all");
              setAssignee("all");
            }}
          >
            <X aria-hidden="true" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <KanbanColumn title="Por hacer" tasks={todo} />
        <KanbanColumn title="Haciendo" tasks={doing} />
        <KanbanColumn title="Listo" tasks={done} />
      </div>
    </>
  );
}

function FilterMenu({
  label,
  value,
  active,
  children,
}: {
  label: string;
  value: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-linea bg-popover px-3 py-1.5 text-xs font-medium text-tinta shadow-sm ring-1 ring-foreground/5 transition-colors hover:bg-muted",
          active && "border-bosque/40 bg-bosque/5 text-bosque"
        )}
      >
        <span className="text-tinta-suave">{label}:</span>
        <span>{value}</span>
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
