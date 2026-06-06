import { Plus, CircleDashed, Loader, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { KanbanColumn } from "@/components/dashboard/kanban-column";
import { TASKS } from "@/components/dashboard/data";

export default function TasksPage() {
  const todo = TASKS.filter((t) => t.status === "todo");
  const doing = TASKS.filter((t) => t.status === "doing");
  const done = TASKS.filter((t) => t.status === "done");
  const sinResponsable = TASKS.filter(
    (t) => !t.assignee && t.status !== "done"
  ).length;

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <PageHeader
        title="Tareas"
        subtitle="Lo que el equipo tiene entre manos, ordenado."
        action={
          <Button>
            <Plus aria-hidden="true" />
            Nueva tarea
          </Button>
        }
      />

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

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <KanbanColumn title="Por hacer" tasks={todo} />
        <KanbanColumn title="Haciendo" tasks={doing} />
        <KanbanColumn title="Listo" tasks={done} />
      </div>
    </div>
  );
}
