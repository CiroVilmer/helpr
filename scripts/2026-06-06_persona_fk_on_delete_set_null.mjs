// One-off migration applied 2026-06-06: switch the persona FK columns to ON DELETE SET NULL
// so that deleting a persona leaves the historical tareas / tareas_borrador in place with
// the asignado_id / creado_por_id nulled instead of blocking the delete.
//
// Scope: tareas (asignado_id, creado_por_id) and tareas_borrador (asignado_id, creado_por_id).
// Idempotent: drops the existing FK by introspected name, then re-creates with SET NULL.
//
// Run once:  node scripts/2026-06-06_persona_fk_on_delete_set_null.mjs
import 'dotenv/config'
import postgres from 'postgres'

const url = process.env.MIGRATION_DATABASE_URL
if (!url) {
  console.error('MIGRATION_DATABASE_URL is not set')
  process.exit(1)
}

const sql = postgres(url, { prepare: false, max: 1 })

const targets = [
  { table: 'tareas', column: 'asignado_id', newName: 'tareas_asignado_id_fkey' },
  { table: 'tareas', column: 'creado_por_id', newName: 'tareas_creado_por_id_fkey' },
  { table: 'tareas_borrador', column: 'asignado_id', newName: 'tareas_borrador_asignado_id_fkey' },
  { table: 'tareas_borrador', column: 'creado_por_id', newName: 'tareas_borrador_creado_por_id_fkey' },
]

async function findFkName(table, column) {
  const rows = await sql`
    SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class cls ON cls.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
     WHERE ns.nspname = 'public'
       AND cls.relname = ${table}
       AND con.contype = 'f'
       AND att.attname = ${column}
  `
  return rows.map((r) => r.conname)
}

try {
  for (const t of targets) {
    const existing = await findFkName(t.table, t.column)
    for (const name of existing) {
      console.log(`> drop ${t.table}.${t.column} FK: ${name}`)
      await sql.unsafe(`ALTER TABLE public.${t.table} DROP CONSTRAINT "${name}"`)
    }
    console.log(`> add ${t.table}.${t.column} FK (SET NULL): ${t.newName}`)
    await sql.unsafe(`
      ALTER TABLE public.${t.table}
        ADD CONSTRAINT "${t.newName}"
        FOREIGN KEY (${t.column}) REFERENCES public.personas(id) ON DELETE SET NULL
    `)
  }

  const after = await sql`
    SELECT con.conname,
           cls.relname AS table_name,
           pg_get_constraintdef(con.oid) AS def
      FROM pg_constraint con
      JOIN pg_class cls ON cls.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
     WHERE ns.nspname = 'public'
       AND cls.relname IN ('tareas', 'tareas_borrador')
       AND con.contype = 'f'
       AND con.conname LIKE ANY (ARRAY['%asignado_id_fkey', '%creado_por_id_fkey'])
     ORDER BY cls.relname, con.conname
  `
  console.log('\nFKs now in place:')
  console.table(after)
  console.log('\nOK')
} catch (err) {
  console.error('FAILED:', err)
  process.exitCode = 1
} finally {
  await sql.end()
}
