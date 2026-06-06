import { redirect } from "next/navigation";

// El dashboard arranca en Tareas (no hay tab "Tablero").
export default function DashboardIndex() {
  redirect("/dashboard/tasks");
}
