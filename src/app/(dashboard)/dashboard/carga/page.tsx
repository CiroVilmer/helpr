import { PageHeader } from "@/components/dashboard/page-header";
import {
  WorkloadCard,
  type WorkloadBucket,
} from "@/components/dashboard/workload-card";
import { RedistributeDialog } from "@/components/dashboard/redistribute-dialog";
import { personasService } from "@/services/personas/personas.service";
import { tareasService } from "@/services/tareas/tareas.service";
import { getCurrentOrgContext } from "@/lib/auth/org-context";
import { initialsOf } from "@/types/tasks/view";

export const dynamic = "force-dynamic";

// Carga = cantidad de tareas activas (estado != hecho) asignadas a la persona.
const OCUPADO_MIN = 3; // libre: 0-2
const SOBRECARGADO_MIN = 7; // ocupado: 3-6, sobrecargado: 7+

type Member = {
  id: string;
  nombre: string;
  initials: string;
  count: number;
  bucket: WorkloadBucket;
};

function bucketOf(count: number): WorkloadBucket {
  if (count >= SOBRECARGADO_MIN) return "sobrecargado";
  if (count >= OCUPADO_MIN) return "ocupado";
  return "libre";
}

export default async function CargaPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null; // el layout muestra el empty-state de "sin organización"

  const isAdmin = ctx.rol === "admin";

  const [personas, tareas] = await Promise.all([
    personasService.list({ organizacionId: ctx.organizacionId, activo: true }),
    tareasService.list({ organizacionId: ctx.organizacionId }),
  ]);

  const activos = new Map<string, number>();
  for (const t of tareas) {
    if (t.asignado_id && t.estado !== "hecho") {
      activos.set(t.asignado_id, (activos.get(t.asignado_id) ?? 0) + 1);
    }
  }

  const members: Member[] = personas.map((p) => {
    const nombre = p.apellido ? `${p.nombre} ${p.apellido}` : p.nombre;
    const count = activos.get(p.id) ?? 0;
    return { id: p.id, nombre, initials: initialsOf(nombre), count, bucket: bucketOf(count) };
  });

  // hay a quién repartirle cuando existe al menos otra persona activa
  const hasRecipients = members.length > 1;

  const byCountDesc = (a: Member, b: Member) => b.count - a.count;
  const columns: {
    key: WorkloadBucket;
    title: string;
    hint: string;
    members: Member[];
  }[] = [
    { key: "libre", title: "Libres", hint: "0-2 tareas", members: members.filter((m) => m.bucket === "libre").sort(byCountDesc) },
    { key: "ocupado", title: "Ocupados", hint: "3-6 tareas", members: members.filter((m) => m.bucket === "ocupado").sort(byCountDesc) },
    { key: "sobrecargado", title: "Sobrecargados", hint: "7+ tareas", members: members.filter((m) => m.bucket === "sobrecargado").sort(byCountDesc) },
  ];

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <PageHeader
        title="Carga"
        subtitle="Qué tan ocupado está cada integrante, por tareas activas."
      />

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {columns.map((col) => (
          <section key={col.key} className="flex flex-col gap-3">
            <header className="flex items-center justify-between px-1">
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-semibold text-tinta">{col.title}</h2>
                <span className="text-xs text-tinta-suave">{col.hint}</span>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-tinta-suave">
                {col.members.length}
              </span>
            </header>

            <div className="flex min-h-28 flex-col gap-3 rounded-2xl bg-crema-superficie/60 p-3 ring-1 ring-foreground/5">
              {col.members.length > 0 ? (
                col.members.map((m) => (
                  <WorkloadCard
                    key={m.id}
                    nombre={m.nombre}
                    initials={m.initials}
                    count={m.count}
                    bucket={m.bucket}
                    action={
                      isAdmin && col.key === "sobrecargado" ? (
                        <RedistributeDialog
                          personaId={m.id}
                          nombre={m.nombre}
                          activeCount={m.count}
                          defaultCount={Math.max(1, m.count - (SOBRECARGADO_MIN - 1))}
                          hasRecipients={hasRecipients}
                        />
                      ) : undefined
                    }
                  />
                ))
              ) : (
                <p className="px-2 py-6 text-center text-sm text-tinta-suave">
                  Nadie por acá.
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
