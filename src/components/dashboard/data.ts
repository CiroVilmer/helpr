// Datos de ejemplo (placeholder). El backend real lo provee otro equipo;
// acá solo modelamos lo que la UI necesita para las vistas.

export type TaskStatus = "todo" | "doing" | "done";
export type DueState = "ok" | "soon" | "overdue";
export type Priority = "alta" | "media" | "baja";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: { name: string; initials: string } | null;
  due: { label: string; state: DueState } | null;
  source: { author: string; when: string };
  priority: Priority;
};

export type Person = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  role: string;
  activeTasks: number;
};

export const TASKS: Task[] = [
  {
    id: "t1",
    title: "Coordinar la entrega de donaciones del viernes",
    status: "doing",
    assignee: { name: "Lu Méndez", initials: "LM" },
    due: { label: "Vence vie", state: "soon" },
    source: { author: "Lu", when: "mar 14:32" },
    priority: "alta",
  },
  {
    id: "t2",
    title: "Confirmar cantidad de cajas con el depósito",
    status: "todo",
    assignee: { name: "Nico Ruiz", initials: "NR" },
    due: { label: "Vence jue", state: "soon" },
    source: { author: "Nico", when: "mar 14:35" },
    priority: "media",
  },
  {
    id: "t3",
    title: "Conseguir voluntarios para el evento del sábado",
    status: "todo",
    assignee: null,
    due: { label: "Vencida", state: "overdue" },
    source: { author: "Caro", when: "lun 09:10" },
    priority: "alta",
  },
  {
    id: "t4",
    title: "Armar el flyer de la campaña de invierno",
    status: "todo",
    assignee: { name: "Sofi Díaz", initials: "SD" },
    due: null,
    source: { author: "Sofi", when: "lun 18:02" },
    priority: "baja",
  },
  {
    id: "t5",
    title: "Llamar a la imprenta por el presupuesto",
    status: "doing",
    assignee: { name: "Caro Pérez", initials: "CP" },
    due: { label: "Vence hoy", state: "soon" },
    source: { author: "Caro", when: "mar 11:20" },
    priority: "media",
  },
  {
    id: "t6",
    title: "Actualizar la planilla de inscriptos",
    status: "done",
    assignee: { name: "Nico Ruiz", initials: "NR" },
    due: { label: "Lista", state: "ok" },
    source: { author: "Nico", when: "dom 20:45" },
    priority: "baja",
  },
  {
    id: "t7",
    title: "Reservar el salón comunitario",
    status: "done",
    assignee: { name: "Lu Méndez", initials: "LM" },
    due: { label: "Lista", state: "ok" },
    source: { author: "Lu", when: "vie 16:00" },
    priority: "media",
  },
];

export const PEOPLE: Person[] = [
  {
    id: "p1",
    name: "Lu Méndez",
    initials: "LM",
    phone: "+54 9 11 5512-3344",
    role: "Coordinadora",
    activeTasks: 4,
  },
  {
    id: "p2",
    name: "Nico Ruiz",
    initials: "NR",
    phone: "+54 9 11 4421-8890",
    role: "Logística",
    activeTasks: 2,
  },
  {
    id: "p3",
    name: "Caro Pérez",
    initials: "CP",
    phone: "+54 9 351 622-1075",
    role: "Comunicación",
    activeTasks: 3,
  },
  {
    id: "p4",
    name: "Sofi Díaz",
    initials: "SD",
    phone: "+54 9 11 6677-2200",
    role: "Diseño",
    activeTasks: 1,
  },
  {
    id: "p5",
    name: "Tomás Vega",
    initials: "TV",
    phone: "+54 9 261 488-9012",
    role: "Voluntario",
    activeTasks: 0,
  },
];
