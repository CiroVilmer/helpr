// src/types/proyectos/dto/proyectos.dto.ts
import { z } from 'zod'

const optionalBool = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true'))

export const proyectosQuerySchema = z.object({
  organizacionId: z.uuid(),
  activo: optionalBool,
  esBandeja: optionalBool,
})

export type ProyectosQuery = z.infer<typeof proyectosQuerySchema>
