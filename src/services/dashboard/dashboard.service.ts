// src/services/dashboard/dashboard.service.ts
// Adapts our DB/domain data to the shapes the dashboard UI expects (src/components/dashboard/data.ts).
// Server-only: called directly from the dashboard server components (no /api round-trip; the pages are
// already behind the auth gate). Org scoping: single-org demo -> resolves to the first organizacion
// (see ARCHITECTURE org-scoping follow-up: a real user->org mapping replaces this later).
import 'server-only'
import { organizacionesService } from '@/services/organizaciones/organizaciones.service'
import { tareasService } from '@/services/tareas/tareas.service'
import { personasService } from '@/services/personas/personas.service'
import type { Task, Person, TaskStatus, DueState, Priority } from '@/components/dashboard/data'

async function resolveOrgId(): Promise<string | null> {
  const orgs = await organizacionesService.list()
  return orgs[0]?.id ?? null
}

const NO_FILTERS = {
  proyectoId: undefined,
  asignadoId: undefined,
  estado: undefined,
  prioridad: undefined,
} as const

export const dashboardService = {
  async getTasks(): Promise<Task[]> {
    const organizacionId = await resolveOrgId()
    if (!organizacionId) return []
    const rows = await tareasService.list({ organizacionId, ...NO_FILTERS })
    return rows.map(mapTarea)
  },

  async getPeople(): Promise<Person[]> {
    const organizacionId = await resolveOrgId()
    if (!organizacionId) return []
    const [personas, tareas] = await Promise.all([
      personasService.list({ organizacionId, activo: undefined }),
      tareasService.list({ organizacionId, ...NO_FILTERS }),
    ])
    const activos = new Map<string, number>()
    for (const t of tareas) {
      if (t.asignado_id && t.estado !== 'hecho') {
        activos.set(t.asignado_id, (activos.get(t.asignado_id) ?? 0) + 1)
      }
    }
    return personas.map((p) => mapPersona(p, activos.get(p.id) ?? 0))
  },
}

// ---- mappers (domain -> UI contract) ----

type TareaRow = Awaited<ReturnType<typeof tareasService.list>>[number]
type PersonaRow = Awaited<ReturnType<typeof personasService.list>>[number]

function mapTarea(t: TareaRow): Task {
  return {
    id: t.id,
    title: t.descripcion,
    status: toStatus(t.estado),
    priority: (t.prioridad ?? 'media') as Priority,
    assignee: t.asignado_id
      ? { name: t.asignado_nombre ?? 'Sin nombre', initials: initials(t.asignado_nombre ?? '') }
      : null,
    due: dueFrom(t.fecha_limite),
    source: { author: t.creado_por_nombre ?? '—', when: shortDate(t.created_at) },
  }
}

function mapPersona(p: PersonaRow, activeTasks: number): Person {
  const name = [p.nombre, p.apellido].filter(Boolean).join(' ')
  return {
    id: p.id,
    name,
    initials: initials(name),
    phone: p.telefono,
    role: p.rol ?? '',
    activeTasks,
  }
}

// pendiente -> todo, en_progreso -> doing, hecho -> done
function toStatus(estado: string | null): TaskStatus {
  if (estado === 'en_progreso') return 'doing'
  if (estado === 'hecho') return 'done'
  return 'todo'
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function dueFrom(fecha: string | null): { label: string; state: DueState } | null {
  if (!fecha) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${fecha}T00:00:00`)
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (Number.isNaN(days)) return null
  if (days < 0) return { label: 'Vencida', state: 'overdue' }
  if (days === 0) return { label: 'Vence hoy', state: 'soon' }
  if (days === 1) return { label: 'Vence mañana', state: 'soon' }
  if (days <= 3) return { label: `Vence en ${days} días`, state: 'soon' }
  return { label: `Vence ${shortDate(due)}`, state: 'ok' }
}

function shortDate(value: Date | string | null): string {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}
