# Helpr · Design System (implementación)

> Cómo está implementada la identidad del MANIFEST sobre el stack real
> (Next.js 16 + Tailwind v4 + shadcn/base-nova). **Fuente de verdad de marca:**
> [`docs/MANIFEST.md`](./MANIFEST.md). Este doc es el puente marca → código para
> que todo el equipo (incl. dashboard) construya consistente.

## Stack relevante

- **Tailwind v4**, config CSS-first: **no hay `tailwind.config.ts`**. Todo vive en
  `src/app/globals.css` (`@theme inline` + `:root`).
- **shadcn** estilo **`base-nova`** → componentes sobre **Base UI** (`@base-ui/react`),
  no Radix. Composición de elementos con la prop `render` (ej. `<Button render={<a/>} />`).
- **Light-only.** Se neutraliza el modo oscuro con `@custom-variant dark (&:is(.dark *))`
  y nunca se aplica la clase `.dark`. No usar utilidades `dark:` esperando que apliquen.

## Tipografía (`src/app/layout.tsx`)

| Variable CSS | Fuente (next/font) | Uso |
|---|---|---|
| `--font-display` | **Bricolage Grotesque** (700/800) | titulares, wordmark, números grandes |
| `--font-sans` | **Inter** (400/500/600/700) | UI, cuerpo, datos |

- Utilidades Tailwind: `font-display` / `font-heading` (Bricolage) y `font-sans` (Inter).
- `h1–h6` usan Bricolage por defecto (regla en `@layer base`).
- Datos tabulares: usar `tabular-nums` (MANIFEST pide `tnum`).

## Color

Los **tokens de marca crudos** (hex exactos del MANIFEST §3.1) se definen en `:root`
y se exponen como utilidades vía `@theme inline` → podés usar `bg-bosque`, `text-lima`,
`border-linea`, `bg-crema-superficie`, etc.

| Token marca | Hex | Utilidad |
|---|---|---|
| `--bosque` | `#0F3D2C` | `bg-bosque` `text-bosque` |
| `--bosque-hondo` | `#082A1E` | `bg-bosque-hondo` |
| `--lima` | `#B6E84A` | `bg-lima` `text-lima` |
| `--lima-suave` | `#D7F38C` | `bg-lima-suave` |
| `--crema-base` | `#F6F0E2` | `bg-crema-base` |
| `--crema-superficie` | `#FCF8EF` | `bg-crema-superficie` |
| `--ambar` | `#E0A33E` | `bg-ambar` |
| `--clay` | `#C8553D` | `bg-clay` |
| `--tinta` / `--tinta-suave` | `#11241A` / `#5E6B61` | `text-tinta` `text-tinta-suave` |
| `--linea` / `--linea-oscura` | `#E6E0D2` / `#1C3A2C` | `border-linea` `border-linea-oscura` |

### Mapeo a tokens semánticos shadcn (`:root`)

Usá **los tokens semánticos** en componentes (heredan la marca automáticamente):

| shadcn | → marca | Notas |
|---|---|---|
| `background` / `foreground` | crema-base / tinta | fondo de página |
| `card` / `popover` | crema-superficie / blanco | superficies |
| `primary` | bosque (texto blanco) | acción principal |
| `secondary` / `muted` | cremas cálidos / tinta-suave | superficies sutiles |
| `accent` | **lima-suave** + `#2C4A0A` | hover/superficie. **La lima brillante NO va como fondo de hover ni como texto sobre crema** (MANIFEST §3.3) |
| `destructive` | clay (texto blanco) | riesgo/borrar |
| `border` / `input` | linea | |
| `ring` | **bosque** | foco sobre fondos claros; sobre oscuro el anillo es lima |

**Regla de la lima:** solo sobre fondos oscuros, como relleno con texto oscuro, o
borde de foco. Nunca lima como texto sobre crema/blanco (contraste insuficiente).

### Estados semánticos → variantes de `Badge`

`<Badge variant="success|warning|risk">` (MANIFEST §3.2 / §9.2). Acompañar **siempre**
con ícono o texto, nunca solo color (daltonismo).

## Forma, elevación, movimiento

- **Radios** (MANIFEST §6.1): `--radius` base `0.625rem` (~10px botones/inputs). Cards
  `rounded-xl`/`rounded-2xl` (12–18px), pill en badges (`rounded-4xl`).
- **Sombras** verdes (MANIFEST §6.4): `shadow-[var(--shadow-card)]` y `shadow-[var(--shadow-float)]`.
- **Foco** siempre visible (`:focus-visible` global con ring). Nunca `outline:none` sin reemplazo.
- **Movimiento** (MANIFEST §7): entradas con `animate-in fade-in slide-in-from-bottom-*`
  (de `tw-animate-css`) + `fill-mode-both`; 150ms micro, 200–250ms paneles. `prefers-reduced-motion`
  respetado globalmente en `globals.css`.

## Componentes propios

- `components/brand/helpr-mark.tsx` — **`<HelprMark size withWordmark variant>`**. Monograma
  "H" lima sobre bosque en cuadrado redondeado (~28%) = avatar de WhatsApp (MANIFEST §5).
- `components/brand/suggestion-card.tsx` — **`<SuggestionCard>`**, el sello (MANIFEST §9.1):
  qué detectó + medidor de confianza + fuente citada + Confirmar/Editar/Descartar. Reusable
  en landing y dashboard.
- `components/marketing/` — `Section`/`Container`/`Eyebrow`, `Navbar`, `Footer`, `FeatureCard`,
  `StepCard`, `PositioningBlock`. Específicos de la landing.
- `components/ui/` — set shadcn re-tematizado (button, card, input, label, textarea, badge,
  avatar, separator, tabs, sheet, dialog, dropdown-menu, tooltip, sonner, skeleton, accordion).

## Voz (MANIFEST §8)

Voseo rioplatense, Helpr en primera persona, breve, **sin emojis en la web**, sin lenguaje
de vigilancia. Reusar el microcopy del MANIFEST §8.2.

## Rutas

- `/` → landing pública (`src/app/(marketing)/`).
- `/dashboard/*` → app (stubs hoy, `src/app/(dashboard)/dashboard/`). **Deviación de
  ARCHITECTURE §5**: las páginas del dashboard se movieron bajo `/dashboard` para que la
  landing pública sea la raíz `/`.

## Entorno (gotcha)

`pnpm` (11.x) requiere **Node ≥ 22** (`node:sqlite`). Usar `nvm use 22` antes de
`pnpm install` / `pnpm dev` / `pnpm build`.
