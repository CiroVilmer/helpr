import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { TasksBoard } from "@/components/dashboard/tasks-board";
import { TASKS } from "@/components/dashboard/data";

export default function TasksPage() {
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

      <TasksBoard tasks={TASKS} />
    </div>
  );
}
