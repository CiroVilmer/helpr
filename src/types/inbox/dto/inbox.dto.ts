// src/types/inbox/dto/inbox.dto.ts
// 'limite' caps the activity feed (default 100, max 500) so the endpoint never dumps the whole table.
import { z } from 'zod'

export const inboxQuerySchema = z.object({
  organizacionId: z.uuid().optional(),
  waId: z.string().min(1).optional(),
  limite: z.coerce.number().int().positive().max(500).default(100),
})

export type InboxQuery = z.infer<typeof inboxQuerySchema>
