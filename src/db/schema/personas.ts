// src/db/schema/personas.ts
// Mirrors public.personas. telefono is UNIQUE and is the link used by inbox.wa_id / tareas_borrador.wa_id.
// auth_id (nullable, UNIQUE) links a persona to a Supabase auth.users row — set when a dashboard
// user signs up via an invite link `/login?personaId=<uuid>`. n8n-created personas leave it NULL.
// The FK to auth.users is enforced at DB level (Drizzle does not model the `auth` schema).
//
// rol: enforced as 'admin' | 'volunteer' at the app layer (no DB CHECK so n8n can write
// free-text without breaking; the dashboard normalises anything else to 'volunteer').
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { organizaciones } from './organizaciones'

export const ROLES_PERSONA = ['admin', 'volunteer'] as const
export type RolPersona = (typeof ROLES_PERSONA)[number]

export const personas = pgTable('personas', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizacion_id: uuid('organizacion_id')
    .notNull()
    .references(() => organizaciones.id),
  nombre: text('nombre').notNull(),
  apellido: text('apellido'),
  telefono: text('telefono').notNull().unique(),
  rol: text('rol').$type<RolPersona>(),
  activo: boolean('activo').default(true),
  auth_id: uuid('auth_id').unique(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type Persona = typeof personas.$inferSelect
export type NuevaPersona = typeof personas.$inferInsert
