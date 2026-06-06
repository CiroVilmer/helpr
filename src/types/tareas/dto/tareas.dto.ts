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

// PATCH /api/tareas/[id] — partial update from the dashboard. At least one field required.
// asignado_id: uuid -> set, null -> clear, omitted -> no change.
// fecha_limite: 'YYYY-MM-DD' -> set, null -> clear, omitted -> no change.
export const tareaUpdateBodySchema = z
  .object({
    descripcion: z.string().trim().min(1).optional(),
    prioridad: z.enum(['alta', 'media', 'baja']).optional(),
    estado: z.enum(['pendiente', 'en_progreso', 'hecho']).optional(),
    asignado_id: z.uuid().nullable().optional(),
    fecha_limite: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usá formato YYYY-MM-DD.')
      .nullable()
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Mandá al menos un campo a actualizar.',
  })

export type TareaUpdateBody = z.infer<typeof tareaUpdateBodySchema>

// POST /api/tareas — create a task from the dashboard. The proyecto_id is resolved server-side
// (the org's `es_bandeja` project) and creado_por_id is set from the signed-in persona.
// origen is hard-coded to 'texto' (dashboard-originated tasks aren't audio).
export const tareaCreateBodySchema = z.object({
  descripcion: z.string().trim().min(1, 'Falta la descripción.'),
  prioridad: z.enum(['alta', 'media', 'baja']).default('media'),
  estado: z.enum(['pendiente', 'en_progreso', 'hecho']).default('pendiente'),
  asignado_id: z.uuid().nullable().optional(),
  fecha_limite: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usá formato YYYY-MM-DD.')
    .nullable()
    .optional(),
})

export type TareaCreateBody = z.infer<typeof tareaCreateBodySchema>
