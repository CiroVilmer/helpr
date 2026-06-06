// Config pública de Supabase para Auth (browser + server).
// Va separada de `@/lib/env` (server-only, DB) para no romper esa convención de main.
// Las NEXT_PUBLIC_* las inlinea Next en build, así que sirven en cliente y server.
//
// Usamos la "publishable key" (sistema nuevo de API keys de Supabase), no la legacy anon key.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** Llamar al crear un cliente: avisa claro si faltan las vars (sin romper el build). */
export function assertSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en el entorno (.env.local)."
    );
  }
}
