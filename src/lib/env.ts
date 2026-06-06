// src/lib/env.ts
// Lazy, server-only env validation. Intentionally NOT validated at import and NOT wired into
// next.config.ts, so `next build` doesn't require real credentials. Call getEnv() at request time.
import 'server-only'
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (Supabase TX pooler :6543)'),
  MIGRATION_DATABASE_URL: z.string().min(1).optional(),
  // Bot's WhatsApp number (E.164, e.g. +5491155555555). Optional: the settings page falls
  // back to a disabled share button when this isn't set. n8n is the authoritative bot host;
  // this var only powers the dashboard's invite/share UX.
  BOT_WHATSAPP_NUMBER: z.string().min(1).optional(),
})

export type Env = z.infer<typeof envSchema>

let cached: Env | undefined

export function getEnv(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env)
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ')
      throw new Error(`Invalid server environment variables: ${detail}`)
    }
    cached = parsed.data
  }
  return cached
}
