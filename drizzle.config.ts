import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema',
  out: './drizzle',
  dialect: 'postgresql',
  // SESSION pooler (5432) for migrations - NOT the 6543 tx pooler, NOT the direct (IPv6) URL
  dbCredentials: { url: process.env.MIGRATION_DATABASE_URL! },
})
