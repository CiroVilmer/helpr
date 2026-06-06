// src/app/(dashboard)/dashboard/carga/actions.ts
// Admin-gated server action behind the "Repartir tareas" button. The admin check happens HERE
// (server-side) regardless of whether the button was shown, then delegates to the redistribution
// service and revalidates the board.
'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { cargaService } from '@/services/carga/carga.service'

export type RepartirResult =
  | { ok: true; moved: number; recipients: number }
  | { ok: false; error: string }

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
    const userMessage =
      err && typeof err === 'object' && 'userMessage' in err
        ? String((err as { userMessage: unknown }).userMessage)
        : 'No se pudo repartir.'
    return { ok: false, error: userMessage }
  }
}
