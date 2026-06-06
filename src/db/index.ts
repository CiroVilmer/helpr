// src/db/index.ts
// Drizzle client singleton. Runtime goes through the Supabase TRANSACTION pooler (6543) with
// prepare:false + max:1 (see ARCHITECTURE.md §13). The client is lazy (postgres-js only connects
// on first query), so `next build` stays green even without DATABASE_URL set.
import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const g = globalThis as unknown as { _pgClient?: ReturnType<typeof postgres> }

export const client =
  g._pgClient ?? postgres(process.env.DATABASE_URL ?? '', { prepare: false, max: 1 })

if (process.env.NODE_ENV !== 'production') g._pgClient = client

export const db = drizzle(client, { schema })
