// src/db/schema/organizaciones.ts
// Mirrors public.organizaciones (see ARCHITECTURE.md / provided DDL). snake_case keys = DB columns 1:1.
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const organizaciones = pgTable('organizaciones', {
  id: uuid('id').defaultRandom().primaryKey(),
  nombre: text('nombre').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type Organizacion = typeof organizaciones.$inferSelect
export type NuevaOrganizacion = typeof organizaciones.$inferInsert
