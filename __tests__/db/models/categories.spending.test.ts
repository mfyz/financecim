/**
 * @jest-environment node
 */

import { categoriesModel } from '@/db/models/categories.model'
import { getDatabase } from '@/db/connection'

// Mock the database connection
jest.mock('@/db/connection', () => ({
  getDatabase: jest.fn()
}))

describe('categoriesModel.getSpending', () => {
  const mockDb = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    from: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getDatabase as jest.Mock).mockReturnValue(mockDb)
  })

  it('should get category spending for current month', async () => {
    const mockSpendingData = [
      {
        categoryId: 1,
        categoryName: 'Groceries',
        categoryColor: '#10B981',
        monthlyBudget: 500,
        parentCategoryId: null,
        totalSpent: 450,
        transactionCount: 15
      },
      {
        categoryId: 2,
        categoryName: 'Transportation',
        categoryColor: '#3B82F6',
        monthlyBudget: 200,
        parentCategoryId: null,
        totalSpent: 180,
        transactionCount: 8
      }
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockResolvedValue(mockSpendingData)
    }

    mockDb.select.mockReturnValue(mockQuery)

    const result = await categoriesModel.getSpending('current_month')

    expect(result.period).toBe('current_month')
    expect(result.dateRange).toHaveProperty('start')
    expect(result.dateRange).toHaveProperty('end')
    expect(result.categories).toHaveLength(2)

    expect(result.categories[0]).toMatchObject({
      id: 1,
      name: 'Groceries',
      color: '#10B981',
      monthlyBudget: 500,
      totalSpent: 450,
      transactionCount: 15,
      averageTransaction: 30,
      percentageOfTotal: expect.any(Number),
      budgetUtilization: 90,
      parentCategory: null
    })

    expect(result.summary).toMatchObject({
      totalSpent: 630,
      totalBudget: 700,
      budgetUtilization: 90,
      overBudgetCategories: 0,
      savingsRate: 10
    })
  })

  it('should filter by unitId when provided', async () => {
    const mockSpendingData = [
      {
        categoryId: 1,
        categoryName: 'Groceries',
        categoryColor: '#10B981',
        monthlyBudget: 500,
        parentCategoryId: null,
        totalSpent: 250,
        transactionCount: 10
      }
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockResolvedValue(mockSpendingData)
    }

    mockDb.select.mockReturnValue(mockQuery)

    const result = await categoriesModel.getSpending('current_month', 1)

    expect(result.categories).toHaveLength(1)
    expect(result.summary.totalSpent).toBe(250)
  })

  it('should handle different time periods', async () => {
    const mockSpendingData = []

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockResolvedValue(mockSpendingData)
    }

    mockDb.select.mockReturnValue(mockQuery)

    // Test different time periods
    const timePeriods = ['last_month', 'last_3_months', 'last_6_months', 'year_to_date']

    for (const period of timePeriods) {
      const result = await categoriesModel.getSpending(period)
      expect(result.period).toBe(period)
      expect(result.dateRange).toHaveProperty('start')
      expect(result.dateRange).toHaveProperty('end')
    }
  })

  it('should handle categories with parent relationships', async () => {
    const mockSpendingData = [
      {
        categoryId: 3,
        categoryName: 'Dining Out',
        categoryColor: '#F59E0B',
        monthlyBudget: 150,
        parentCategoryId: 1, // Child of Food category
        totalSpent: 120,
        transactionCount: 5
      }
    ]

    // Mock parent category lookup
    const mockParentQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([
        { id: 1, name: 'Food' }
      ])
    }

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockResolvedValue(mockSpendingData)
    }

    mockDb.select
      .mockReturnValueOnce(mockQuery) // First call for spending data
      .mockReturnValueOnce(mockParentQuery) // Second call for parent names

    const result = await categoriesModel.getSpending('current_month')

    expect(result.categories[0].parentCategory).toBe('Food')
  })

  it('should handle empty spending data', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockResolvedValue([])
    }

    mockDb.select.mockReturnValue(mockQuery)

    const result = await categoriesModel.getSpending('current_month')

    expect(result.categories).toEqual([])
    expect(result.summary).toEqual({
      totalSpent: 0,
      totalBudget: 0,
      budgetUtilization: 0,
      overBudgetCategories: 0,
      savingsRate: 0
    })
  })

  it('should calculate over-budget categories correctly', async () => {
    const mockSpendingData = [
      {
        categoryId: 1,
        categoryName: 'Groceries',
        categoryColor: '#10B981',
        monthlyBudget: 500,
        parentCategoryId: null,
        totalSpent: 600, // Over budget
        transactionCount: 20
      },
      {
        categoryId: 2,
        categoryName: 'Entertainment',
        categoryColor: '#8B5CF6',
        monthlyBudget: 100,
        parentCategoryId: null,
        totalSpent: 150, // Over budget
        transactionCount: 5
      },
      {
        categoryId: 3,
        categoryName: 'Transport',
        categoryColor: '#3B82F6',
        monthlyBudget: 200,
        parentCategoryId: null,
        totalSpent: 150, // Under budget
        transactionCount: 8
      }
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockResolvedValue(mockSpendingData)
    }

    mockDb.select.mockReturnValue(mockQuery)

    const result = await categoriesModel.getSpending('current_month')

    expect(result.summary.overBudgetCategories).toBe(2)
    expect(result.categories[0].budgetUtilization).toBe(120) // 600/500 * 100
    expect(result.categories[1].budgetUtilization).toBe(150) // 150/100 * 100
  })

  it('should handle null budget correctly', async () => {
    const mockSpendingData = [
      {
        categoryId: 1,
        categoryName: 'Miscellaneous',
        categoryColor: '#6B7280',
        monthlyBudget: null,
        parentCategoryId: null,
        totalSpent: 200,
        transactionCount: 10
      }
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockResolvedValue(mockSpendingData)
    }

    mockDb.select.mockReturnValue(mockQuery)

    const result = await categoriesModel.getSpending('current_month')

    expect(result.categories[0].budgetUtilization).toBe(0)
    expect(result.summary.totalBudget).toBe(0)
    expect(result.summary.overBudgetCategories).toBe(0) // Null budget doesn't count as over-budget
  })

  it('should sort categories by total spent descending', async () => {
    const mockSpendingData = [
      {
        categoryId: 1,
        categoryName: 'Small',
        categoryColor: '#10B981',
        monthlyBudget: 100,
        parentCategoryId: null,
        totalSpent: 50,
        transactionCount: 5
      },
      {
        categoryId: 2,
        categoryName: 'Medium',
        categoryColor: '#3B82F6',
        monthlyBudget: 200,
        parentCategoryId: null,
        totalSpent: 150,
        transactionCount: 10
      },
      {
        categoryId: 3,
        categoryName: 'Large',
        categoryColor: '#F59E0B',
        monthlyBudget: 500,
        parentCategoryId: null,
        totalSpent: 400,
        transactionCount: 20
      }
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockResolvedValue(mockSpendingData)
    }

    mockDb.select.mockReturnValue(mockQuery)

    const result = await categoriesModel.getSpending('current_month')

    expect(result.categories[0].name).toBe('Large')
    expect(result.categories[1].name).toBe('Medium')
    expect(result.categories[2].name).toBe('Small')
  })
})