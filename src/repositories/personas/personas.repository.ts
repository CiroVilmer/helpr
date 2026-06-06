// src/repositories/personas/personas.repository.ts
import 'server-only'
import { and, asc, eq, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { personas } from '@/db/schema'
import type { PersonasQuery, PersonaOnboardingItem } from '@/types/personas/dto/personas.dto'

export const personasRepository = {
  list(q: PersonasQuery) {
    const conds: SQL[] = [eq(personas.organizacion_id, q.organizacionId)]
    if (q.activo !== undefined) conds.push(eq(personas.activo, q.activo))
    return db
      .select()
      .from(personas)
      .where(and(...conds))
      .orderBy(asc(personas.nombre))
  },

  createMany(organizacionId: string, items: PersonaOnboardingItem[]) {
    const rows = items.map((p) => ({
      organizacion_id: organizacionId,
      nombre: p.nombre,
      apellido: p.apellido,
      telefono: p.telefono,
      rol: p.rol,
    }))
    return db.insert(personas).values(rows).returning()
  },
}
