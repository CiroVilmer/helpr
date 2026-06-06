"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";
import { TaskCard } from "@/components/dashboard/task-card";
import type { TaskView } from "@/types/tasks/view";
import type { EstadoTarea } from "@/db/schema/tareas";

export function KanbanColumn({
  title,
  estado,
  tasks,
  onOpen,
}: {
  title: string;
  estado: EstadoTarea;
  tasks: TaskView[];
  onOpen: (id: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column:${estado}`,
    data: { estado },
  });

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-tinta">{title}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-tinta-suave">
          {tasks.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-28 flex-col gap-3 rounded-2xl p-3 ring-1 transition-colors",
          isOver
            ? "bg-bosque/5 ring-bosque/30"
            : "bg-crema-superficie/60 ring-foreground/5"
        )}
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpen} />
          ))
        ) : (
          <p className="px-2 py-6 text-center text-sm text-tinta-suave">
            Nada por acá todavía.
          </p>
        )}
      </div>
    </section>
  );
}
