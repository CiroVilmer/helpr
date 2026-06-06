// src/types/tareas/dto/tareas.dto.ts
import { z } from 'zod'

export const tareasQuerySchema = z.object({
  organizacionId: z.uuid(),
  proyectoId: z.uuid().optional(),
  asignadoId: z.uuid().optional(),
  estado: z.enum(['pendiente', 'en_progreso', 'hecho']).optional(),
  prioridad: z.enum(['alta', 'media', 'baja']).optional(),
})

export type TareasQuery = z.infer<typeof tareasQuerySchema>
