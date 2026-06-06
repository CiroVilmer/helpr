// src/repositories/tareas-borrador/tareas-borrador.repository.ts
// 'remitente' = the sender persona matched on telefono = wa_id (telefono is UNIQUE, so <=1 match).
// asignado/creado_por use separate aliased joins. When organizacionId is given, the remitente
// org filter effectively requires a matching persona (rows without one are excluded).
import 'server-only'
import { aliasedTable, and, desc, eq, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { tareas_borrador, personas } from '@/db/schema'
import type { TareasBorradorQuery } from '@/types/tareas-borrador/dto/tareas-borrador.dto'

const remitente = aliasedTable(personas, 'borrador_remitente')
const asignado = aliasedTable(personas, 'borrador_asignado')
const creador = aliasedTable(personas, 'borrador_creador')

export const tareasBorradorRepository = {
  list(q: TareasBorradorQuery) {
    const conds: SQL[] = []
    if (q.waId) conds.push(eq(tareas_borrador.wa_id, q.waId))
    if (q.estado) conds.push(eq(tareas_borrador.estado, q.estado))
    if (q.organizacionId) conds.push(eq(remitente.organizacion_id, q.organizacionId))
    return db
      .select({
        id: tareas_borrador.id,
        wa_id: tareas_borrador.wa_id,
        descripcion: tareas_borrador.descripcion,
        prioridad: tareas_borrador.prioridad,
        fecha_limite: tareas_borrador.fecha_limite,
        origen: tareas_borrador.origen,
        estado: tareas_borrador.estado,
        created_at: tareas_borrador.created_at,
        asignado_id: tareas_borrador.asignado_id,
        asignado_nombre: asignado.nombre,
        creado_por_id: tareas_borrador.creado_por_id,
        creado_por_nombre: creador.nombre,
        remitente_nombre: remitente.nombre,
      })
      .from(tareas_borrador)
      .leftJoin(remitente, eq(remitente.telefono, tareas_borrador.wa_id))
      .leftJoin(asignado, eq(tareas_borrador.asignado_id, asignado.id))
      .leftJoin(creador, eq(tareas_borrador.creado_por_id, creador.id))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(tareas_borrador.created_at))
  },
}
