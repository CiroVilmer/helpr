// src/services/personas/personas.service.ts
import 'server-only'
import { personasRepository } from '@/repositories/personas/personas.repository'
import { ValidationException } from '@/exceptions/base/base-exceptions'
import type {
  PersonasQuery,
  PersonasOnboardingInput,
} from '@/types/personas/dto/personas.dto'

export const personasService = {
  list(q: PersonasQuery) {
    return personasRepository.list(q)
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
