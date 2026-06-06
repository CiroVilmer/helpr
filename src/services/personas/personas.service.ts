// src/services/personas/personas.service.ts
import 'server-only'
import { personasRepository } from '@/repositories/personas/personas.repository'
import type { PersonasQuery } from '@/types/personas/dto/personas.dto'

export const personasService = {
  list(q: PersonasQuery) {
    return personasRepository.list(q)
  },
}
