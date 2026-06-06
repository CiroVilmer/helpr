// One-off migration applied 2026-06-06: normalise personas.rol to the app-level enum
// 'admin' | 'volunteer'. Anything else (including the legacy free-text values like
// 'Coordinadora', 'Voluntario', etc.) is rewritten to 'volunteer'. NULL is left as NULL —
// the app treats NULL as 'volunteer' anyway, and leaving NULL avoids touching n8n-created
// rows that may legitimately have no rol assigned yet.
//
// No CHECK constraint is added: n8n could still write free-text rol values, and we
// re-normalise at read time (org-context maps anything ≠ 'admin' to 'volunteer').
//
// Run once:  node scripts/2026-06-06_personas_rol_enum.mjs
import 'dotenv/config'
import postgres from 'postgres'

const url = process.env.MIGRATION_DATABASE_URL
if (!url) {
  console.error('MIGRATION_DATABASE_URL is not set')
  process.exit(1)
}

const sql = postgres(url, { prepare: false, max: 1 })

try {
  const before = await sql`
    SELECT COALESCE(rol, '(null)') AS rol, COUNT(*)::int AS n
      FROM public.personas
     GROUP BY rol
     ORDER BY n DESC
  `
  console.log('Before:')
  console.table(before)

  const updated = await sql`
    UPDATE public.personas
       SET rol = 'volunteer'
     WHERE rol IS NOT NULL
       AND rol NOT IN ('admin', 'volunteer')
    RETURNING id
  `
  console.log(`\nRows normalised → 'volunteer': ${updated.length}`)

  const after = await sql`
    SELECT COALESCE(rol, '(null)') AS rol, COUNT(*)::int AS n
      FROM public.personas
     GROUP BY rol
     ORDER BY n DESC
  `
  console.log('\nAfter:')
  console.table(after)
  console.log('\nOK')
} catch (err) {
  console.error('FAILED:', err)
  process.exitCode = 1
} finally {
  await sql.end()
}
