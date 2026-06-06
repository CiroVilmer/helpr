// src/app/api/personas/route.ts
// GET /api/personas?organizacionId=<uuid>&activo=true|false
import { routeHandler } from '@/lib/handlers/route-handler'
import { personasService } from '@/services/personas/personas.service'
import { personasQuerySchema } from '@/types/personas/dto/personas.dto'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return routeHandler(() => {
    const q = personasQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    return personasService.list(q)
  })
}
