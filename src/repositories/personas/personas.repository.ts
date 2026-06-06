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

  async findById(id: string) {
    const rows = await db.select().from(personas).where(eq(personas.id, id)).limit(1)
    return rows[0] ?? null
  },

  async findByAuthId(authId: string) {
    const rows = await db
      .select()
      .from(personas)
      .where(eq(personas.auth_id, authId))
      .limit(1)
    return rows[0] ?? null
  },

  async linkAuth(personaId: string, authId: string) {
    const rows = await db
      .update(personas)
      .set({ auth_id: authId })
      .where(eq(personas.id, personaId))
      .returning()
    return rows[0] ?? null
  },

  async hasAdmin(organizacionId: string): Promise<boolean> {
    const rows = await db
      .select({ id: personas.id })
      .from(personas)
      .where(
        and(
          eq(personas.organizacion_id, organizacionId),
          eq(personas.rol, 'admin'),
        ),
      )
      .limit(1)
    return rows.length > 0
  },

  async setRol(personaId: string, rol: 'admin' | 'volunteer') {
    const rows = await db
      .update(personas)
      .set({ rol })
      .where(eq(personas.id, personaId))
      .returning()
    return rows[0] ?? null
  },
}
