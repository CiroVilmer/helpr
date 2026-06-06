import { TaskCard } from "@/components/dashboard/task-card";
import type { Task } from "@/components/dashboard/data";

export function KanbanColumn({
  title,
  tasks,
}: {
  title: string;
  tasks: Task[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-tinta">{title}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-tinta-suave">
          {tasks.length}
        </span>
      </header>

      <div className="flex min-h-28 flex-col gap-3 rounded-2xl bg-crema-superficie/60 p-3 ring-1 ring-foreground/5">
        {tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <p className="px-2 py-6 text-center text-sm text-tinta-suave">
            Nada por acá todavía.
          </p>
        )}
      </div>
    </section>
  );
}
