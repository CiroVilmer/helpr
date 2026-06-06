// GET  /api/personas?organizacionId=<uuid>&activo=true|false  — read API
// POST /api/personas  — bulk create from the dashboard admin flow.
//                       Body: { personas: [{ nombre, apellido?, telefono, rol? }] } (max 50)
//                       The organizacion is derived from the signed-in user (org-context), not the body.
import { routeHandler } from '@/lib/handlers/route-handler'
import { personasService } from '@/services/personas/personas.service'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import {
  ForbiddenException,
  UnauthorizedException,
} from '@/exceptions/base/base-exceptions'
import {
  personasCreateBodySchema,
  personasQuerySchema,
} from '@/types/personas/dto/personas.dto'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return routeHandler(() => {
    const q = personasQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    return personasService.list(q)
  })
}

export async function POST(req: Request) {
  return routeHandler(async () => {
    const ctx = await getCurrentOrgContext()
    if (!ctx) {
      throw new UnauthorizedException(
        'No org context for current user',
        'Tenés que estar vinculada a una organización para crear personas.',
      )
    }
    if (ctx.rol !== 'admin') {
      throw new ForbiddenException(
        'Only admins can create personas',
        'Solo los admins pueden invitar nuevas personas.',
      )
    }
    const body = personasCreateBodySchema.parse(await req.json())
    return personasService.onboard({
      organizacionId: ctx.organizacionId,
      personas: body.personas,
    })
  })
}
