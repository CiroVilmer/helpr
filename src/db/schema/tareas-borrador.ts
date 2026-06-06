// src/db/schema/tareas-borrador.ts
// Mirrors public.tareas_borrador. Staging area for tasks awaiting WhatsApp confirmation
// (estado defaults to 'esperando'). No proyecto_id until promoted to a real tarea.
// No DB CHECKs on prioridad/estado/origen here, so they stay plain text.
import { pgTable, uuid, text, date, timestamp } from 'drizzle-orm/pg-core'
import { personas } from './personas'

export const tareas_borrador = pgTable('tareas_borrador', {
  id: uuid('id').defaultRandom().primaryKey(),
  wa_id: text('wa_id').notNull(),
  descripcion: text('descripcion').notNull(),
  prioridad: text('prioridad').default('media'),
  fecha_limite: date('fecha_limite'),
  asignado_id: uuid('asignado_id').references(() => personas.id, {
    onDelete: 'set null',
  }),
  creado_por_id: uuid('creado_por_id').references(() => personas.id, {
    onDelete: 'set null',
  }),
  origen: text('origen').default('audio'),
  estado: text('estado').default('esperando'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type TareaBorrador = typeof tareas_borrador.$inferSelect
export type NuevaTareaBorrador = typeof tareas_borrador.$inferInsert
