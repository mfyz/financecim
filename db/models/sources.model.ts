import { eq, ne, and } from 'drizzle-orm'
import { getDatabase } from '../connection'
import { sources, type Source, type NewSource } from '../schema'

export const sourcesModel = {
  /**
   * Get all sources
   */
  async getAll(): Promise<Source[]> {
    const db = getDatabase()
    return await db.select().from(sources).orderBy(sources.createdAt)
  },

  /**
   * Get source by ID
   */
  async getById(id: number): Promise<Source | null> {
    const db = getDatabase()
    const result = await db.select().from(sources).where(eq(sources.id, id))
    return result[0] || null
  },

  /**
   * Create new source
   */
  async create(data: NewSource): Promise<Source> {
    const db = getDatabase()
    const result = await db.insert(sources).values(data).returning()
    return result[0]
  },

  /**
   * Update existing source
   */
  async update(id: number, data: Partial<NewSource>): Promise<Source> {
    const db = getDatabase()
    
    // Check if source exists
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Source not found')
    }

    const result = await db
      .update(sources)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(sources.id, id))
      .returning()
    
    return result[0]
  },

  /**
   * Delete source by ID
   */
  async delete(id: number): Promise<void> {
    const db = getDatabase()
    
    // Check if source exists
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Source not found')
    }

    try {
      await db.delete(sources).where(eq(sources.id, id))
    } catch (error: any) {
      // Handle foreign key constraint errors
      if (error?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        throw new Error('Cannot delete source: it is referenced by existing transactions. Please delete or reassign the related transactions first.')
      }
      throw error
    }
  },

  /**
   * Check if source name already exists (for validation)
   */
  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    const db = getDatabase()
    
    const whereConditions = [eq(sources.name, name)]
    
    if (excludeId) {
      whereConditions.push(ne(sources.id, excludeId))
    }
    
    const result = await db
      .select({ id: sources.id })
      .from(sources)
      .where(and(...whereConditions))
    
    return result.length > 0
  },

  /**
   * Get sources by type
   */
  async getByType(type: 'bank' | 'credit_card' | 'manual'): Promise<Source[]> {
    const db = getDatabase()
    return await db.select().from(sources).where(eq(sources.type, type))
  },

  /**
   * Get sources count by type (for analytics)
   */
  async getCountByType(): Promise<{ type: string; count: number }[]> {
    const db = getDatabase()
    // Note: SQLite doesn't have native GROUP BY aggregation in Drizzle ORM the same way
    // We'll handle this differently for now
    const allSources = await this.getAll()
    
    const counts = allSources.reduce((acc, source) => {
      acc[source.type] = (acc[source.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(counts).map(([type, count]) => ({ type, count }))
  }
}