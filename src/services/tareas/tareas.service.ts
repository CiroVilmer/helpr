// src/services/tareas/tareas.service.ts
import 'server-only'
import { tareasRepository } from '@/repositories/tareas/tareas.repository'
import { NotFoundException } from '@/exceptions/base/base-exceptions'
import type { TareasQuery } from '@/types/tareas/dto/tareas.dto'

export const tareasService = {
  list(q: TareasQuery) {
    return tareasRepository.list(q)
  },

  async getById(id: string) {
    const tarea = await tareasRepository.getById(id)
    if (!tarea) throw new NotFoundException(`Tarea ${id} no existe`)
    return tarea
  },
}
