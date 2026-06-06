// src/db/schema/proyectos.ts
// Mirrors public.proyectos. es_bandeja flags the default "inbox/tray" project for an org.
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { organizaciones } from './organizaciones'

export const proyectos = pgTable('proyectos', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizacion_id: uuid('organizacion_id')
    .notNull()
    .references(() => organizaciones.id),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  es_bandeja: boolean('es_bandeja').default(false),
  activo: boolean('activo').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type Proyecto = typeof proyectos.$inferSelect
export type NuevoProyecto = typeof proyectos.$inferInsert
