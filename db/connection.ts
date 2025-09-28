import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'
import path from 'path'

let db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDatabase() {
  if (!db) {
    const isTurso = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
    
    if (isTurso) {
      // Turso configuration - would need @libsql/client package
      console.log('🔄 Turso configuration detected but not implemented yet')
      console.log('📝 Will fall back to local SQLite for now')
    }
    
    // Local SQLite configuration
    const dbPath = process.env.DATABASE_URL || './data.db'
    const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath)
    
    console.log(`📁 Using local SQLite database: ${resolvedPath}`)
    
    const sqlite = new Database(resolvedPath)
    
    // Enable foreign key constraints
    sqlite.pragma('foreign_keys = ON')
    
    db = drizzle(sqlite, { schema })
    
    // Run migrations if they exist
    try {
      migrate(db, { migrationsFolder: path.join(process.cwd(), 'db', 'migrations') })
      console.log('✅ Database migrations completed successfully')
    } catch (error) {
      console.log('ℹ️  No migrations found or migrations already applied')
    }

    // Ensure critical columns exist even if older DB/journal is present
    // This is a safe, idempotent addition guarded by try/catch.
    try {
      sqlite.prepare('ALTER TABLE `transactions` ADD COLUMN `hash` text').run()
      console.log('🔁 Added missing transactions.hash column')
    } catch {
      // Ignore if column already exists
    }
  }
  
  return db
}

export { schema }
export default getDatabase
