// GET  /api/tareas?organizacionId=<uuid>&proyectoId=&asignadoId=&estado=&prioridad=
// POST /api/tareas  — create a task from the dashboard. Org + creator are derived from the
//                     signed-in persona (org-context); proyecto_id is the org's es_bandeja.
import { routeHandler } from '@/lib/handlers/route-handler'
import { tareasService } from '@/services/tareas/tareas.service'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { UnauthorizedException } from '@/exceptions/base/base-exceptions'
import {
  tareaCreateBodySchema,
  tareasQuerySchema,
} from '@/types/tareas/dto/tareas.dto'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return routeHandler(() => {
    const q = tareasQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    return tareasService.list(q)
  })
}

export async function POST(req: Request) {
  return routeHandler(async () => {
    const ctx = await getCurrentOrgContext()
    if (!ctx) {
      throw new UnauthorizedException(
        'No org context for current user',
        'Tenés que estar vinculada a una organización para crear tareas.',
      )
    }
    const body = tareaCreateBodySchema.parse(await req.json())
    return tareasService.create(ctx.organizacionId, ctx.personaId, body)
  })
}
