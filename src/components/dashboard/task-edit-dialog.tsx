"use client";

import { useState } from "react";
import { AlertCircle, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectMenu } from "@/components/dashboard/select-menu";
import { DateField } from "@/components/dashboard/date-field";
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

export type TaskCreateInput = {
  descripcion: string;
  prioridad: Prioridad;
  estado: EstadoTarea;
  asignado_id: string | null;
  fecha_limite: string | null;
};

type Mode = "edit" | "create";

export function TaskEditDialog({
  task,
  mode,
  personas,
  open,
  onOpenChange,
  onSave,
  onCreate,
}: {
  // In edit mode this is the source task. In create mode it's null and we use blank defaults.
  task: TaskView | null;
  mode: Mode;
  personas: PersonaOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: TaskPatch) => Promise<void>;
  onCreate: (body: TaskCreateInput) => Promise<void>;
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

  // React 19 pattern: reset campos cuando el modal cambia de tarea o de modo (edit↔create).
  // Lo hacemos durante el render usando una clave compuesta — sin useEffect.
  const formKey = mode === "create" ? "__create__" : task?.id ?? null;
  const [lastFormKey, setLastFormKey] = useState<string | null>(formKey);
  if (formKey !== lastFormKey) {
    setLastFormKey(formKey);
    if (mode === "create") {
      setDescripcion("");
      setPrioridad("media");
      setEstado("pendiente");
      setAsignadoId("");
      setFechaLimite("");
      setError(null);
    } else if (task) {
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
    setError(null);

    const desc = descripcion.trim();
    if (mode === "create") {
      if (!desc) {
        setError("Falta la descripción.");
        return;
      }
      setSaving(true);
      try {
        await onCreate({
          descripcion: desc,
          prioridad,
          estado,
          asignado_id: asignadoId || null,
          fecha_limite: fechaLimite || null,
        });
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No pude crear la tarea.");
      } finally {
        setSaving(false);
      }
      return;
    }

    // Edit mode: build a minimal patch with only changed fields.
    if (!task) return;
    const patch: TaskPatch = {};
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

  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isCreate ? (
                <Plus className="size-4" aria-hidden="true" />
              ) : (
                <Pencil className="size-4" aria-hidden="true" />
              )}
              {isCreate ? "Nueva tarea" : "Editar tarea"}
            </DialogTitle>
            <DialogDescription>
              {isCreate
                ? "Se crea en la bandeja por defecto de tu organización."
                : task
                  ? `Proyecto: ${task.proyecto_nombre}`
                  : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="task-desc"
                className="text-xs font-medium text-tinta-suave"
              >
                Descripción
              </Label>
              <Textarea
                id="task-desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder={
                  isCreate
                    ? "Coordinar la entrega de donaciones del viernes…"
                    : undefined
                }
                required
                rows={3}
                autoFocus={isCreate}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="task-estado"
                  className="text-xs font-medium text-tinta-suave"
                >
                  Estado
                </Label>
                <SelectMenu
                  id="task-estado"
                  ariaLabel="Estado"
                  value={estado}
                  onValueChange={(v) => setEstado(v as EstadoTarea)}
                  options={ESTADO_ORDER.map((e) => ({
                    value: e,
                    label: ESTADO_LABELS[e],
                  }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="task-prio"
                  className="text-xs font-medium text-tinta-suave"
                >
                  Prioridad
                </Label>
                <SelectMenu
                  id="task-prio"
                  ariaLabel="Prioridad"
                  value={prioridad}
                  onValueChange={(v) => setPrioridad(v as Prioridad)}
                  options={PRIORIDADES.map((p) => ({
                    value: p,
                    label: PRIORIDAD_LABEL[p],
                  }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="task-asignado"
                  className="text-xs font-medium text-tinta-suave"
                >
                  Responsable
                </Label>
                <SelectMenu
                  id="task-asignado"
                  ariaLabel="Responsable"
                  value={asignadoId}
                  onValueChange={setAsignadoId}
                  options={[
                    { value: "", label: "Sin responsable" },
                    ...personas.map((p) => ({ value: p.id, label: p.nombre })),
                  ]}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="task-due"
                  className="text-xs font-medium text-tinta-suave"
                >
                  Fecha límite
                </Label>
                <DateField
                  id="task-due"
                  value={fechaLimite}
                  onChange={setFechaLimite}
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
              {saving ? "Guardando…" : isCreate ? "Crear" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
