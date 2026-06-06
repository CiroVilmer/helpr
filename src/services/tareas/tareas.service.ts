import 'server-only'
import { tareasRepository } from '@/repositories/tareas/tareas.repository'
import {
  ForbiddenException,
  NotFoundException,
  ValidationException,
} from '@/exceptions/base/base-exceptions'
import type {
  TareaUpdateBody,
  TareasQuery,
} from '@/types/tareas/dto/tareas.dto'

export const tareasService = {
  list(q: TareasQuery) {
    return tareasRepository.list(q)
  },

  async getById(id: string) {
    const tarea = await tareasRepository.getById(id)
    if (!tarea) throw new NotFoundException(`Tarea ${id} no existe`)
    return tarea
  },

  // Updates a tarea after verifying it belongs to organizacionId (and that any new asignado
  // also belongs to the same org). Returns the updated row with names resolved.
  async update(id: string, organizacionId: string, body: TareaUpdateBody) {
    const taskOrg = await tareasRepository.getOrganizacionId(id)
    if (!taskOrg) throw new NotFoundException(`Tarea ${id} no existe`)
    if (taskOrg !== organizacionId) {
      throw new ForbiddenException(
        `Tarea ${id} does not belong to org ${organizacionId}`,
        'Esta tarea no es de tu organización.',
      )
    }

    if (body.asignado_id) {
      const ok = await tareasRepository.personaIsInOrg(
        body.asignado_id,
        organizacionId,
      )
      if (!ok) {
        throw new ValidationException(
          `Asignado ${body.asignado_id} not in org ${organizacionId}`,
          'La persona asignada no pertenece a tu organización.',
        )
      }
    }

    const updated = await tareasRepository.updateById(id, body)
    if (!updated) throw new NotFoundException(`Tarea ${id} desapareció`)
    return updated
  },
}
