"use client";

import { useState } from "react";
import { AlertCircle, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ESTADO_LABELS,
  ESTADO_ORDER,
  type PersonaOption,
  type TaskView,
} from "@/types/tasks/view";
import type { EstadoTarea, Prioridad } from "@/db/schema/tareas";

const PRIORIDADES: Prioridad[] = ["alta", "media", "baja"];
const PRIORIDAD_LABEL: Record<Prioridad, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export type TaskPatch = {
  descripcion?: string;
  prioridad?: Prioridad;
  estado?: EstadoTarea;
  asignado_id?: string | null;
  fecha_limite?: string | null;
};

export function TaskEditDialog({
  task,
  personas,
  open,
  onOpenChange,
  onSave,
}: {
  task: TaskView | null;
  personas: PersonaOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: TaskPatch) => Promise<void>;
}) {
  const [descripcion, setDescripcion] = useState(task?.descripcion ?? "");
  const [prioridad, setPrioridad] = useState<Prioridad>(
    task?.prioridad ?? "media"
  );
  const [estado, setEstado] = useState<EstadoTarea>(task?.estado ?? "pendiente");
  const [asignadoId, setAsignadoId] = useState<string>(
    task?.asignado?.id ?? ""
  );
  const [fechaLimite, setFechaLimite] = useState<string>(
    task?.fecha_limite ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // React 19 pattern: cuando cambia la tarea (cliquearon otra card) reseteamos los campos del
  // form durante el render — sin useEffect.
  const [lastTaskId, setLastTaskId] = useState<string | null>(task?.id ?? null);
  if ((task?.id ?? null) !== lastTaskId) {
    setLastTaskId(task?.id ?? null);
    if (task) {
      setDescripcion(task.descripcion);
      setPrioridad(task.prioridad);
      setEstado(task.estado);
      setAsignadoId(task.asignado?.id ?? "");
      setFechaLimite(task.fecha_limite ?? "");
      setError(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task) return;
    setError(null);

    const patch: TaskPatch = {};
    const desc = descripcion.trim();
    if (desc && desc !== task.descripcion) patch.descripcion = desc;
    if (prioridad !== task.prioridad) patch.prioridad = prioridad;
    if (estado !== task.estado) patch.estado = estado;

    const newAsignado = asignadoId || null;
    if (newAsignado !== (task.asignado?.id ?? null)) {
      patch.asignado_id = newAsignado;
    }

    const newDue = fechaLimite || null;
    if (newDue !== task.fecha_limite) patch.fecha_limite = newDue;

    if (Object.keys(patch).length === 0) {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(task.id, patch);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4" aria-hidden="true" />
              Editar tarea
            </DialogTitle>
            {task && (
              <DialogDescription>
                Proyecto: {task.proyecto_nombre}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-desc" className="text-xs">
                Descripción
              </Label>
              <Textarea
                id="task-desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-estado" className="text-xs">
                  Estado
                </Label>
                <select
                  id="task-estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoTarea)}
                  className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {ESTADO_ORDER.map((e) => (
                    <option key={e} value={e}>
                      {ESTADO_LABELS[e]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-prio" className="text-xs">
                  Prioridad
                </Label>
                <select
                  id="task-prio"
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as Prioridad)}
                  className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PRIORIDADES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORIDAD_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-asignado" className="text-xs">
                  Responsable
                </Label>
                <select
                  id="task-asignado"
                  value={asignadoId}
                  onChange={(e) => setAsignadoId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Sin responsable</option>
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-due" className="text-xs">
                  Fecha límite
                </Label>
                <Input
                  id="task-due"
                  type="date"
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-clay/10 px-3 py-2.5 text-sm text-clay"
            >
              <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              {error}
            </p>
          )}

          <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
