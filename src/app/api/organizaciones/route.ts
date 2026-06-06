// src/app/api/organizaciones/route.ts
// GET /api/organizaciones -> list all organizations (entry point for multi-org selection).
import { routeHandler } from '@/lib/handlers/route-handler'
import { organizacionesService } from '@/services/organizaciones/organizaciones.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  return routeHandler(() => organizacionesService.list())
}
