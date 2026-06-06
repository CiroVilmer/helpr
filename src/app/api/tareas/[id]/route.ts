// src/app/api/tareas/[id]/route.ts
// GET /api/tareas/:id -> single task with project + assignee + creator names.
import { z } from 'zod'
import { routeHandler } from '@/lib/handlers/route-handler'
import { tareasService } from '@/services/tareas/tareas.service'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return routeHandler(async () => {
    const { id } = await params
    return tareasService.getById(z.uuid().parse(id))
  })
}
