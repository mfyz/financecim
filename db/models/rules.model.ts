import { getDatabase } from '../connection'
import { unitRules, categoryRules, type UnitRule, type NewUnitRule, type CategoryRule, type NewCategoryRule } from '../schema'
import { eq, desc, and } from 'drizzle-orm'

const db = getDatabase()

export const rulesModel = {
  // Unit Rules
  async getAllUnitRules() {
    try {
      const rules = await db.select().from(unitRules).orderBy(desc(unitRules.priority))
      return rules
    } catch (error) {
      console.error('Error fetching unit rules:', error)
      throw new Error('Failed to fetch unit rules')
    }
  },

  async getUnitRuleById(id: number) {
    try {
      const [rule] = await db.select().from(unitRules).where(eq(unitRules.id, id)).limit(1)
      return rule || null
    } catch (error) {
      console.error('Error fetching unit rule:', error)
      throw new Error('Failed to fetch unit rule')
    }
  },

  async createUnitRule(data: NewUnitRule) {
    try {
      const [rule] = await db.insert(unitRules).values(data).returning()
      return rule
    } catch (error) {
      console.error('Error creating unit rule:', error)
      throw new Error('Failed to create unit rule')
    }
  },

  async updateUnitRule(id: number, data: Partial<NewUnitRule>) {
    try {
      const [rule] = await db.update(unitRules)
        .set({
          ...data,
          updatedAt: new Date().toISOString()
        })
        .where(eq(unitRules.id, id))
        .returning()

      return rule || null
    } catch (error) {
      console.error('Error updating unit rule:', error)
      throw new Error('Failed to update unit rule')
    }
  },

  async deleteUnitRule(id: number) {
    try {
      const [deleted] = await db.delete(unitRules).where(eq(unitRules.id, id)).returning()
      return deleted || null
    } catch (error) {
      console.error('Error deleting unit rule:', error)
      throw new Error('Failed to delete unit rule')
    }
  },

  async toggleUnitRuleStatus(id: number) {
    try {
      const rule = await this.getUnitRuleById(id)
      if (!rule) {
        return null
      }

      const [updated] = await db.update(unitRules)
        .set({
          active: !rule.active,
          updatedAt: new Date().toISOString()
        })
        .where(eq(unitRules.id, id))
        .returning()

      return updated
    } catch (error) {
      console.error('Error toggling unit rule status:', error)
      throw new Error('Failed to toggle unit rule status')
    }
  },

  async updateUnitRulePriorities(priorities: { id: number; priority: number }[]) {
    try {
      const results = await Promise.all(
        priorities.map(({ id, priority }) =>
          db.update(unitRules)
            .set({
              priority,
              updatedAt: new Date().toISOString()
            })
            .where(eq(unitRules.id, id))
            .returning()
        )
      )
      return results.map((result) => result[0]).filter(Boolean)
    } catch (error) {
      console.error('Error updating unit rule priorities:', error)
      throw new Error('Failed to update unit rule priorities')
    }
  },

  // Category Rules
  async getAllCategoryRules() {
    try {
      const rules = await db.select().from(categoryRules).orderBy(desc(categoryRules.priority))
      return rules
    } catch (error) {
      console.error('Error fetching category rules:', error)
      throw new Error('Failed to fetch category rules')
    }
  },

  async getCategoryRuleById(id: number) {
    try {
      const [rule] = await db.select().from(categoryRules).where(eq(categoryRules.id, id)).limit(1)
      return rule || null
    } catch (error) {
      console.error('Error fetching category rule:', error)
      throw new Error('Failed to fetch category rule')
    }
  },

  async createCategoryRule(data: NewCategoryRule) {
    try {
      const [rule] = await db.insert(categoryRules).values(data).returning()
      return rule
    } catch (error) {
      console.error('Error creating category rule:', error)
      throw new Error('Failed to create category rule')
    }
  },

  async updateCategoryRule(id: number, data: Partial<NewCategoryRule>) {
    try {
      const [rule] = await db.update(categoryRules)
        .set({
          ...data,
          updatedAt: new Date().toISOString()
        })
        .where(eq(categoryRules.id, id))
        .returning()

      return rule || null
    } catch (error) {
      console.error('Error updating category rule:', error)
      throw new Error('Failed to update category rule')
    }
  },

  async deleteCategoryRule(id: number) {
    try {
      const [deleted] = await db.delete(categoryRules).where(eq(categoryRules.id, id)).returning()
      return deleted || null
    } catch (error) {
      console.error('Error deleting category rule:', error)
      throw new Error('Failed to delete category rule')
    }
  },

  async toggleCategoryRuleStatus(id: number) {
    try {
      const rule = await this.getCategoryRuleById(id)
      if (!rule) {
        return null
      }

      const [updated] = await db.update(categoryRules)
        .set({
          active: !rule.active,
          updatedAt: new Date().toISOString()
        })
        .where(eq(categoryRules.id, id))
        .returning()

      return updated
    } catch (error) {
      console.error('Error toggling category rule status:', error)
      throw new Error('Failed to toggle category rule status')
    }
  },

  async updateCategoryRulePriorities(priorities: { id: number; priority: number }[]) {
    try {
      const results = await Promise.all(
        priorities.map(({ id, priority }) =>
          db.update(categoryRules)
            .set({
              priority,
              updatedAt: new Date().toISOString()
            })
            .where(eq(categoryRules.id, id))
            .returning()
        )
      )
      return results.map((result) => result[0]).filter(Boolean)
    } catch (error) {
      console.error('Error updating category rule priorities:', error)
      throw new Error('Failed to update category rule priorities')
    }
  },

  // Auto-categorization engine
  async applyRulesToTransaction(transaction: { description: string; sourceCategory?: string | null; sourceId?: number }) {
    try {
      // Get active rules sorted by priority
      const activeUnitRules = await db.select()
        .from(unitRules)
        .where(eq(unitRules.active, true))
        .orderBy(desc(unitRules.priority))

      const activeCategoryRules = await db.select()
        .from(categoryRules)
        .where(eq(categoryRules.active, true))
        .orderBy(desc(categoryRules.priority))

      let matchedUnitId: number | null = null
      let matchedCategoryId: number | null = null

      // Apply unit rules
      for (const rule of activeUnitRules) {
        const fieldToMatch = rule.ruleType === 'description'
          ? transaction.description
          : transaction.sourceId?.toString() || ''

        if (this.matchesPattern(fieldToMatch, rule.pattern, rule.matchType)) {
          matchedUnitId = rule.unitId
          break
        }
      }

      // Apply category rules
      for (const rule of activeCategoryRules) {
        const fieldToMatch = rule.ruleType === 'description'
          ? transaction.description
          : transaction.sourceCategory || ''

        if (this.matchesPattern(fieldToMatch, rule.pattern, rule.matchType)) {
          matchedCategoryId = rule.categoryId
          break
        }
      }

      return { unitId: matchedUnitId, categoryId: matchedCategoryId }
    } catch (error) {
      console.error('Error applying rules to transaction:', error)
      return { unitId: null, categoryId: null }
    }
  },

  matchesPattern(value: string, pattern: string, matchType: string): boolean {
    const lowerValue = value.toLowerCase()
    const lowerPattern = pattern.toLowerCase()

    switch (matchType) {
      case 'exact':
        return lowerValue === lowerPattern
      case 'starts_with':
        return lowerValue.startsWith(lowerPattern)
      case 'contains':
        return lowerValue.includes(lowerPattern)
      case 'regex':
        try {
          const regex = new RegExp(pattern, 'i')
          return regex.test(value)
        } catch {
          return false
        }
      default:
        return false
    }
  },

  // Test rules against sample data
  async testUnitRule(rule: Partial<NewUnitRule>, testData: { description?: string; sourceId?: number }) {
    if (!rule.pattern || !rule.matchType || !rule.ruleType) {
      return false
    }

    const fieldToMatch = rule.ruleType === 'description'
      ? testData.description || ''
      : testData.sourceId?.toString() || ''

    return this.matchesPattern(fieldToMatch, rule.pattern, rule.matchType)
  },

  async testCategoryRule(rule: Partial<NewCategoryRule>, testData: { description?: string; sourceCategory?: string }) {
    if (!rule.pattern || !rule.matchType || !rule.ruleType) {
      return false
    }

    const fieldToMatch = rule.ruleType === 'description'
      ? testData.description || ''
      : testData.sourceCategory || ''

    return this.matchesPattern(fieldToMatch, rule.pattern, rule.matchType)
  }
}