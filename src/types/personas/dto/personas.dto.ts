// src/types/personas/dto/personas.dto.ts
import { z } from 'zod'

export const personasQuerySchema = z.object({
  organizacionId: z.uuid(),
  activo: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
})

export type PersonasQuery = z.infer<typeof personasQuerySchema>
