import { Pool } from 'pg'

/**
 * Direct PostgreSQL pool for tables affected by the PostgREST schema cache bug.
 * Use this when supabase.from('table') returns PGRST205.
 *
 * Connection: postgresql://postgres:postgres@127.0.0.1:54322/postgres
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  max: 5,
})

export default pool
