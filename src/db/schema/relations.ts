// src/db/schema/relations.ts
// Only the unambiguous relations are declared here. tareas/tareas_borrador each have TWO FKs to
// personas (asignado_id + creado_por_id); declaring those via the relational API needs matching
// relationName on both ends, so we instead resolve assignee/creator through aliased leftJoins in
// the repositories (see tareas.repository.ts). Keeps db.query.* unambiguous for the simple cases.
import { relations } from 'drizzle-orm'
import { organizaciones } from './organizaciones'
import { personas } from './personas'
import { proyectos } from './proyectos'
import { tareas } from './tareas'

export const organizacionesRelations = relations(organizaciones, ({ many }) => ({
  personas: many(personas),
  proyectos: many(proyectos),
}))

export const personasRelations = relations(personas, ({ one }) => ({
  organizacion: one(organizaciones, {
    fields: [personas.organizacion_id],
    references: [organizaciones.id],
  }),
}))

export const proyectosRelations = relations(proyectos, ({ one, many }) => ({
  organizacion: one(organizaciones, {
    fields: [proyectos.organizacion_id],
    references: [organizaciones.id],
  }),
  tareas: many(tareas),
}))

export const tareasRelations = relations(tareas, ({ one }) => ({
  proyecto: one(proyectos, {
    fields: [tareas.proyecto_id],
    references: [proyectos.id],
  }),
}))
