// View-model for the dashboard kanban / edit modal. Stays close to the DB shape (Spanish field
// names, DB-native estados) so the UI doesn't carry a parallel translation layer. Derived bits
// (initials, due label/state) are computed in helpers below.
import type {
  EstadoTarea,
  Prioridad,
} from '@/db/schema/tareas'

export const ESTADO_LABELS: Record<EstadoTarea, string> = {
  pendiente: 'Por hacer',
  en_progreso: 'Haciendo',
  hecho: 'Listo',
}

export const ESTADO_ORDER: EstadoTarea[] = ['pendiente', 'en_progreso', 'hecho']

export type DueState = 'ok' | 'soon' | 'overdue'

export type TaskView = {
  id: string
  descripcion: string
  prioridad: Prioridad
  estado: EstadoTarea
  fecha_limite: string | null
  asignado: { id: string; nombre: string; initials: string } | null
  proyecto_nombre: string
}

export type PersonaOption = {
  id: string
  nombre: string
  initials: string
}

export type DbTareaRow = {
  id: string
  descripcion: string
  prioridad: Prioridad | null
  estado: EstadoTarea | null
  fecha_limite: string | null
  proyecto_id: string
  proyecto_nombre: string
  asignado_id: string | null
  asignado_nombre: string | null
  creado_por_id: string | null
  creado_por_nombre: string | null
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function toTaskView(row: DbTareaRow): TaskView {
  return {
    id: row.id,
    descripcion: row.descripcion,
    prioridad: row.prioridad ?? 'media',
    estado: row.estado ?? 'pendiente',
    fecha_limite: row.fecha_limite,
    asignado:
      row.asignado_id && row.asignado_nombre
        ? {
            id: row.asignado_id,
            nombre: row.asignado_nombre,
            initials: initialsOf(row.asignado_nombre),
          }
        : null,
    proyecto_nombre: row.proyecto_nombre,
  }
}

// Returns null when there's no due date. Otherwise produces a short Spanish label
// ("Vencida" / "Vence hoy" / "Vence en N días" / "Lista") and a tone for the badge.
export function dueBadge(
  fechaLimite: string | null,
  estado: EstadoTarea,
  today = new Date()
): { label: string; state: DueState } | null {
  if (estado === 'hecho') return { label: 'Lista', state: 'ok' }
  if (!fechaLimite) return null

  const due = new Date(fechaLimite + 'T00:00:00')
  const ref = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.round((due.getTime() - ref.getTime()) / 86_400_000)

  if (days < 0) return { label: 'Vencida', state: 'overdue' }
  if (days === 0) return { label: 'Vence hoy', state: 'soon' }
  if (days === 1) return { label: 'Vence mañana', state: 'soon' }
  if (days <= 3) return { label: `Vence en ${days} días`, state: 'soon' }
  return { label: `Vence en ${humanizeDays(days)}`, state: 'ok' }
}

// Acorta una cantidad de días a la unidad más grande posible (días → semanas → meses → años).
function humanizeDays(days: number): string {
  if (days < 14) return plural(days, 'día', 'días')
  if (days < 30) return plural(Math.round(days / 7), 'semana', 'semanas')
  if (days < 365) return plural(Math.round(days / 30), 'mes', 'meses')
  return plural(Math.round(days / 365), 'año', 'años')
}

function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}
