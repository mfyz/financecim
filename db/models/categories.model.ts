import { getDatabase } from '../connection'
import { categories, Category, NewCategory } from '../schema'
import { eq, isNull, sql } from 'drizzle-orm'

export type InsertCategory = NewCategory
export type SelectCategory = Category

export interface CategoryWithChildren extends SelectCategory {
  children?: CategoryWithChildren[]
}

export const categoriesModel = {
  // Get all categories with hierarchy
  async getAll(): Promise<CategoryWithChildren[]> {
    const db = getDatabase()
    const allCategories = await db.select().from(categories).orderBy(categories.name)
    return this.buildHierarchy(allCategories)
  },

  // Get all categories flat (no hierarchy)
  async getAllFlat(): Promise<SelectCategory[]> {
    const db = getDatabase()
    return await db.select().from(categories).orderBy(categories.name)
  },

  // Get category by ID
  async getById(id: number): Promise<SelectCategory | null> {
    const db = getDatabase()
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
    return result[0] || null
  },

  // Create new category
  async create(data: Omit<InsertCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<SelectCategory> {
    const db = getDatabase()
    const result = await db.insert(categories).values({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning()
    return result[0]
  },

  // Update category
  async update(id: number, data: Partial<Omit<InsertCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SelectCategory> {
    const db = getDatabase()
    // Prevent setting self as parent
    if (data.parentCategoryId === id) {
      throw new Error('A category cannot be its own parent')
    }

    // Check for circular dependency
    if (data.parentCategoryId) {
      const wouldCreateCircularDependency = await this.checkCircularDependency(id, data.parentCategoryId)
      if (wouldCreateCircularDependency) {
        throw new Error('This change would create a circular dependency')
      }
    }

    const result = await db.update(categories)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, id))
      .returning()
    
    if (!result[0]) {
      throw new Error('Category not found')
    }
    
    return result[0]
  },

  // Delete category
  async delete(id: number): Promise<void> {
    // Check if category has children
    const children = await db.select()
      .from(categories)
      .where(eq(categories.parentCategoryId, id))
      .limit(1)
    
    if (children.length > 0) {
      throw new Error('Cannot delete category with subcategories')
    }

    // Check if category is used in transactions (will be implemented later)
    // For now, just delete the category
    const result = await db.delete(categories).where(eq(categories.id, id)).returning()
    
    if (!result[0]) {
      throw new Error('Category not found')
    }
  },

  // Update only the monthly budget
  async updateBudget(id: number, monthlyBudget: number | null): Promise<SelectCategory> {
    const db = getDatabase()
    const result = await db.update(categories)
      .set({
        monthlyBudget: monthlyBudget,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, id))
      .returning()
    
    if (!result[0]) {
      throw new Error('Category not found')
    }
    
    return result[0]
  },

  // Build hierarchy from flat list
  buildHierarchy(flatCategories: SelectCategory[]): CategoryWithChildren[] {
    const categoryMap = new Map<number, CategoryWithChildren>()
    const rootCategories: CategoryWithChildren[] = []

    // First pass: create all category objects
    flatCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: build hierarchy
    flatCategories.forEach(cat => {
      const category = categoryMap.get(cat.id)!
      if (cat.parentCategoryId === null) {
        rootCategories.push(category)
      } else {
        const parent = categoryMap.get(cat.parentCategoryId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(category)
        } else {
          // If parent doesn't exist, treat as root
          rootCategories.push(category)
        }
      }
    })

    return rootCategories
  },

  // Check if setting parentId would create a circular dependency
  async checkCircularDependency(categoryId: number, proposedParentId: number): Promise<boolean> {
    if (categoryId === proposedParentId) {
      return true
    }

    let currentId: number | null = proposedParentId
    const visited = new Set<number>()

    while (currentId !== null) {
      if (visited.has(currentId)) {
        return true // Found a cycle
      }
      if (currentId === categoryId) {
        return true // Would create a cycle
      }
      visited.add(currentId)

      const parent = await this.getById(currentId)
      currentId = parent?.parentCategoryId || null
    }

    return false
  },

  // Get categories for dropdown (flat list with indentation)
  async getForDropdown(): Promise<{ value: string; label: string }[]> {
    const hierarchical = await this.getAll()
    const options: { value: string; label: string }[] = []

    const addToOptions = (cats: CategoryWithChildren[], level = 0) => {
      cats.forEach(cat => {
        const indent = '  '.repeat(level)
        options.push({
          value: cat.id.toString(),
          label: `${indent}${cat.name}`,
        })
        if (cat.children && cat.children.length > 0) {
          addToOptions(cat.children, level + 1)
        }
      })
    }

    addToOptions(hierarchical)
    return options
  },

  /**
   * Get category spending analysis
   */
  async getSpending(
    timePeriod: string = 'current_month',
    unitId?: number
  ): Promise<{
    period: string
    dateRange: { start: string; end: string }
    categories: Array<{
      id: number
      name: string
      color: string
      monthlyBudget: number | null
      totalSpent: number
      transactionCount: number
      averageTransaction: number
      percentageOfTotal: number
      budgetUtilization: number
      parentCategory: string | null
    }>
    summary: {
      totalSpent: number
      totalBudget: number
      budgetUtilization: number
      overBudgetCategories: number
      savingsRate: number
    }
  }> {
    const db = getDatabase()

    // Determine date range based on timePeriod
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (timePeriod) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'last_3_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last_6_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'year_to_date':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date()
        break
      default:
        // Default to current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    // Format dates for SQL
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Import transactions table
    const { transactions } = await import('@/db/schema')
    const { eq, and, gte, lte, sql, isNotNull } = await import('drizzle-orm')

    // Build where conditions
    const whereConditions = [
      gte(transactions.date, startDateStr),
      lte(transactions.date, endDateStr),
      isNotNull(transactions.categoryId),
      sql`${transactions.amount} < 0` // Only expenses
    ]

    if (unitId) {
      whereConditions.push(eq(transactions.unitId, unitId))
    }

    // Get spending by category with parent info
    const spendingQuery = db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        categoryColor: categories.color,
        monthlyBudget: categories.monthlyBudget,
        parentCategoryId: categories.parentCategoryId,
        totalSpent: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
        transactionCount: sql<number>`COUNT(${transactions.id})`
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...whereConditions))
      .groupBy(categories.id)

    const spendingResult = await spendingQuery

    // Get parent category names
    const parentIds = [...new Set(spendingResult.map(r => r.parentCategoryId).filter(Boolean))]
    const parentCategories = parentIds.length > 0
      ? await db
          .select({ id: categories.id, name: categories.name })
          .from(categories)
          .where(sql`${categories.id} IN (${parentIds.join(',')})`)
      : []

    const parentMap = new Map(parentCategories.map(p => [p.id, p.name]))

    // Calculate total spent for percentage calculation
    const totalSpent = spendingResult.reduce((sum, cat) => sum + (cat.totalSpent || 0), 0)

    // Format category spending data
    const categorySpending = spendingResult.map(cat => ({
      id: cat.categoryId,
      name: cat.categoryName,
      color: cat.categoryColor,
      monthlyBudget: cat.monthlyBudget,
      totalSpent: cat.totalSpent || 0,
      transactionCount: cat.transactionCount || 0,
      averageTransaction: cat.transactionCount ? (cat.totalSpent || 0) / cat.transactionCount : 0,
      percentageOfTotal: totalSpent > 0 ? ((cat.totalSpent || 0) / totalSpent) * 100 : 0,
      budgetUtilization: cat.monthlyBudget ? ((cat.totalSpent || 0) / cat.monthlyBudget) * 100 : 0,
      parentCategory: cat.parentCategoryId ? parentMap.get(cat.parentCategoryId) || null : null
    }))

    // Sort by total spent (descending)
    categorySpending.sort((a, b) => b.totalSpent - a.totalSpent)

    // Calculate summary
    const totalBudget = categorySpending.reduce((sum, cat) => sum + (cat.monthlyBudget || 0), 0)
    const overBudgetCategories = categorySpending.filter(cat =>
      cat.monthlyBudget && cat.totalSpent > cat.monthlyBudget
    ).length

    return {
      period: timePeriod,
      dateRange: { start: startDateStr, end: endDateStr },
      categories: categorySpending,
      summary: {
        totalSpent,
        totalBudget,
        budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        overBudgetCategories,
        savingsRate: totalBudget > 0 ? Math.max(0, ((totalBudget - totalSpent) / totalBudget) * 100) : 0
      }
    }
  },
}