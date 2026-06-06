// src/repositories/inbox/inbox.repository.ts
// Raw WhatsApp messages (newest first). 'remitente' = sender persona matched on telefono = wa_id.
import 'server-only'
import { aliasedTable, and, desc, eq, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { inbox, personas } from '@/db/schema'
import type { InboxQuery } from '@/types/inbox/dto/inbox.dto'

const remitente = aliasedTable(personas, 'inbox_remitente')

export const inboxRepository = {
  list(q: InboxQuery) {
    const conds: SQL[] = []
    if (q.waId) conds.push(eq(inbox.wa_id, q.waId))
    if (q.organizacionId) conds.push(eq(remitente.organizacion_id, q.organizacionId))
    return db
      .select({
        id: inbox.id,
        wa_id: inbox.wa_id,
        wamid: inbox.wamid,
        type: inbox.type,
        body: inbox.body,
        audio_id: inbox.audio_id,
        processed_at: inbox.processed_at,
        execution_id: inbox.execution_id,
        created_at: inbox.created_at,
        remitente_nombre: remitente.nombre,
      })
      .from(inbox)
      .leftJoin(remitente, eq(remitente.telefono, inbox.wa_id))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(inbox.created_at))
      .limit(q.limite)
  },
}
