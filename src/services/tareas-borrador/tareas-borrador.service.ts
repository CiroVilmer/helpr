// src/services/tareas-borrador/tareas-borrador.service.ts
import 'server-only'
import { tareasBorradorRepository } from '@/repositories/tareas-borrador/tareas-borrador.repository'
import type { TareasBorradorQuery } from '@/types/tareas-borrador/dto/tareas-borrador.dto'

export const tareasBorradorService = {
  list(q: TareasBorradorQuery) {
    return tareasBorradorRepository.list(q)
  },
}
