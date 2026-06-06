// src/repositories/organizaciones/organizaciones.repository.ts
import 'server-only'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { organizaciones } from '@/db/schema'

export const organizacionesRepository = {
  list() {
    return db.select().from(organizaciones).orderBy(asc(organizaciones.nombre))
  },

  async getById(id: string) {
    const rows = await db
      .select()
      .from(organizaciones)
      .where(eq(organizaciones.id, id))
      .limit(1)
    return rows[0] ?? null
  },
}
