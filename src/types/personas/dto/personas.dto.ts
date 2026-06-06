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

const personaInputSchema = z.object({
  nombre: z.string().trim().min(1),
  apellido: z.string().trim().min(1).optional(),
  telefono: z.string().trim().min(1),
  rol: z.string().trim().min(1).optional(),
})

export const personasOnboardingSchema = z.object({
  organizacionId: z.uuid(),
  personas: z.array(personaInputSchema).min(1).max(500),
})

export type PersonasOnboardingInput = z.infer<typeof personasOnboardingSchema>
export type PersonaOnboardingItem = z.infer<typeof personaInputSchema>
