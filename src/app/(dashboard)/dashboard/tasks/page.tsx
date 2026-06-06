import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { TasksBoard } from "@/components/dashboard/tasks-board";
import { dashboardService } from "@/services/dashboard/dashboard.service";

export default async function TasksPage() {
  const tasks = await dashboardService.getTasks();

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

      <TasksBoard tasks={tasks} />
    </div>
  );
}