// src/services/personas/personas.service.ts
import 'server-only'
import { personasRepository } from '@/repositories/personas/personas.repository'
import {
  NotFoundException,
  ValidationException,
} from '@/exceptions/base/base-exceptions'
import type {
  PersonasQuery,
  PersonasOnboardingInput,
} from '@/types/personas/dto/personas.dto'

export const personasService = {
  list(q: PersonasQuery) {
    return personasRepository.list(q)
  },

  getByAuthId(authId: string) {
    return personasRepository.findByAuthId(authId)
  },

  // If the persona's org has no admin yet, promote this persona. Used as a bootstrap path
  // both at signup-link time and on every dashboard request via getCurrentOrgContext.
  async ensureOrgHasAdmin(persona: {
    id: string
    organizacion_id: string
    rol: string | null
  }) {
    if (persona.rol === 'admin') return null
    const orgHasAdmin = await personasRepository.hasAdmin(persona.organizacion_id)
    if (orgHasAdmin) return null
    return personasRepository.setRol(persona.id, 'admin')
  },

  async linkAuth(personaId: string, authId: string) {
    const persona = await personasRepository.findById(personaId)
    if (!persona) {
      throw new NotFoundException(
        `Persona ${personaId} no existe`,
        'El link de invitación no es válido.',
      )
    }
    if (persona.auth_id && persona.auth_id !== authId) {
      throw new ValidationException(
        `Persona ${personaId} already linked to a different auth user`,
        'Este link ya fue usado por otra cuenta.',
      )
    }
    let linked = persona
    if (persona.auth_id !== authId) {
      const updated = await personasRepository.linkAuth(personaId, authId)
      if (updated) linked = updated
    }
    // Bootstrap: la primera persona que reclama un link en una org sin admin queda como admin.
    if (linked.rol !== 'admin') {
      const orgHasAdmin = await personasRepository.hasAdmin(linked.organizacion_id)
      if (!orgHasAdmin) {
        const promoted = await personasRepository.setRol(linked.id, 'admin')
        if (promoted) linked = promoted
      }
    }
    return linked
  },

  async onboard(input: PersonasOnboardingInput) {
    const seen = new Set<string>()
    for (const p of input.personas) {
      if (seen.has(p.telefono)) {
        throw new ValidationException(
          `Duplicate telefono in batch: ${p.telefono}`,
          'Hay teléfonos repetidos en la lista.',
        )
      }
      seen.add(p.telefono)
    }
    try {
      return await personasRepository.createMany(input.organizacionId, input.personas)
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code?: string }).code
        if (code === '23505') {
          throw new ValidationException(
            'telefono already exists',
            'Uno o más teléfonos ya están registrados.',
          )
        }
        if (code === '23503') {
          throw new ValidationException(
            'organizacionId not found',
            'La organización no existe.',
          )
        }
      }
      throw err
    }
  },
}
