// src/db/schema/tareas.ts
// Mirrors public.tareas. prioridad/estado/origen are text + DB CHECK; typed here via $type for ergonomics.
import { pgTable, uuid, text, date, timestamp } from 'drizzle-orm/pg-core'
import { proyectos } from './proyectos'
import { personas } from './personas'

export const PRIORIDADES = ['alta', 'media', 'baja'] as const
export const ESTADOS_TAREA = ['pendiente', 'en_progreso', 'hecho'] as const
export const ORIGENES = ['audio', 'texto'] as const

export type Prioridad = (typeof PRIORIDADES)[number]
export type EstadoTarea = (typeof ESTADOS_TAREA)[number]
export type Origen = (typeof ORIGENES)[number]

export const tareas = pgTable('tareas', {
  id: uuid('id').defaultRandom().primaryKey(),
  proyecto_id: uuid('proyecto_id')
    .notNull()
    .references(() => proyectos.id),
  asignado_id: uuid('asignado_id').references(() => personas.id, {
    onDelete: 'set null',
  }),
  creado_por_id: uuid('creado_por_id').references(() => personas.id, {
    onDelete: 'set null',
  }),
  descripcion: text('descripcion').notNull(),
  prioridad: text('prioridad').$type<Prioridad>().default('media'),
  estado: text('estado').$type<EstadoTarea>().default('pendiente'),
  fecha_limite: date('fecha_limite'),
  origen: text('origen').$type<Origen>().default('texto'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type Tarea = typeof tareas.$inferSelect
export type NuevaTarea = typeof tareas.$inferInsert
