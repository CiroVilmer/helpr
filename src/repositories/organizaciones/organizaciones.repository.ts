// src/repositories/organizaciones/organizaciones.repository.ts
import 'server-only'
import { asc } from 'drizzle-orm'
import { db } from '@/db'
import { organizaciones } from '@/db/schema'

export const organizacionesRepository = {
  list() {
    return db.select().from(organizaciones).orderBy(asc(organizaciones.nombre))
  },
}
