"use client";

import { useMemo, useState, useTransition } from "react";
import { UserPlus, Search, Check } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ESTADO_LABELS } from "@/types/tasks/view";
import { asignarTareas } from "@/app/(dashboard)/dashboard/carga/actions";
import type { EstadoTarea, Prioridad } from "@/db/schema/tareas";

export type AssignableTask = {
  id: string;
  descripcion: string;
  prioridad: Prioridad;
  estado: EstadoTarea;
  asignado_id: string | null;
  asignado_nombre: string | null;
};

const PRIO_DOT: Record<Prioridad, string> = {
  alta: "bg-clay",
  media: "bg-ambar",
  baja: "bg-bosque",
};

export function AssignTaskDialog({
  toPersonaId,
  toNombre,
  tasks,
}: {
  toPersonaId: string;
  toNombre: string;
  tasks: AssignableTask[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  // Assignable = active tasks that aren't already this person's (reassigns from others if picked).
  const assignable = useMemo(
    () => tasks.filter((t) => t.estado !== "hecho" && t.asignado_id !== toPersonaId),
    [tasks, toPersonaId],
  );
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assignable;
    return assignable.filter((t) => t.descripcion.toLowerCase().includes(q));
  }, [assignable, query]);

  // Reset selection + search each time the dialog (re)opens — render-phase, no useEffect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelected(new Set());
      setQuery("");
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function asignar() {
    const ids = [...selected];
    if (ids.length === 0) return;
    startTransition(async () => {
      const res = await asignarTareas(toPersonaId, ids);
      if (res.ok) {
        toast.success(
          `Asigné ${res.count} ${res.count === 1 ? "tarea" : "tareas"} a ${toNombre}.`,
        );
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
        onClick={() => setOpen(true)}
      >
        <UserPlus aria-hidden="true" />
        Asignar tarea
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-4" aria-hidden="true" />
              Asignar tareas a {toNombre}
            </DialogTitle>
            <DialogDescription>
              Elegí una o más. Si una ya es de otra persona, se la reasignás a {toNombre}.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-tinta-suave"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tarea…"
              className="pl-8"
            />
          </div>

          <div className="max-h-[min(60vh,24rem)] overflow-y-auto rounded-lg border border-linea">
            {visible.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-tinta-suave">
                {assignable.length === 0
                  ? "No hay tareas para asignar."
                  : "Nada coincide con la búsqueda."}
              </p>
            ) : (
              <ul className="divide-y divide-linea">
                {visible.map((t) => {
                  const checked = selected.has(t.id);
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => toggle(t.id)}
                        aria-pressed={checked}
                        className={cn(
                          "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                          checked && "bg-bosque/5",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                            checked
                              ? "border-bosque bg-bosque text-crema-base"
                              : "border-input",
                          )}
                          aria-hidden="true"
                        >
                          {checked && <Check className="size-3" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-foreground">
                            {t.descripcion}
                          </span>
                          <span className="mt-0.5 flex items-center gap-2 text-xs text-tinta-suave">
                            <span
                              className={cn("size-1.5 rounded-full", PRIO_DOT[t.prioridad])}
                              aria-hidden="true"
                            />
                            {ESTADO_LABELS[t.estado]}
                            <span aria-hidden="true">·</span>
                            {t.asignado_nombre ?? "Sin responsable"}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-tinta-suave">
              {selected.size} seleccionada{selected.size === 1 ? "" : "s"}
            </span>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={asignar}
                disabled={pending || selected.size === 0}
              >
                {pending
                  ? "Asignando…"
                  : selected.size > 0
                    ? `Asignar ${selected.size}`
                    : "Asignar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
