// src/services/proyectos/proyectos.service.ts
import 'server-only'
import { proyectosRepository } from '@/repositories/proyectos/proyectos.repository'
import type { ProyectosQuery } from '@/types/proyectos/dto/proyectos.dto'

export const proyectosService = {
  list(q: ProyectosQuery) {
    return proyectosRepository.list(q)
  },
}
