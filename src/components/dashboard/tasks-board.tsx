"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { CalendarClock, FolderKanban, Plus, UserX, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { KanbanColumn } from "@/components/dashboard/kanban-column";
import { SelectMenu } from "@/components/dashboard/select-menu";
import {
  TaskEditDialog,
  type TaskCreateInput,
  type TaskPatch,
} from "@/components/dashboard/task-edit-dialog";
import {
  ESTADO_LABELS,
  type DbTareaRow,
  type PersonaOption,
  type ProjectOption,
  type TaskView,
  toTaskView,
} from "@/types/tasks/view";
import type { EstadoTarea, Prioridad } from "@/db/schema/tareas";

type PriorityFilter = Prioridad | "all";
type AssigneeFilter = string | "all" | "none";
type ProjectFilter = string | "all";

export function TasksBoard({
  initialTasks,
  personas,
  projects,
}: {
  initialTasks: TaskView[];
  personas: PersonaOption[];
  projects: ProjectOption[];
}) {
  const [tasks, setTasks] = useState<TaskView[]>(initialTasks);
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [assignee, setAssignee] = useState<AssigneeFilter>("all");
  const [project, setProject] = useState<ProjectFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"edit" | "create">("edit");

  // Resync con el server cuando router.refresh() trae datos nuevos (patrón sin useEffect:
  // ajustar estado durante el render comparando la prop anterior).
  const [lastInitial, setLastInitial] = useState(initialTasks);
  if (initialTasks !== lastInitial) {
    setLastInitial(initialTasks);
    setTasks(initialTasks);
  }

  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  // Realtime: ante cualquier cambio en `tareas`, re-fetcheamos del server (query con joins +
  // scoping correcto). Requiere la policy RLS de SELECT en tareas + estar logueado.
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) supabase.realtime.setAuth(token);
      if (cancelled) return;
      channel = supabase
        .channel("tareas-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tareas" },
          () => router.refresh()
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (priority !== "all" && t.prioridad !== priority) return false;
      if (assignee === "none" && t.asignado !== null) return false;
      if (
        assignee !== "all" &&
        assignee !== "none" &&
        t.asignado?.id !== assignee
      )
        return false;
      if (project !== "all" && t.proyecto_id !== project) return false;
      return true;
    });
  }, [tasks, priority, assignee, project]);

  const pendiente = filtered.filter((t) => t.estado === "pendiente");
  const enProgreso = filtered.filter((t) => t.estado === "en_progreso");
  const hecho = filtered.filter((t) => t.estado === "hecho");
  const unfinished = filtered.filter((t) => t.estado !== "hecho");
  const proyectosEnCurso = new Set(unfinished.map((t) => t.proyecto_id)).size;
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const vencenHoy = unfinished.filter((t) => t.fecha_limite === today).length;
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
  const hasFilters =
    priority !== "all" || assignee !== "all" || project !== "all";

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
          label="Proyectos en curso"
          value={proyectosEnCurso}
          icon={FolderKanban}
        />
        <StatCard
          label="Vencen hoy"
          value={vencenHoy}
          icon={CalendarClock}
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
        <SelectMenu
          variant="pill"
          label="Prioridad"
          active={priority !== "all"}
          value={priority}
          onValueChange={(v) => setPriority(v as PriorityFilter)}
          options={[
            { value: "all", label: "Todas" },
            { value: "alta", label: "Alta" },
            { value: "media", label: "Media" },
            { value: "baja", label: "Baja" },
          ]}
        />

        <SelectMenu
          variant="pill"
          label="Responsable"
          active={assignee !== "all"}
          value={assignee}
          onValueChange={(v) => setAssignee(v as AssigneeFilter)}
          options={[
            { value: "all", label: "Todas" },
            { value: "none", label: "Sin responsable" },
            ...assigneeOptions.map((p) => ({ value: p.id, label: p.nombre })),
          ]}
        />

        <SelectMenu
          variant="pill"
          label="Proyecto"
          active={project !== "all"}
          value={project}
          onValueChange={(v) => setProject(v as ProjectFilter)}
          options={[
            { value: "all", label: "Todos" },
            ...projects.map((p) => ({ value: p.id, label: p.nombre })),
          ]}
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPriority("all");
              setAssignee("all");
              setProject("all");
            }}
          >
            <X aria-hidden="true" />
            Limpiar
          </Button>
        )}
      </div>

      <DndContext id="tasks-board" sensors={sensors} onDragEnd={onDragEnd}>
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
