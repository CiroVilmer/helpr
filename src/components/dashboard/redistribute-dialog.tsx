"use client";

import { useState, useTransition } from "react";
import { Shuffle, Minus, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { repartirTareas } from "@/app/(dashboard)/dashboard/carga/actions";

export function RedistributeDialog({
  personaId,
  nombre,
  activeCount,
  defaultCount,
  hasRecipients,
}: {
  personaId: string;
  nombre: string;
  activeCount: number;
  defaultCount: number;
  hasRecipients: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(
    Math.min(Math.max(defaultCount, 1), activeCount),
  );
  const [pending, startTransition] = useTransition();

  function repartir() {
    startTransition(async () => {
      const res = await repartirTareas(personaId, count);
      if (res.ok) {
        toast.success(
          `Repartí ${res.moved} ${res.moved === 1 ? "tarea" : "tareas"} entre ${res.recipients} ${res.recipients === 1 ? "persona" : "personas"}.`,
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
        className="w-full border-clay/30 text-clay hover:bg-clay/10 hover:text-clay"
        onClick={() => setOpen(true)}
        disabled={!hasRecipients}
        title={hasRecipients ? undefined : "No hay a quién repartirle"}
      >
        <Shuffle aria-hidden="true" />
        Repartir tareas
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shuffle className="size-4" aria-hidden="true" />
              Repartir tareas de {nombre}
            </DialogTitle>
            <DialogDescription>
              Se reasignan a los más libres del equipo, empezando por quienes no
              tienen tareas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-2">
            <span className="text-sm text-tinta-suave">¿Cuántas tareas repartir?</span>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCount((c) => Math.max(1, c - 1))}
                disabled={count <= 1 || pending}
                aria-label="Menos"
              >
                <Minus aria-hidden="true" />
              </Button>
              <span className="w-10 text-center font-display text-3xl font-bold tabular-nums text-tinta">
                {count}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCount((c) => Math.min(activeCount, c + 1))}
                disabled={count >= activeCount || pending}
                aria-label="Más"
              >
                <Plus aria-hidden="true" />
              </Button>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-tinta-suave">
              <Users className="size-3.5" aria-hidden="true" />
              de {activeCount} activas
            </span>
          </div>

          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={repartir} disabled={pending}>
              {pending ? "Repartiendo…" : `Repartir ${count}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
