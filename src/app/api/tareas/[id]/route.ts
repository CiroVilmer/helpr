// GET   /api/tareas/:id  -> single task with project + assignee + creator names
// PATCH /api/tareas/:id  -> partial update from the dashboard (status, priority, assignee, due, description).
//                          Org membership is verified server-side from the signed-in user's persona link.
import { z } from 'zod'
import { routeHandler } from '@/lib/handlers/route-handler'
import { tareasService } from '@/services/tareas/tareas.service'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { UnauthorizedException } from '@/exceptions/base/base-exceptions'
import { tareaUpdateBodySchema } from '@/types/tareas/dto/tareas.dto'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return routeHandler(async () => {
    const { id } = await params
    return tareasService.getById(z.uuid().parse(id))
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return routeHandler(async () => {
    const ctx = await getCurrentOrgContext()
    if (!ctx) {
      throw new UnauthorizedException(
        'No org context for current user',
        'Tenés que estar vinculada a una organización para editar tareas.',
      )
    }
    const { id } = await params
    const body = tareaUpdateBodySchema.parse(await req.json())
    return tareasService.update(z.uuid().parse(id), ctx.organizacionId, body)
  })
}
