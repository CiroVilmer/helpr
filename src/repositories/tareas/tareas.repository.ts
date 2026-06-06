// src/repositories/tareas/tareas.repository.ts
// Org-scoping joins proyectos (every tarea has a NOT NULL proyecto_id). asignado/creado_por both
// FK personas, so they use aliased leftJoins (avoids the relational "multiple relations" issue).
import 'server-only'
import { aliasedTable, and, desc, eq, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { tareas, proyectos, personas } from '@/db/schema'
import type {
  TareasQuery,
  TareaUpdateBody,
} from '@/types/tareas/dto/tareas.dto'

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

  // Returns organizacion_id of the tarea's project, or null if the tarea doesn't exist.
  // Used by the service layer to enforce tenant isolation before applying writes.
  async getOrganizacionId(id: string): Promise<string | null> {
    const rows = await db
      .select({ organizacion_id: proyectos.organizacion_id })
      .from(tareas)
      .innerJoin(proyectos, eq(tareas.proyecto_id, proyectos.id))
      .where(eq(tareas.id, id))
      .limit(1)
    return rows[0]?.organizacion_id ?? null
  },

  // Confirms persona belongs to the given org (used to validate asignado_id on PATCH).
  async personaIsInOrg(personaId: string, organizacionId: string): Promise<boolean> {
    const rows = await db
      .select({ id: personas.id })
      .from(personas)
      .where(
        and(
          eq(personas.id, personaId),
          eq(personas.organizacion_id, organizacionId),
        ),
      )
      .limit(1)
    return rows.length > 0
  },

  async updateById(id: string, body: TareaUpdateBody) {
    // Drizzle types $type narrowly; we set only fields explicitly present in the body.
    const patch: Record<string, unknown> = {}
    if (body.descripcion !== undefined) patch.descripcion = body.descripcion
    if (body.prioridad !== undefined) patch.prioridad = body.prioridad
    if (body.estado !== undefined) patch.estado = body.estado
    if (body.asignado_id !== undefined) patch.asignado_id = body.asignado_id
    if (body.fecha_limite !== undefined) patch.fecha_limite = body.fecha_limite

    await db.update(tareas).set(patch).where(eq(tareas.id, id))
    // Re-read with joins so the caller gets the full enriched row (names included).
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
