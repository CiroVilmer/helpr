import { TasksBoard } from "@/components/dashboard/tasks-board";
import { tareasService } from "@/services/tareas/tareas.service";
import { personasService } from "@/services/personas/personas.service";
import { proyectosService } from "@/services/proyectos/proyectos.service";
import { getCurrentOrgContext } from "@/lib/auth/org-context";
import {
  initialsOf,
  toTaskView,
  type PersonaOption,
  type ProjectOption,
} from "@/types/tasks/view";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) {
    // El layout muestra un empty-state cuando no hay contexto; este return es por TS.
    return null;
  }

  const [rows, personasRows, proyectosRows] = await Promise.all([
    tareasService.list({ organizacionId: ctx.organizacionId }),
    personasService.list({ organizacionId: ctx.organizacionId, activo: true }),
    proyectosService.list({
      organizacionId: ctx.organizacionId,
      activo: undefined,
      esBandeja: undefined,
    }),
  ]);

  const tasks = rows.map(toTaskView);
  const personas: PersonaOption[] = personasRows.map((p) => {
    const nombre = p.apellido ? `${p.nombre} ${p.apellido}` : p.nombre;
    return { id: p.id, nombre, initials: initialsOf(nombre) };
  });
  const projects: ProjectOption[] = proyectosRows.map((p) => ({
    id: p.id,
    nombre: p.nombre,
  }));

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <TasksBoard
        initialTasks={tasks}
        personas={personas}
        projects={projects}
      />
    </div>
  );
}
