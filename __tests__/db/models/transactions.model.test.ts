/**
 * @jest-environment node
 */

import { transactionsModel, type TransactionFilters } from '@/db/models/transactions.model'
import { unitsModel } from '@/db/models/units.model'
import { sourcesModel } from '@/db/models/sources.model'
import { categoriesModel } from '@/db/models/categories.model'

// Mock database dependencies
jest.mock('@/db/connection', () => ({
  getDatabase: jest.fn()
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
  like: jest.fn(),
  desc: jest.fn(),
  asc: jest.fn(),
  sql: jest.fn(),
  count: jest.fn(),
  sum: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  ne: jest.fn(),
  isNull: jest.fn(),
  isNotNull: jest.fn()
}))

// Mock transaction data
const mockTransactions = [
  {
    id: 1,
    sourceId: 1,
    unitId: 1,
    date: '2024-01-20',
    description: 'TEST GROCERY STORE',
    amount: -125.43,
    sourceCategory: 'Groceries',
    categoryId: 1,
    ignore: false,
    notes: 'Weekly groceries',
    tags: 'groceries,weekly',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 2,
    sourceId: 1,
    unitId: 2,
    date: '2024-01-19',
    description: 'TEST SALARY DEPOSIT',
    amount: 3500.00,
    sourceCategory: 'Income',
    categoryId: null,
    ignore: false,
    notes: 'Monthly salary',
    tags: 'salary,income',
    createdAt: '2024-01-19T09:00:00Z',
    updatedAt: '2024-01-19T09:00:00Z'
  },
  {
    id: 3,
    sourceId: 2,
    unitId: 1,
    date: '2024-01-18',
    description: 'TEST RESTAURANT',
    amount: -45.67,
    sourceCategory: 'Food & Dining',
    categoryId: 2,
    ignore: true,
    notes: 'Business dinner',
    tags: 'business,dining',
    createdAt: '2024-01-18T19:30:00Z',
    updatedAt: '2024-01-18T19:30:00Z'
  }
]

const mockTransactionsWithRelations = mockTransactions.map(t => ({
  ...t,
  unit: t.unitId ? {
    id: t.unitId,
    name: `Test Unit ${t.unitId}`,
    color: '#3B82F6'
  } : null,
  source: {
    id: t.sourceId,
    name: `Test Source ${t.sourceId}`,
    type: 'bank'
  },
  category: t.categoryId ? {
    id: t.categoryId,
    name: `Test Category ${t.categoryId}`,
    color: '#10B981'
  } : null
}))

const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
}

const mockSelectBuilder = {
  from: jest.fn(),
  leftJoin: jest.fn(),
  innerJoin: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  offset: jest.fn(),
  returning: jest.fn()
}

describe('transactionsModel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock chain
    mockSelectBuilder.from.mockReturnValue(mockSelectBuilder)
    mockSelectBuilder.leftJoin.mockReturnValue(mockSelectBuilder)
    mockSelectBuilder.innerJoin.mockReturnValue(mockSelectBuilder)
    mockSelectBuilder.where.mockReturnValue(mockSelectBuilder)
    mockSelectBuilder.orderBy.mockReturnValue(mockSelectBuilder)
    mockSelectBuilder.limit.mockReturnValue(mockSelectBuilder)
    mockSelectBuilder.offset.mockReturnValue(mockSelectBuilder)
    mockSelectBuilder.returning.mockReturnValue(mockTransactions)
    
    mockDb.select.mockReturnValue(mockSelectBuilder)
    mockDb.insert.mockReturnValue({ values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([mockTransactions[0]]) }) })
    mockDb.update.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([mockTransactions[0]]) }) }) })
    mockDb.delete.mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) })
    
    require('@/db/connection').getDatabase.mockReturnValue(mockDb)
  })

  describe('getAll', () => {
    it('should fetch all transactions with default pagination', async () => {
      // Mock the count query
      mockSelectBuilder.from.mockResolvedValueOnce([{ count: 3 }])
      // Mock the data query  
      mockSelectBuilder.offset.mockResolvedValueOnce(mockTransactionsWithRelations)

      const result = await transactionsModel.getAll()

      expect(result).toEqual({
        data: mockTransactionsWithRelations,
        total: 3,
        totalPages: 1
      })
      expect(mockDb.select).toHaveBeenCalledTimes(2) // count + data queries
    })

    it('should apply search filter', async () => {
      const filters: TransactionFilters = { search: 'GROCERY' }
      
      mockSelectBuilder.from.mockResolvedValueOnce([{ count: 1 }])
      mockSelectBuilder.offset.mockResolvedValueOnce([mockTransactionsWithRelations[0]])

      const result = await transactionsModel.getAll(1, 50, 'date', 'desc', filters)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].description).toContain('GROCERY')
    })

    it('should apply date range filters', async () => {
      const filters: TransactionFilters = {
        dateFrom: '2024-01-19',
        dateTo: '2024-01-20'
      }
      
      mockSelectBuilder.from.mockResolvedValueOnce([{ count: 2 }])
      mockSelectBuilder.offset.mockResolvedValueOnce(mockTransactionsWithRelations.slice(0, 2))

      const result = await transactionsModel.getAll(1, 50, 'date', 'desc', filters)

      expect(result.data).toHaveLength(2)
    })

    it('should apply amount range filters', async () => {
      const filters: TransactionFilters = {
        amountMin: 100,
        amountMax: 4000
      }
      
      mockSelectBuilder.from.mockResolvedValueOnce([{ count: 1 }])
      mockSelectBuilder.offset.mockResolvedValueOnce([mockTransactionsWithRelations[1]])

      const result = await transactionsModel.getAll(1, 50, 'date', 'desc', filters)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].amount).toBe(3500.00)
    })

    it('should apply unit filter', async () => {
      const filters: TransactionFilters = { unitId: 1 }
      
      mockSelectBuilder.from.mockResolvedValueOnce([{ count: 2 }])
      mockSelectBuilder.offset.mockResolvedValueOnce([mockTransactionsWithRelations[0], mockTransactionsWithRelations[2]])

      const result = await transactionsModel.getAll(1, 50, 'date', 'desc', filters)

      expect(result.data).toHaveLength(2)
      expect(result.data.every(t => t.unitId === 1)).toBe(true)
    })

    it('should filter ignored transactions', async () => {
      const filters: TransactionFilters = { showIgnored: false }
      
      mockSelectBuilder.from.mockResolvedValueOnce([{ count: 2 }])
      mockSelectBuilder.offset.mockResolvedValueOnce([mockTransactionsWithRelations[0], mockTransactionsWithRelations[1]])

      const result = await transactionsModel.getAll(1, 50, 'date', 'desc', filters)

      expect(result.data).toHaveLength(2)
      expect(result.data.every(t => !t.ignore)).toBe(true)
    })

    it('should handle pagination correctly', async () => {
      mockSelectBuilder.from.mockResolvedValueOnce([{ count: 150 }])
      mockSelectBuilder.offset.mockResolvedValueOnce(mockTransactionsWithRelations)

      const result = await transactionsModel.getAll(2, 50, 'date', 'desc')

      expect(result.totalPages).toBe(3)
      expect(mockSelectBuilder.offset).toHaveBeenCalledWith(50) // page 2 offset
    })

    it('should sort by different fields', async () => {
      mockSelectBuilder.from.mockResolvedValueOnce([{ count: 3 }])
      mockSelectBuilder.offset.mockResolvedValueOnce(mockTransactionsWithRelations)

      await transactionsModel.getAll(1, 50, 'amount', 'asc')

      expect(mockSelectBuilder.orderBy).toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should fetch transaction by ID with relations', async () => {
      mockSelectBuilder.where.mockResolvedValue([{
        ...mockTransactions[0],
        unitName: 'Test Unit 1',
        unitColor: '#3B82F6',
        sourceName: 'Test Source 1',
        sourceType: 'bank',
        categoryName: 'Test Category 1',
        categoryColor: '#10B981'
      }])

      const result = await transactionsModel.getById(1)

      expect(result).toBeTruthy()
      expect(result?.id).toBe(1)
      expect(result?.unit).toEqual({
        id: 1,
        name: 'Test Unit 1',
        color: '#3B82F6'
      })
      expect(result?.source).toEqual({
        id: 1,
        name: 'Test Source 1',
        type: 'bank'
      })
    })

    it('should return null for non-existent transaction', async () => {
      mockSelectBuilder.where.mockResolvedValue([])

      const result = await transactionsModel.getById(999)

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create new transaction', async () => {
      const newTransaction = {
        sourceId: 1,
        unitId: 1,
        date: '2024-01-21',
        description: 'TEST NEW TRANSACTION',
        amount: -99.99,
        sourceCategory: 'Shopping',
        categoryId: 1,
        ignore: false,
        notes: 'Test note',
        tags: 'test,new'
      }

      const result = await transactionsModel.create(newTransaction)

      expect(result).toEqual(mockTransactions[0])
      expect(mockDb.insert).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('should update existing transaction', async () => {
      // Mock getById to return existing transaction
      jest.spyOn(transactionsModel, 'getById').mockResolvedValue(mockTransactionsWithRelations[0])

      const updateData = { amount: -150.00, notes: 'Updated note' }
      const result = await transactionsModel.update(1, updateData)

      expect(result).toEqual(mockTransactions[0])
      expect(mockDb.update).toHaveBeenCalled()
    })

    it('should throw error for non-existent transaction', async () => {
      jest.spyOn(transactionsModel, 'getById').mockResolvedValue(null)

      await expect(transactionsModel.update(999, {})).rejects.toThrow('Transaction not found')
    })
  })

  describe('delete', () => {
    it('should delete existing transaction', async () => {
      jest.spyOn(transactionsModel, 'getById').mockResolvedValue(mockTransactionsWithRelations[0])

      await transactionsModel.delete(1)

      expect(mockDb.delete).toHaveBeenCalled()
    })

    it('should throw error for non-existent transaction', async () => {
      jest.spyOn(transactionsModel, 'getById').mockResolvedValue(null)

      await expect(transactionsModel.delete(999)).rejects.toThrow('Transaction not found')
    })
  })

  describe('bulkUpdate', () => {
    it('should update multiple transactions', async () => {
      const updateData = { unitId: 2, ignore: true }
      
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined)
        })
      })

      const result = await transactionsModel.bulkUpdate([1, 2, 3], updateData)

      expect(result).toBe(3)
      expect(mockDb.update).toHaveBeenCalled()
    })

    it('should return 0 for empty IDs array', async () => {
      const result = await transactionsModel.bulkUpdate([], { unitId: 2 })

      expect(result).toBe(0)
      expect(mockDb.update).not.toHaveBeenCalled()
    })
  })

  describe('bulkDelete', () => {
    it('should delete multiple transactions', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      })

      const result = await transactionsModel.bulkDelete([1, 2, 3])

      expect(result).toBe(3)
      expect(mockDb.delete).toHaveBeenCalled()
    })

    it('should return 0 for empty IDs array', async () => {
      const result = await transactionsModel.bulkDelete([])

      expect(result).toBe(0)
      expect(mockDb.delete).not.toHaveBeenCalled()
    })
  })

  describe('getStats', () => {
    it('should calculate transaction statistics', async () => {
      // Mock multiple queries for stats calculation
      mockSelectBuilder.from
        .mockResolvedValueOnce([{
          totalTransactions: 3,
          totalAmount: 3328.90,
          averageTransaction: 1109.63
        }])
        .mockResolvedValueOnce([{
          totalIncome: 3500.00,
          totalExpenses: 171.10
        }])
        .mockResolvedValueOnce([{
          categorizedCount: 2,
          uncategorizedCount: 1,
          ignoredCount: 1
        }])

      const stats = await transactionsModel.getStats()

      expect(stats).toEqual({
        totalTransactions: 3,
        totalIncome: 3500.00,
        totalExpenses: 171.10,
        averageTransaction: 1109.63,
        categorizedCount: 2,
        uncategorizedCount: 1,
        ignoredCount: 1
      })
    })

    it('should handle empty result gracefully', async () => {
      mockSelectBuilder.from
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const stats = await transactionsModel.getStats()

      expect(stats).toEqual({
        totalTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        averageTransaction: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        ignoredCount: 0
      })
    })
  })

  describe('getAllTags', () => {
    it('should extract unique tags from transactions', async () => {
      mockSelectBuilder.where.mockResolvedValue([
        { tags: 'groceries,weekly' },
        { tags: 'salary,income' },
        { tags: 'business,dining,groceries' },
        { tags: 'test,new,business' }
      ])

      const tags = await transactionsModel.getAllTags()

      expect(tags).toEqual(['business', 'dining', 'groceries', 'income', 'new', 'salary', 'test', 'weekly'])
    })

    it('should handle empty tags', async () => {
      mockSelectBuilder.where.mockResolvedValue([])

      const tags = await transactionsModel.getAllTags()

      expect(tags).toEqual([])
    })

    it('should handle null tags', async () => {
      mockSelectBuilder.where.mockResolvedValue([
        { tags: null },
        { tags: 'valid,tag' }
      ])

      const tags = await transactionsModel.getAllTags()

      expect(tags).toEqual(['tag', 'valid'])
    })
  })

  describe('search', () => {
    it('should search transactions by query', async () => {
      jest.spyOn(transactionsModel, 'getAll').mockResolvedValue({
        data: [mockTransactionsWithRelations[0]],
        total: 1,
        totalPages: 1
      })

      const result = await transactionsModel.search('GROCERY')

      expect(result).toHaveLength(1)
      expect(result[0].description).toContain('GROCERY')
      expect(transactionsModel.getAll).toHaveBeenCalledWith(1, 20, 'date', 'desc', { search: 'GROCERY' })
    })

    it('should return empty array for empty query', async () => {
      const result = await transactionsModel.search('')

      expect(result).toEqual([])
      expect(transactionsModel.getAll).not.toHaveBeenCalled()
    })

    it('should return empty array for whitespace query', async () => {
      const result = await transactionsModel.search('   ')

      expect(result).toEqual([])
      expect(transactionsModel.getAll).not.toHaveBeenCalled()
    })
  })
})