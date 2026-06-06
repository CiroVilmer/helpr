// src/repositories/tareas/tareas.repository.ts
// Org-scoping joins proyectos (every tarea has a NOT NULL proyecto_id). asignado/creado_por both
// FK personas, so they use aliased leftJoins (avoids the relational "multiple relations" issue).
import 'server-only'
import { aliasedTable, and, desc, eq, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { tareas, proyectos, personas } from '@/db/schema'
import type { TareasQuery } from '@/types/tareas/dto/tareas.dto'

const asignado = aliasedTable(personas, 'tarea_asignado')
const creador = aliasedTable(personas, 'tarea_creador')

const tareaSelect = {
  id: tareas.id,
  descripcion: tareas.descripcion,
  prioridad: tareas.prioridad,
  estado: tareas.estado,
  fecha_limite: tareas.fecha_limite,
  origen: tareas.origen,
  created_at: tareas.created_at,
  proyecto_id: tareas.proyecto_id,
  proyecto_nombre: proyectos.nombre,
  asignado_id: tareas.asignado_id,
  asignado_nombre: asignado.nombre,
  creado_por_id: tareas.creado_por_id,
  creado_por_nombre: creador.nombre,
}

export const tareasRepository = {
  list(q: TareasQuery) {
    const conds: SQL[] = [eq(proyectos.organizacion_id, q.organizacionId)]
    if (q.proyectoId) conds.push(eq(tareas.proyecto_id, q.proyectoId))
    if (q.asignadoId) conds.push(eq(tareas.asignado_id, q.asignadoId))
    if (q.estado) conds.push(eq(tareas.estado, q.estado))
    if (q.prioridad) conds.push(eq(tareas.prioridad, q.prioridad))
    return db
      .select(tareaSelect)
      .from(tareas)
      .innerJoin(proyectos, eq(tareas.proyecto_id, proyectos.id))
      .leftJoin(asignado, eq(tareas.asignado_id, asignado.id))
      .leftJoin(creador, eq(tareas.creado_por_id, creador.id))
      .where(and(...conds))
      .orderBy(desc(tareas.created_at))
  },

  async getById(id: string) {
    const rows = await db
      .select(tareaSelect)
      .from(tareas)
      .innerJoin(proyectos, eq(tareas.proyecto_id, proyectos.id))
      .leftJoin(asignado, eq(tareas.asignado_id, asignado.id))
      .leftJoin(creador, eq(tareas.creado_por_id, creador.id))
      .where(eq(tareas.id, id))
      .limit(1)
    return rows[0] ?? null
  },
}
