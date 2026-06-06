// src/app/api/organizaciones/[id]/route.ts
// GET /api/organizaciones/:id -> { organizacion, proyectos, tareas } for the dashboard initial fetch.
import { z } from 'zod'
import { routeHandler } from '@/lib/handlers/route-handler'
import { organizacionesService } from '@/services/organizaciones/organizaciones.service'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return routeHandler(async () => {
    const { id } = await params
    return organizacionesService.getDashboard(z.uuid().parse(id))
  })
}
