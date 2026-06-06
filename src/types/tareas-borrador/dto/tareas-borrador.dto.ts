// src/types/tareas-borrador/dto/tareas-borrador.dto.ts
// organizacionId is optional here (drafts have no org column; when given, we scope via the sender
// persona matched on telefono = wa_id). estado is free text (no DB CHECK on tareas_borrador).
import { z } from 'zod'

export const tareasBorradorQuerySchema = z.object({
  organizacionId: z.uuid().optional(),
  waId: z.string().min(1).optional(),
  estado: z.string().min(1).optional(),
})

export type TareasBorradorQuery = z.infer<typeof tareasBorradorQuerySchema>
