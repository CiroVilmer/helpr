// src/db/schema/personas.ts
// Mirrors public.personas. telefono is UNIQUE and is the link used by inbox.wa_id / tareas_borrador.wa_id.
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { organizaciones } from './organizaciones'

export const personas = pgTable('personas', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizacion_id: uuid('organizacion_id')
    .notNull()
    .references(() => organizaciones.id),
  nombre: text('nombre').notNull(),
  telefono: text('telefono').notNull().unique(),
  rol: text('rol'),
  activo: boolean('activo').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type Persona = typeof personas.$inferSelect
export type NuevaPersona = typeof personas.$inferInsert
