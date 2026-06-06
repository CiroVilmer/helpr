// One-off migration applied 2026-06-06: enforce personas.rol at the DB level with a CHECK
// constraint. Existing rows were normalised by 2026-06-06_personas_rol_enum.mjs; this script
// re-runs that sweep defensively (idempotent) and then adds the constraint.
//
// NOTE: this constrains n8n too. If n8n writes a rol outside ('admin', 'volunteer'),
// the insert/update will fail. Coordinate with the n8n flow before/after running.
//
// Run once:  node scripts/2026-06-06_personas_rol_check.mjs
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

  // Defensive re-normalisation — should be a no-op if the enum script already ran.
  const fixed = await sql`
    UPDATE public.personas
       SET rol = 'volunteer'
     WHERE rol IS NOT NULL
       AND rol NOT IN ('admin', 'volunteer')
    RETURNING id
  `
  console.log(`Rows re-normalised → 'volunteer': ${fixed.length}`)

  // Drop-then-create makes the script idempotent.
  await sql`ALTER TABLE public.personas DROP CONSTRAINT IF EXISTS personas_rol_check`
  await sql`
    ALTER TABLE public.personas
      ADD CONSTRAINT personas_rol_check
      CHECK (rol IS NULL OR rol IN ('admin', 'volunteer'))
  `
  console.log("Constraint added: personas_rol_check")

  const constraints = await sql`
    SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
     WHERE conrelid = 'public.personas'::regclass
       AND conname = 'personas_rol_check'
  `
  console.log('\nConstraint now in place:')
  console.table(constraints)
  console.log('\nOK')
} catch (err) {
  console.error('FAILED:', err)
  process.exitCode = 1
} finally {
  await sql.end()
}
