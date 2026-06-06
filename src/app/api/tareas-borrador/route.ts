// src/app/api/tareas-borrador/route.ts
// GET /api/tareas-borrador?organizacionId=&waId=&estado=  (drafts awaiting confirmation)
import { routeHandler } from '@/lib/handlers/route-handler'
import { tareasBorradorService } from '@/services/tareas-borrador/tareas-borrador.service'
import { tareasBorradorQuerySchema } from '@/types/tareas-borrador/dto/tareas-borrador.dto'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return routeHandler(() => {
    const q = tareasBorradorQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    return tareasBorradorService.list(q)
  })
}
