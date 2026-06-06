import 'server-only'
import { tareasRepository } from '@/repositories/tareas/tareas.repository'
import {
  ForbiddenException,
  NotFoundException,
  ValidationException,
} from '@/exceptions/base/base-exceptions'
import type {
  TareaCreateBody,
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

  // Creates a task in the selected project. Validates that the project and any asignado_id
  // belong to the same org. creado_por_id is the signed-in persona.
  async create(
    organizacionId: string,
    creadoPorId: string,
    body: TareaCreateBody,
  ) {
    const projectOk = await tareasRepository.projectIsInOrg(
      body.proyecto_id,
      organizacionId,
    )
    if (!projectOk) {
      throw new ValidationException(
        `Project ${body.proyecto_id} not in org ${organizacionId}`,
        'El proyecto seleccionado no pertenece a tu organización.',
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

    const created = await tareasRepository.create({
      proyecto_id: body.proyecto_id,
      creado_por_id: creadoPorId,
      descripcion: body.descripcion,
      prioridad: body.prioridad,
      estado: body.estado,
      asignado_id: body.asignado_id ?? null,
      fecha_limite: body.fecha_limite ?? null,
    })
    if (!created) {
      throw new NotFoundException(
        'Tarea creada pero no pude releerla',
        'No pude crear la tarea. Probá de nuevo.',
      )
    }
    return created
  },

  // Updates a tarea after verifying it belongs to organizacionId. Any new project or asignado
  // must also belong to the same org. Returns the updated row with names resolved.
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

    if (body.proyecto_id) {
      const ok = await tareasRepository.projectIsInOrg(
        body.proyecto_id,
        organizacionId,
      )
      if (!ok) {
        throw new ValidationException(
          `Project ${body.proyecto_id} not in org ${organizacionId}`,
          'El proyecto seleccionado no pertenece a tu organización.',
        )
      }
    }

    const updated = await tareasRepository.updateById(id, body)
    if (!updated) throw new NotFoundException(`Tarea ${id} desapareció`)
    return updated
  },
}
