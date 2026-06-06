// src/app/api/inbox/route.ts
// GET /api/inbox?organizacionId=&waId=&limite=  (raw WhatsApp activity feed, newest first)
import { routeHandler } from '@/lib/handlers/route-handler'
import { inboxService } from '@/services/inbox/inbox.service'
import { inboxQuerySchema } from '@/types/inbox/dto/inbox.dto'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return routeHandler(() => {
    const q = inboxQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    return inboxService.list(q)
  })
}
