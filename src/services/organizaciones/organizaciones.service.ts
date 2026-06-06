// src/services/organizaciones/organizaciones.service.ts
import 'server-only'
import { organizacionesRepository } from '@/repositories/organizaciones/organizaciones.repository'
import { proyectosRepository } from '@/repositories/proyectos/proyectos.repository'
import { tareasRepository } from '@/repositories/tareas/tareas.repository'
import { NotFoundException } from '@/exceptions/base/base-exceptions'

export const organizacionesService = {
  list() {
    return organizacionesRepository.list()
  },

  async getDashboard(id: string) {
    const organizacion = await organizacionesRepository.getById(id)
    if (!organizacion) throw new NotFoundException(`Organizacion ${id} no existe`)
    const [proyectos, tareas] = await Promise.all([
      proyectosRepository.list({ organizacionId: id, activo: undefined, esBandeja: undefined }),
      tareasRepository.list({
        organizacionId: id,
        proyectoId: undefined,
        asignadoId: undefined,
        estado: undefined,
        prioridad: undefined,
      }),
    ])
    return { organizacion, proyectos, tareas }
  },
}
