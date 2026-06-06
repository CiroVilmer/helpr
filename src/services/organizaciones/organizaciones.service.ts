// src/services/organizaciones/organizaciones.service.ts
import 'server-only'
import { organizacionesRepository } from '@/repositories/organizaciones/organizaciones.repository'

export const organizacionesService = {
  list() {
    return organizacionesRepository.list()
  },
}
