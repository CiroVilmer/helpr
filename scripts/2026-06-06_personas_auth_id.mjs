// One-off migration applied 2026-06-06: add personas.auth_id (nullable, UNIQUE) to link a persona
// to a Supabase auth.users row when a dashboard user signs up via /login?personaId=<uuid>.
// Hand-applied (not via drizzle-kit push) because the schema is shared with n8n and has no
// migration history — see ARCHITECTURE.md §8.
//
// Run once:  node scripts/2026-06-06_personas_auth_id.mjs
import 'dotenv/config'
import postgres from 'postgres'

const url = process.env.MIGRATION_DATABASE_URL
if (!url) {
  console.error('MIGRATION_DATABASE_URL is not set')
  process.exit(1)
}

const sql = postgres(url, { prepare: false, max: 1 })

const statements = [
  `ALTER TABLE public.personas
     ADD COLUMN IF NOT EXISTS auth_id uuid`,
  `ALTER TABLE public.personas
     DROP CONSTRAINT IF EXISTS personas_auth_id_unique`,
  `ALTER TABLE public.personas
     ADD CONSTRAINT personas_auth_id_unique UNIQUE (auth_id)`,
  `ALTER TABLE public.personas
     DROP CONSTRAINT IF EXISTS personas_auth_id_fkey`,
  `ALTER TABLE public.personas
     ADD CONSTRAINT personas_auth_id_fkey
       FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE SET NULL`,
]

try {
  for (const stmt of statements) {
    console.log('>', stmt.replace(/\s+/g, ' ').trim())
    await sql.unsafe(stmt)
  }
  const cols = await sql`
    SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'personas'
     ORDER BY ordinal_position
  `
  console.log('\npersonas columns now:')
  console.table(cols)
  console.log('\nOK')
} catch (err) {
  console.error('FAILED:', err)
  process.exitCode = 1
} finally {
  await sql.end()
}
