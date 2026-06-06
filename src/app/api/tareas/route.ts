// src/app/api/tareas/route.ts
// GET /api/tareas?organizacionId=<uuid>&proyectoId=&asignadoId=&estado=&prioridad=
import { routeHandler } from '@/lib/handlers/route-handler'
import { tareasService } from '@/services/tareas/tareas.service'
import { tareasQuerySchema } from '@/types/tareas/dto/tareas.dto'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return routeHandler(() => {
    const q = tareasQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    return tareasService.list(q)
  })
}
