import { eq, and, or, like, desc, asc, sql, count, sum, gte, lte, ne, isNull, isNotNull } from 'drizzle-orm'
import { getDatabase } from '../connection'
import { transactions, units, sources, categories, type Transaction, type NewTransaction } from '../schema'
import { transactionHash } from '@/lib/hash'

export interface TransactionWithRelations extends Transaction {
  unit?: { id: number; name: string; color: string } | null
  source: { id: number; name: string; type: string }
  category?: { id: number; name: string; color: string } | null
}

export interface TransactionFilters {
  search?: string
  unitId?: number
  sourceId?: number
  categoryId?: number
  dateFrom?: string
  dateTo?: string
  amountMin?: number
  amountMax?: number
  showIgnored?: boolean
  tags?: string[]
}

export interface BulkUpdateData {
  unitId?: number
  categoryId?: number
  ignore?: boolean
  notes?: string
}

export const transactionsModel = {
  /**
   * Normalize incoming payload supporting both camelCase and snake_case keys
   * Also normalizes date (YYYY-MM-DD) and computes hash when absent
   */
  normalizePayload(input: any): NewTransaction {
    // Accept both snake_case and camelCase
    const sourceId = input.sourceId ?? input.source_id
    const unitId = input.unitId ?? input.unit_id ?? undefined
    const categoryId = input.categoryId ?? input.category_id ?? undefined
    const sourceCategory = input.sourceCategory ?? input.source_category ?? undefined
    const ignore = input.ignore ?? false
    const notes = input.notes ?? undefined
    const tags = input.tags ?? undefined

    // Normalize date to YYYY-MM-DD string
    let date: string
    if (input.date instanceof Date) {
      date = input.date.toISOString().split('T')[0]
    } else if (typeof input.date === 'string') {
      // Assume already in ISO or parsable
      const d = new Date(input.date)
      if (!isNaN(d.getTime())) {
        date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      } else {
        // Fallback: use as-is
        date = input.date
      }
    } else {
      throw new Error('Invalid date')
    }

    const description = input.description
    const amount = input.amount

    // Compute hash if not provided
    const hash: string | undefined = input.hash
      ? String(input.hash)
      : (typeof sourceId === 'number' && typeof description === 'string' && typeof amount === 'number'
          ? transactionHash(sourceId, date, description, amount)
          : undefined)

    const payload: NewTransaction = {
      sourceId,
      unitId: unitId ?? null as any,
      date,
      description,
      amount,
      sourceCategory: (sourceCategory ?? null) as any,
      categoryId: (categoryId ?? null) as any,
      ignore,
      notes: (notes ?? null) as any,
      tags: (tags ?? null) as any,
      hash: (hash ?? null) as any,
    } as NewTransaction
    // No createdAt/updatedAt here; let DB defaults apply

    return payload
  },

  /** Create a new transaction */
  async create(data: any) {
    const db = getDatabase()
    const values = this.normalizePayload(data)
    // Debug: ensure no unsupported types slip through
    console.log('transactions.create values', values)
    const [created] = await db.insert(transactions).values(values).returning()
    return created
  },

  /** Get a transaction by its duplicate-detection hash */
  async getByHash(hash: string) {
    const db = getDatabase()
    const [row] = await db.select().from(transactions).where(eq(transactions.hash, hash)).limit(1)
    return row || null
  },

  /** Update a transaction by ID */
  async update(id: number, data: Partial<NewTransaction>) {
    const db = getDatabase()
    // Ensure exists
    const [existing] = await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.id, id)).limit(1)
    if (!existing) {
      throw new Error('Transaction not found')
    }

    // Map potential snake_case keys and normalize date
    const mapped: Partial<NewTransaction> = {}
    if (data.hasOwnProperty('sourceId') || (data as any).source_id !== undefined) {
      mapped.sourceId = (data as any).sourceId ?? (data as any).source_id
    }
    if (data.hasOwnProperty('unitId') || (data as any).unit_id !== undefined) {
      mapped.unitId = (data as any).unitId ?? (data as any).unit_id
    }
    if (data.hasOwnProperty('categoryId') || (data as any).category_id !== undefined) {
      mapped.categoryId = (data as any).categoryId ?? (data as any).category_id
    }
    if (data.hasOwnProperty('sourceCategory') || (data as any).source_category !== undefined) {
      mapped.sourceCategory = (data as any).sourceCategory ?? (data as any).source_category
    }
    if (data.hasOwnProperty('ignore')) mapped.ignore = data.ignore as any
    if (data.hasOwnProperty('notes')) mapped.notes = data.notes as any
    if (data.hasOwnProperty('tags')) mapped.tags = data.tags as any
    if (data.hasOwnProperty('description')) mapped.description = data.description as any
    if (data.hasOwnProperty('amount')) mapped.amount = data.amount as any
    if ((data as any).date !== undefined) {
      const d = (data as any).date
      if (d instanceof Date) {
        mapped.date = d.toISOString().split('T')[0]
      } else if (typeof d === 'string') {
        const dd = new Date(d)
        mapped.date = !isNaN(dd.getTime())
          ? `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`
          : d
      }
    }

    mapped.updatedAt = new Date().toISOString()

    const [updated] = await db.update(transactions).set(mapped).where(eq(transactions.id, id)).returning()
    return updated
  },

  /** Delete a transaction by ID */
  async delete(id: number) {
    const db = getDatabase()
    const [existing] = await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.id, id)).limit(1)
    if (!existing) {
      throw new Error('Transaction not found')
    }
    await db.delete(transactions).where(eq(transactions.id, id))
  },
  /**
   * Get all transactions with pagination and filters
   */
  async getAll(
    page = 1, 
    limit = 50, 
    sortBy = 'date', 
    sortOrder: 'asc' | 'desc' = 'desc',
    filters: TransactionFilters = {}
  ): Promise<{ data: TransactionWithRelations[]; total: number; totalPages: number }> {
    const db = getDatabase()
    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions = []

    if (filters.search) {
      whereConditions.push(like(transactions.description, `%${filters.search}%`))
    }

    if (filters.unitId) {
      whereConditions.push(eq(transactions.unitId, filters.unitId))
    }

    if (filters.sourceId) {
      whereConditions.push(eq(transactions.sourceId, filters.sourceId))
    }

    if (filters.categoryId) {
      whereConditions.push(eq(transactions.categoryId, filters.categoryId))
    }

    if (filters.dateFrom) {
      whereConditions.push(gte(transactions.date, filters.dateFrom))
    }

    if (filters.dateTo) {
      whereConditions.push(lte(transactions.date, filters.dateTo))
    }

    if (filters.amountMin !== undefined) {
      whereConditions.push(gte(transactions.amount, filters.amountMin))
    }

    if (filters.amountMax !== undefined) {
      whereConditions.push(lte(transactions.amount, filters.amountMax))
    }

    if (filters.showIgnored === false) {
      whereConditions.push(eq(transactions.ignore, false))
    } else if (filters.showIgnored === true) {
      whereConditions.push(eq(transactions.ignore, true))
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(tag => like(transactions.tags, `%${tag}%`))
      whereConditions.push(or(...tagConditions))
    }

    // Build sort order
    const sortColumn = {
      date: transactions.date,
      amount: transactions.amount,
      description: transactions.description,
      created_at: transactions.createdAt,
    }[sortBy] || transactions.date

    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)

    // Get total count
    let totalQuery = db.select({ count: count() }).from(transactions)

    if (whereConditions.length > 0) {
      totalQuery = totalQuery.where(and(...whereConditions))
    }

    const totalResult = await totalQuery

    const total = totalResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    // Get data with relations
    let dataQuery = db
      .select({
        // Transaction fields
        id: transactions.id,
        sourceId: transactions.sourceId,
        unitId: transactions.unitId,
        date: transactions.date,
        description: transactions.description,
        amount: transactions.amount,
        sourceCategory: transactions.sourceCategory,
        categoryId: transactions.categoryId,
        ignore: transactions.ignore,
        notes: transactions.notes,
        tags: transactions.tags,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        // Unit relation
        unitName: units.name,
        unitColor: units.color,
        // Source relation
        sourceName: sources.name,
        sourceType: sources.type,
        // Category relation
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(transactions)
      .leftJoin(units, eq(transactions.unitId, units.id))
      .innerJoin(sources, eq(transactions.sourceId, sources.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))

    if (whereConditions.length > 0) {
      dataQuery = dataQuery.where(and(...whereConditions))
    }

    const data = await dataQuery
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    // Transform to include nested objects
    const transformedData: TransactionWithRelations[] = data.map(row => ({
      id: row.id,
      sourceId: row.sourceId,
      unitId: row.unitId,
      date: row.date,
      description: row.description,
      amount: row.amount,
      sourceCategory: row.sourceCategory,
      categoryId: row.categoryId,
      ignore: row.ignore,
      notes: row.notes,
      tags: row.tags,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      unit: row.unitId ? {
        id: row.unitId,
        name: row.unitName!,
        color: row.unitColor!
      } : null,
      source: {
        id: row.sourceId,
        name: row.sourceName,
        type: row.sourceType
      },
      category: row.categoryId ? {
        id: row.categoryId,
        name: row.categoryName!,
        color: row.categoryColor!
      } : null
    }))

    return { data: transformedData, total, totalPages }
  },

  /**
   * Get transaction by ID with relations
   */
  async getById(id: number): Promise<TransactionWithRelations | null> {
    const db = getDatabase()
    
    const result = await db
      .select({
        // Transaction fields
        id: transactions.id,
        sourceId: transactions.sourceId,
        unitId: transactions.unitId,
        date: transactions.date,
        description: transactions.description,
        amount: transactions.amount,
        sourceCategory: transactions.sourceCategory,
        categoryId: transactions.categoryId,
        ignore: transactions.ignore,
        notes: transactions.notes,
        tags: transactions.tags,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        // Unit relation
        unitName: units.name,
        unitColor: units.color,
        // Source relation
        sourceName: sources.name,
        sourceType: sources.type,
        // Category relation
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(transactions)
      .leftJoin(units, eq(transactions.unitId, units.id))
      .innerJoin(sources, eq(transactions.sourceId, sources.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.id, id))

    if (!result[0]) return null

    const row = result[0]
    return {
      id: row.id,
      sourceId: row.sourceId,
      unitId: row.unitId,
      date: row.date,
      description: row.description,
      amount: row.amount,
      sourceCategory: row.sourceCategory,
      categoryId: row.categoryId,
      ignore: row.ignore,
      notes: row.notes,
      tags: row.tags,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      unit: row.unitId ? {
        id: row.unitId,
        name: row.unitName!,
        color: row.unitColor!
      } : null,
      source: {
        id: row.sourceId,
        name: row.sourceName,
        type: row.sourceType
      },
      category: row.categoryId ? {
        id: row.categoryId,
        name: row.categoryName!,
        color: row.categoryColor!
      } : null
    }
  },

  /**
   * Get transaction by hash
   */
  async getByHash(hash: string): Promise<Transaction | null> {
    const db = getDatabase()
    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.hash, hash))
      .limit(1)

    return result[0] || null
  },

  /**
   * Create new transaction
   */
  async create(data: NewTransaction): Promise<Transaction> {
    const db = getDatabase()
    // Auto-generate hash if missing and enough data is present
    let values: NewTransaction = { ...data }
    if (!values.hash && values.sourceId && values.date && values.description && typeof values.amount === 'number') {
      values.hash = transactionHash(values.sourceId, values.date, values.description, values.amount)
    }
    const result = await db.insert(transactions).values(values).returning()
    return result[0]
  },

  /**
   * Update existing transaction
   */
  async update(id: number, data: Partial<NewTransaction>): Promise<Transaction> {
    const db = getDatabase()
    
    // Check if transaction exists
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Transaction not found')
    }

    const result = await db
      .update(transactions)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(transactions.id, id))
      .returning()
    
    return result[0]
  },

  /**
   * Delete transaction by ID
   */
  async delete(id: number): Promise<void> {
    const db = getDatabase()
    
    // Check if transaction exists
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Transaction not found')
    }

    await db.delete(transactions).where(eq(transactions.id, id))
  },

  /**
   * Bulk update transactions
   */
  async bulkUpdate(ids: number[], data: BulkUpdateData): Promise<number> {
    const db = getDatabase()
    
    if (ids.length === 0) return 0

    const updateData: Partial<NewTransaction> = {
      ...data,
      updatedAt: new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    const result = await db
      .update(transactions)
      .set(updateData)
      .where(or(...ids.map(id => eq(transactions.id, id))))

    return ids.length // Return number of affected rows
  },

  /**
   * Bulk delete transactions
   */
  async bulkDelete(ids: number[]): Promise<number> {
    const db = getDatabase()
    
    if (ids.length === 0) return 0

    await db
      .delete(transactions)
      .where(or(...ids.map(id => eq(transactions.id, id))))

    return ids.length
  },

  /**
   * Get transaction statistics
   */
  async getStats(filters: TransactionFilters = {}): Promise<{
    totalTransactions: number
    totalIncome: number
    totalExpenses: number
    averageTransaction: number
    categorizedCount: number
    uncategorizedCount: number
    ignoredCount: number
  }> {
    const db = getDatabase()

    // Build where conditions (reuse from getAll)
    const whereConditions = []

    if (filters.search) {
      whereConditions.push(like(transactions.description, `%${filters.search}%`))
    }
    if (filters.unitId) {
      whereConditions.push(eq(transactions.unitId, filters.unitId))
    }
    if (filters.sourceId) {
      whereConditions.push(eq(transactions.sourceId, filters.sourceId))
    }
    if (filters.categoryId) {
      whereConditions.push(eq(transactions.categoryId, filters.categoryId))
    }
    if (filters.dateFrom) {
      whereConditions.push(gte(transactions.date, filters.dateFrom))
    }
    if (filters.dateTo) {
      whereConditions.push(lte(transactions.date, filters.dateTo))
    }
    if (filters.amountMin !== undefined) {
      whereConditions.push(gte(transactions.amount, filters.amountMin))
    }
    if (filters.amountMax !== undefined) {
      whereConditions.push(lte(transactions.amount, filters.amountMax))
    }

    // Get basic stats
    let basicStatsQuery = db
      .select({
        totalTransactions: count(),
        totalAmount: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
        averageTransaction: sql<number>`COALESCE(AVG(${transactions.amount}), 0)`,
      })
      .from(transactions)

    if (whereConditions.length > 0) {
      basicStatsQuery = basicStatsQuery.where(and(...whereConditions))
    }

    const basicStats = await basicStatsQuery

    // Get income/expense breakdown
    let incomeExpenseQuery = db
      .select({
        totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
        totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
      })
      .from(transactions)

    if (whereConditions.length > 0) {
      incomeExpenseQuery = incomeExpenseQuery.where(and(...whereConditions))
    }

    const incomeExpenseStats = await incomeExpenseQuery

    // Get categorization stats
    let categorizationQuery = db
      .select({
        categorizedCount: sql<number>`COUNT(CASE WHEN ${transactions.categoryId} IS NOT NULL THEN 1 END)`,
        uncategorizedCount: sql<number>`COUNT(CASE WHEN ${transactions.categoryId} IS NULL THEN 1 END)`,
        ignoredCount: sql<number>`COUNT(CASE WHEN ${transactions.ignore} = true THEN 1 END)`,
      })
      .from(transactions)

    if (whereConditions.length > 0) {
      categorizationQuery = categorizationQuery.where(and(...whereConditions))
    }

    const categorizationStats = await categorizationQuery

    const basic = basicStats[0]
    const incomeExpense = incomeExpenseStats[0]
    const categorization = categorizationStats[0]

    return {
      totalTransactions: basic?.totalTransactions || 0,
      totalIncome: incomeExpense?.totalIncome || 0,
      totalExpenses: incomeExpense?.totalExpenses || 0,
      averageTransaction: basic?.averageTransaction || 0,
      categorizedCount: categorization?.categorizedCount || 0,
      uncategorizedCount: categorization?.uncategorizedCount || 0,
      ignoredCount: categorization?.ignoredCount || 0,
    }
  },

  /**
   * Get unique tags from all transactions
   */
  async getAllTags(): Promise<string[]> {
    const db = getDatabase()

    const result = await db
      .select({ tags: transactions.tags })
      .from(transactions)
      .where(isNotNull(transactions.tags))

    const allTags = new Set<string>()

    const rows = Array.isArray(result) ? result : []
    rows.forEach(row => {
      if (row.tags) {
        const tags = row.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        tags.forEach(tag => allTags.add(tag))
      }
    })

    return Array.from(allTags).sort()
  },

  /**
   * Search transactions by description
   */
  async search(query: string, limit = 20): Promise<TransactionWithRelations[]> {
    if (!query.trim()) return []

    const result = await this.getAll(1, limit, 'date', 'desc', { search: query })
    return result.data
  }
}
