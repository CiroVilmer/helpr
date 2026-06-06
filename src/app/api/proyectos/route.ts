// src/app/api/proyectos/route.ts
// GET /api/proyectos?organizacionId=<uuid>&activo=true|false&esBandeja=true|false
import { routeHandler } from '@/lib/handlers/route-handler'
import { proyectosService } from '@/services/proyectos/proyectos.service'
import { proyectosQuerySchema } from '@/types/proyectos/dto/proyectos.dto'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return routeHandler(() => {
    const q = proyectosQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    return proyectosService.list(q)
  })
}
