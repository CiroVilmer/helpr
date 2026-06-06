// src/app/(dashboard)/dashboard/carga/actions.ts
// Admin-gated server actions for the workload board. The admin check happens HERE (server-side)
// regardless of whether the button was shown, then delegates to the carga service and revalidates.
'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { cargaService } from '@/services/carga/carga.service'

export type RepartirResult =
  | { ok: true; moved: number; recipients: number }
  | { ok: false; error: string }

export type AsignarResult =
  | { ok: true; count: number }
  | { ok: false; error: string }

function userMessageOf(err: unknown): string | undefined {
  return err && typeof err === 'object' && 'userMessage' in err
    ? String((err as { userMessage: unknown }).userMessage)
    : undefined
}

export async function repartirTareas(
  fromPersonaId: string,
  count: number,
): Promise<RepartirResult> {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { ok: false, error: 'Iniciá sesión.' }
  if (ctx.rol !== 'admin') {
    return { ok: false, error: 'Solo los admins pueden repartir tareas.' }
  }

  try {
    const res = await cargaService.redistribute(ctx.organizacionId, fromPersonaId, count)
    revalidatePath('/dashboard/carga')
    return { ok: true, moved: res.moved, recipients: res.recipients }
  } catch (err) {
    return { ok: false, error: userMessageOf(err) ?? 'No se pudo repartir.' }
  }
}

export async function asignarTareas(
  toPersonaId: string,
  taskIds: string[],
): Promise<AsignarResult> {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { ok: false, error: 'Iniciá sesión.' }
  if (ctx.rol !== 'admin') {
    return { ok: false, error: 'Solo los admins pueden asignar tareas desde acá.' }
  }

  try {
    const res = await cargaService.assign(ctx.organizacionId, toPersonaId, taskIds)
    revalidatePath('/dashboard/carga')
    revalidatePath('/dashboard/tasks')
    return { ok: true, count: res.assigned }
  } catch (err) {
    return { ok: false, error: userMessageOf(err) ?? 'No se pudo asignar.' }
  }
}
