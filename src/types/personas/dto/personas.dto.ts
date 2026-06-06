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
  rol: z.enum(['admin', 'volunteer']).default('volunteer'),
})

// Body for POST /api/personas (admin bulk-create). The organizacion comes from the signed-in
// user's persona link (see lib/auth/org-context.ts) — never trust an org id from the body.
export const personasCreateBodySchema = z.object({
  personas: z.array(personaInputSchema).min(1).max(50),
})

export type PersonasCreateBody = z.infer<typeof personasCreateBodySchema>

export const personasOnboardingSchema = z.object({
  organizacionId: z.uuid(),
  personas: z.array(personaInputSchema).min(1).max(500),
})

export type PersonasOnboardingInput = z.infer<typeof personasOnboardingSchema>
export type PersonaOnboardingItem = z.infer<typeof personaInputSchema>
