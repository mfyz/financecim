import { eq, ne, and } from 'drizzle-orm'
import { getDatabase } from '../connection'
import { units, type Unit, type NewUnit } from '../schema'

export const unitsModel = {
  /**
   * Get all units
   */
  async getAll(): Promise<Unit[]> {
    const db = getDatabase()
    return await db.select().from(units).orderBy(units.createdAt)
  },

  /**
   * Get unit by ID
   */
  async getById(id: number): Promise<Unit | null> {
    const db = getDatabase()
    const result = await db.select().from(units).where(eq(units.id, id))
    return result[0] || null
  },

  /**
   * Create new unit
   */
  async create(data: NewUnit): Promise<Unit> {
    const db = getDatabase()
    const result = await db.insert(units).values(data).returning()
    return result[0]
  },

  /**
   * Update existing unit
   */
  async update(id: number, data: Partial<NewUnit>): Promise<Unit> {
    const db = getDatabase()
    
    // Check if unit exists
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Unit not found')
    }

    const result = await db
      .update(units)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(units.id, id))
      .returning()
    
    return result[0]
  },

  /**
   * Delete unit by ID
   */
  async delete(id: number): Promise<void> {
    const db = getDatabase()
    
    // Check if unit exists
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Unit not found')
    }

    try {
      await db.delete(units).where(eq(units.id, id))
    } catch (error: any) {
      // Handle foreign key constraint errors
      if (error?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        throw new Error('Cannot delete unit: it is referenced by existing transactions. Please delete or reassign the related transactions first.')
      }
      throw error
    }
  },

  /**
   * Check if unit name already exists (for validation)
   */
  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    const db = getDatabase()
    
    const whereConditions = [eq(units.name, name)]
    
    if (excludeId) {
      whereConditions.push(ne(units.id, excludeId))
    }
    
    const result = await db
      .select({ id: units.id })
      .from(units)
      .where(and(...whereConditions))
    
    return result.length > 0
  },

  /**
   * Get active units only
   */
  async getActive(): Promise<Unit[]> {
    const db = getDatabase()
    return await db.select().from(units).where(eq(units.active, true)).orderBy(units.createdAt)
  },

  /**
   * Toggle unit active status
   */
  async toggleActive(id: number): Promise<Unit> {
    const db = getDatabase()
    
    // Get current unit
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Unit not found')
    }

    const result = await db
      .update(units)
      .set({ 
        active: !existing.active,
        updatedAt: new Date().toISOString() 
      })
      .where(eq(units.id, id))
      .returning()
    
    return result[0]
  },

  /**
   * Get units count by status (for analytics)
   */
  async getCountByStatus(): Promise<{ active: number; inactive: number }> {
    const allUnits = await this.getAll()
    
    const counts = allUnits.reduce((acc, unit) => {
      if (unit.active) {
        acc.active++
      } else {
        acc.inactive++
      }
      return acc
    }, { active: 0, inactive: 0 })
    
    return counts
  }
}