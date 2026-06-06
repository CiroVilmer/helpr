// src/repositories/proyectos/proyectos.repository.ts
import 'server-only'
import { and, asc, eq, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { proyectos } from '@/db/schema'
import type { ProyectosQuery } from '@/types/proyectos/dto/proyectos.dto'

export const proyectosRepository = {
  list(q: ProyectosQuery) {
    const conds: SQL[] = [eq(proyectos.organizacion_id, q.organizacionId)]
    if (q.activo !== undefined) conds.push(eq(proyectos.activo, q.activo))
    if (q.esBandeja !== undefined) conds.push(eq(proyectos.es_bandeja, q.esBandeja))
    return db
      .select()
      .from(proyectos)
      .where(and(...conds))
      .orderBy(asc(proyectos.nombre))
  },
}
