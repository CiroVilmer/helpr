// src/services/carga/carga.service.ts
// Workload-board mutations. Reads loads via the existing services (org-scoped). `redistribute`
// sheds N of an overloaded person's tasks to the least-loaded teammates; `assign` bulk-assigns
// chosen tasks to one person. Admin + org checks live in the server actions (carga/actions.ts).
import 'server-only'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { tareas } from '@/db/schema'
import { tareasRepository } from '@/repositories/tareas/tareas.repository'
import { tareasService } from '@/services/tareas/tareas.service'
import { personasService } from '@/services/personas/personas.service'
import { NotFoundException, ValidationException } from '@/exceptions/base/base-exceptions'

const PRIORITY_WEIGHT: Record<string, number> = { baja: 1, media: 2, alta: 3 }

export type RedistributeResult = { moved: number; recipients: number }
export type AssignResult = { assigned: number }

export const cargaService = {
  async redistribute(
    organizacionId: string,
    fromPersonaId: string,
    count: number,
  ): Promise<RedistributeResult> {
    if (!Number.isInteger(count) || count < 1) {
      throw new ValidationException('count must be a positive integer', 'Elegí cuántas tareas repartir.')
    }

    const [people, rows] = await Promise.all([
      personasService.list({ organizacionId, activo: true }),
      tareasService.list({ organizacionId }),
    ])

    if (!people.some((p) => p.id === fromPersonaId)) {
      throw new NotFoundException('persona not in org', 'Esa persona no es de tu organización.')
    }

    // current active (non-done) load per persona
    const load = new Map<string, number>()
    for (const t of rows) {
      if (t.asignado_id && t.estado !== 'hecho') {
        load.set(t.asignado_id, (load.get(t.asignado_id) ?? 0) + 1)
      }
    }

    // tasks to move: fromPersona's active tasks, lowest priority first, capped at `count`
    const movable = rows
      .filter((t) => t.asignado_id === fromPersonaId && t.estado !== 'hecho')
      .sort(
        (a, b) =>
          (PRIORITY_WEIGHT[a.prioridad ?? 'media'] ?? 2) - (PRIORITY_WEIGHT[b.prioridad ?? 'media'] ?? 2),
      )
      .slice(0, count)

    if (movable.length === 0) {
      throw new ValidationException(
        'no active tasks to move',
        'Esta persona no tiene tareas activas para repartir.',
      )
    }

    // recipients: other active people, balanced greedily (each task -> currently least-loaded)
    const recipients = people
      .filter((p) => p.id !== fromPersonaId)
      .map((p) => ({ id: p.id, load: load.get(p.id) ?? 0 }))

    if (recipients.length === 0) {
      throw new ValidationException(
        'no recipients',
        'No hay a quién repartirle (no hay otras personas activas).',
      )
    }

    const assignments: { taskId: string; toPersonaId: string }[] = []
    const used = new Set<string>()
    for (const t of movable) {
      recipients.sort((a, b) => a.load - b.load)
      const target = recipients[0]
      assignments.push({ taskId: t.id, toPersonaId: target.id })
      target.load += 1
      used.add(target.id)
    }

    await db.transaction(async (tx) => {
      for (const a of assignments) {
        await tx.update(tareas).set({ asignado_id: a.toPersonaId }).where(eq(tareas.id, a.taskId))
      }
    })

    return { moved: assignments.length, recipients: used.size }
  },

  // Bulk-assigns the given tasks to one person. Org-scopes the ids (ignores any not in the org)
  // and verifies the target persona belongs to the org, then sets asignado_id in a single UPDATE.
  async assign(
    organizacionId: string,
    toPersonaId: string,
    taskIds: string[],
  ): Promise<AssignResult> {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      throw new ValidationException('no task ids', 'Elegí al menos una tarea.')
    }

    const inOrg = await tareasRepository.personaIsInOrg(toPersonaId, organizacionId)
    if (!inOrg) {
      throw new NotFoundException('persona not in org', 'Esa persona no es de tu organización.')
    }

    // org-scope: only touch tasks that belong to this org (don't trust the client's id list)
    const rows = await tareasService.list({ organizacionId })
    const orgIds = new Set(rows.map((r) => r.id))
    const valid = [...new Set(taskIds)].filter((id) => orgIds.has(id))
    if (valid.length === 0) {
      throw new ValidationException('no valid tasks', 'Esas tareas no son de tu organización.')
    }

    await db.update(tareas).set({ asignado_id: toPersonaId }).where(inArray(tareas.id, valid))
    return { assigned: valid.length }
  },
}
