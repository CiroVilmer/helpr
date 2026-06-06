// src/db/schema/inbox.ts
// Mirrors public.inbox. Raw WhatsApp messages landed by n8n. wamid is UNIQUE (dedupe key);
// execution_id = the n8n run; wa_id = sender (matches personas.telefono).
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const inbox = pgTable('inbox', {
  id: uuid('id').defaultRandom().primaryKey(),
  wa_id: text('wa_id').notNull(),
  wamid: text('wamid').notNull().unique(),
  type: text('type'),
  body: text('body'),
  audio_id: text('audio_id'),
  processed_at: timestamp('processed_at', { withTimezone: true }),
  execution_id: text('execution_id'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type InboxMessage = typeof inbox.$inferSelect
export type NuevoInboxMessage = typeof inbox.$inferInsert
