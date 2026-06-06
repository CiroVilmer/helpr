// src/services/inbox/inbox.service.ts
import 'server-only'
import { inboxRepository } from '@/repositories/inbox/inbox.repository'
import type { InboxQuery } from '@/types/inbox/dto/inbox.dto'

export const inboxService = {
  list(q: InboxQuery) {
    return inboxRepository.list(q)
  },
}
