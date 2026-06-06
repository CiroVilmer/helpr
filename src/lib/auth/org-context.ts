// Resolves the signed-in user's organization context by following
// auth.users(id) -> personas.auth_id -> personas.organizacion_id.
// Cached per-request so multiple server components / route handlers in one request share one query.
import 'server-only'

import { cache } from 'react'

import { personasService } from '@/services/personas/personas.service'
import { createClient } from '@/lib/supabase/server'
import type { RolPersona } from '@/db/schema/personas'

export type OrgContext = {
  authUserId: string
  personaId: string
  organizacionId: string
  // 'admin' or 'volunteer'. Anything unrecognised (legacy free-text from n8n) is normalised to
  // 'volunteer' — admin capabilities require an explicit promotion.
  rol: RolPersona
}

export const getCurrentOrgContext = cache(
  async (): Promise<OrgContext | null> => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    let persona = await personasService.getByAuthId(user.id)
    if (!persona) return null

    // Safety net for the bootstrap promotion. linkAuth already does this at signup, but it
    // doesn't fire when a previously-linked persona's rol gets normalised (e.g. by the
    // 2026-06-06 enum migration). Here we re-check: if this persona isn't admin and the org
    // has zero admins, promote them.
    if (persona.rol !== 'admin') {
      const promoted = await personasService.ensureOrgHasAdmin(persona)
      if (promoted) persona = promoted
    }

    return {
      authUserId: user.id,
      personaId: persona.id,
      organizacionId: persona.organizacion_id,
      rol: persona.rol === 'admin' ? 'admin' : 'volunteer',
    }
  },
)
