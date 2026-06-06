"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import {
  ChevronDown,
  CircleDashed,
  Loader,
  Plus,
  UserX,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { KanbanColumn } from "@/components/dashboard/kanban-column";
import {
  TaskEditDialog,
  type TaskCreateInput,
  type TaskPatch,
} from "@/components/dashboard/task-edit-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ESTADO_LABELS,
  type DbTareaRow,
  type PersonaOption,
  type TaskView,
  toTaskView,
} from "@/types/tasks/view";
import type { EstadoTarea, Prioridad } from "@/db/schema/tareas";

type PriorityFilter = Prioridad | "all";
type AssigneeFilter = string | "all" | "none";

const PRIORITY_LABEL: Record<PriorityFilter, string> = {
  all: "Todas",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export function TasksBoard({
  initialTasks,
  personas,
}: {
  initialTasks: TaskView[];
  personas: PersonaOption[];
}) {
  const [tasks, setTasks] = useState<TaskView[]>(initialTasks);
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [assignee, setAssignee] = useState<AssigneeFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"edit" | "create">("edit");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (priority !== "all" && t.prioridad !== priority) return false;
      if (assignee === "none") return t.asignado === null;
      if (assignee !== "all" && t.asignado?.id !== assignee) return false;
      return true;
    });
  }, [tasks, priority, assignee]);

  const pendiente = filtered.filter((t) => t.estado === "pendiente");
  const enProgreso = filtered.filter((t) => t.estado === "en_progreso");
  const hecho = filtered.filter((t) => t.estado === "hecho");
  const sinResponsable = filtered.filter(
    (t) => !t.asignado && t.estado !== "hecho"
  ).length;

  const editingTask = editingId
    ? tasks.find((t) => t.id === editingId) ?? null
    : null;

  function openEdit(id: string) {
    setEditingId(id);
    setDialogMode("edit");
    setDialogOpen(true);
  }

  function openCreate() {
    setEditingId(null);
    setDialogMode("create");
    setDialogOpen(true);
  }

  async function patchTask(id: string, patch: TaskPatch) {
    const res = await fetch(`/api/tareas/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as
        | { error?: { userMessage?: string } }
        | null;
      throw new Error(
        json?.error?.userMessage ?? "No pude actualizar la tarea."
      );
    }
    return (await res.json()) as { data: DbTareaRow };
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith("column:")) return;
    const targetEstado = overId.slice("column:".length) as EstadoTarea;

    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.estado === targetEstado) return;

    const prev = tasks;
    // Optimistic: move now, reconcile (or rollback) when the server replies.
    setTasks((ts) =>
      ts.map((t) => (t.id === task.id ? { ...t, estado: targetEstado } : t))
    );
    try {
      const { data } = await patchTask(task.id, { estado: targetEstado });
      setTasks((ts) =>
        ts.map((t) => (t.id === task.id ? toTaskView(data) : t))
      );
    } catch (err) {
      setTasks(prev);
      toast.error(
        err instanceof Error ? err.message : "No pude mover la tarea."
      );
    }
  }

  async function onCreate(body: TaskCreateInput) {
    const res = await fetch("/api/tareas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as
        | { error?: { userMessage?: string } }
        | null;
      throw new Error(
        json?.error?.userMessage ?? "No pude crear la tarea."
      );
    }
    const { data } = (await res.json()) as { data: DbTareaRow };
    const view = toTaskView(data);
    setTasks((ts) => [view, ...ts]);
    toast.success("Tarea creada");
  }

  async function onSaveEdit(id: string, patch: TaskPatch) {
    const prev = tasks;
    // Optimistic merge so the modal closes instantly.
    setTasks((ts) =>
      ts.map((t) => {
        if (t.id !== id) return t;
        const next: TaskView = { ...t };
        if (patch.descripcion !== undefined) next.descripcion = patch.descripcion;
        if (patch.prioridad !== undefined) next.prioridad = patch.prioridad;
        if (patch.estado !== undefined) next.estado = patch.estado;
        if (patch.fecha_limite !== undefined)
          next.fecha_limite = patch.fecha_limite;
        if (patch.asignado_id !== undefined) {
          if (patch.asignado_id === null) {
            next.asignado = null;
          } else {
            const p = personas.find((pp) => pp.id === patch.asignado_id);
            next.asignado = p
              ? { id: p.id, nombre: p.nombre, initials: p.initials }
              : t.asignado;
          }
        }
        return next;
      })
    );

    try {
      const { data } = await patchTask(id, patch);
      setTasks((ts) =>
        ts.map((t) => (t.id === id ? toTaskView(data) : t))
      );
      toast.success("Tarea actualizada");
    } catch (err) {
      setTasks(prev);
      throw err;
    }
  }

  const assigneeOptions = useMemo(() => {
    return personas
      .slice()
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [personas]);
  const hasFilters = priority !== "all" || assignee !== "all";
  const assigneeLabel =
    assignee === "all"
      ? "Todas"
      : assignee === "none"
      ? "Sin responsable"
      : assigneeOptions.find((p) => p.id === assignee)?.nombre ?? "Todas";

  return (
    <>
      <PageHeader
        title="Tareas"
        subtitle="Lo que el equipo tiene entre manos, ordenado."
        action={
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" />
            Nueva tarea
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pendientes"
          value={pendiente.length}
          icon={CircleDashed}
        />
        <StatCard
          label="En curso"
          value={enProgreso.length}
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
            {assigneeOptions.map((p) => (
              <DropdownMenuRadioItem key={p.id} value={p.id}>
                {p.nombre}
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

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <KanbanColumn
            title={ESTADO_LABELS.pendiente}
            estado="pendiente"
            tasks={pendiente}
            onOpen={openEdit}
          />
          <KanbanColumn
            title={ESTADO_LABELS.en_progreso}
            estado="en_progreso"
            tasks={enProgreso}
            onOpen={openEdit}
          />
          <KanbanColumn
            title={ESTADO_LABELS.hecho}
            estado="hecho"
            tasks={hecho}
            onOpen={openEdit}
          />
        </div>
      </DndContext>

      <TaskEditDialog
        task={editingTask}
        mode={dialogMode}
        personas={assigneeOptions}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingId(null);
        }}
        onSave={onSaveEdit}
        onCreate={onCreate}
      />
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
