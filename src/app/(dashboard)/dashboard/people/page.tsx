import { LinkIcon, Phone } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/dashboard/page-header";
import { NewPersonasDialog } from "@/components/dashboard/new-personas-dialog";
import { personasService } from "@/services/personas/personas.service";
import { getCurrentOrgContext } from "@/lib/auth/org-context";

export const dynamic = "force-dynamic";

function initialsOf(nombre: string, apellido: string | null): string {
  const a = nombre.trim().charAt(0);
  const b = (apellido ?? "").trim().charAt(0);
  return (a + b || a || "?").toUpperCase();
}

function rolLabel(rol: string | null): string {
  if (rol === "admin") return "Admin";
  return "Voluntaria/o";
}

export default async function PeoplePage() {
  // El layout ya gated el orgCtx, pero TS no lo sabe; volvemos a leer (está cacheado por request).
  const ctx = await getCurrentOrgContext();
  const personas = ctx
    ? await personasService.list({
        organizacionId: ctx.organizacionId,
        activo: undefined,
      })
    : [];
  const isAdmin = ctx?.rol === "admin";

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <PageHeader
        title="Personas"
        subtitle={
          isAdmin
            ? "Tu equipo y sus números de WhatsApp."
            : "Tu equipo. Solo los admins pueden agregar personas."
        }
        action={isAdmin ? <NewPersonasDialog /> : undefined}
      />

      {personas.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-card p-10 text-center ring-1 ring-foreground/10 shadow-[var(--shadow-card)]">
          <p className="text-sm text-tinta-suave">
            Todavía no hay personas. Agregá la primera para mandarle el link de
            invitación.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 shadow-[var(--shadow-card)]">
          <ul className="divide-y divide-linea">
            {personas.map((p) => {
              const nombre = p.apellido
                ? `${p.nombre} ${p.apellido}`
                : p.nombre;
              const linked = Boolean(p.auth_id);
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-4 px-4 py-3.5 sm:px-5"
                >
                  <Avatar>
                    <AvatarFallback className="bg-bosque text-xs font-semibold text-crema-base">
                      {initialsOf(p.nombre, p.apellido)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {nombre}
                    </p>
                    <p className="truncate text-sm text-tinta-suave">
                      {rolLabel(p.rol)}
                    </p>
                  </div>

                  {!linked && (
                    <span
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ambar/15 px-2 py-0.5 text-xs font-medium text-ambar"
                      title="Todavía no se vinculó a una cuenta del panel"
                    >
                      <LinkIcon className="size-3" aria-hidden="true" />
                      Pendiente
                    </span>
                  )}

                  <a
                    href={`https://wa.me/${p.telefono.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-sm text-tinta-suave tabular-nums transition-colors hover:bg-muted hover:text-bosque"
                  >
                    <Phone className="size-4 shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">{p.telefono}</span>
                    <span className="sm:hidden">WhatsApp</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
