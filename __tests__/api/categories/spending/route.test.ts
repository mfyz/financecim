/**
 * @jest-environment node
 */
import { GET } from '@/app/api/categories/spending/route'
import { transactionsModel } from '@/db/models/transactions.model'
import { categoriesModel } from '@/db/models/categories.model'
import { NextRequest } from 'next/server'

// Mock the models
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getAll: jest.fn(),
    getStats: jest.fn()
  }
}))

jest.mock('@/db/models/categories.model', () => ({
  categoriesModel: {
    getAllFlat: jest.fn()
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>
const mockCategoriesModel = categoriesModel as jest.Mocked<typeof categoriesModel>

describe('/api/categories/spending', () => {
  const mockCategories = [
    { id: 1, name: 'Groceries', color: '#10b981', parentCategoryId: null, monthlyBudget: 500 },
    { id: 2, name: 'Transportation', color: '#3b82f6', parentCategoryId: null, monthlyBudget: 200 },
    { id: 3, name: 'Entertainment', color: '#f59e0b', parentCategoryId: null, monthlyBudget: 150 },
    { id: 4, name: 'Utilities', color: '#ef4444', parentCategoryId: null, monthlyBudget: null }
  ]

  const mockCategoriesWithChildren = [
    { id: 1, name: 'Food', color: '#10b981', parentCategoryId: null, monthlyBudget: 600 },
    { id: 2, name: 'Groceries', color: '#10b981', parentCategoryId: 1, monthlyBudget: null },
    { id: 3, name: 'Restaurants', color: '#10b981', parentCategoryId: 1, monthlyBudget: null },
    { id: 4, name: 'Transportation', color: '#3b82f6', parentCategoryId: null, monthlyBudget: 300 },
    { id: 5, name: 'Gas', color: '#3b82f6', parentCategoryId: 4, monthlyBudget: null },
    { id: 6, name: 'Parking', color: '#3b82f6', parentCategoryId: 4, monthlyBudget: null }
  ]

  const mockTransactions = {
    data: [
      {
        id: 1,
        description: 'Grocery Store',
        amount: -120.50,
        categoryId: 1,
        date: '2025-09-15'
      },
      {
        id: 2,
        description: 'Gas Station',
        amount: -45.00,
        categoryId: 2,
        date: '2025-09-16'
      },
      {
        id: 3,
        description: 'Movie Theater',
        amount: -25.00,
        categoryId: 3,
        date: '2025-09-17'
      },
      {
        id: 4,
        description: 'Grocery Store 2',
        amount: -80.00,
        categoryId: 1,
        date: '2025-09-18'
      },
      {
        id: 5,
        description: 'Salary',
        amount: 3000.00,
        categoryId: null,
        date: '2025-09-01'
      },
      {
        id: 6,
        description: 'Unknown Expense',
        amount: -50.00,
        categoryId: null,
        date: '2025-09-20'
      }
    ],
    total: 6
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-09-28'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('GET - Current Month Analysis', () => {
    it('should return category spending for current month', async () => {
      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategories)
      mockTransactionsModel.getAll.mockResolvedValue(mockTransactions)
      mockTransactionsModel.getStats.mockResolvedValue({
        totalTransactions: 6,
        totalIncome: 3000,
        totalExpenses: -320.50,
        averageAmount: 450,
        largestIncome: 3000,
        largestExpense: -120.50,
        categorizedCount: 4,
        uncategorizedCount: 2,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/categories/spending')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.period.type).toBe('current_month')
      expect(data.summary.totalExpenses).toBe(320.50)
      expect(data.summary.uncategorizedSpending).toBe(50)
      expect(data.categories).toHaveLength(3) // Only categories with spending
      expect(data.topCategories).toHaveLength(3)
      expect(data.categories[0].categoryName).toBe('Groceries')
      expect(data.categories[0].totalSpent).toBe(200.50)
      expect(data.categories[0].transactionCount).toBe(2)
    })

    it('should calculate budget utilization correctly', async () => {
      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategories)
      mockTransactionsModel.getAll.mockResolvedValue(mockTransactions)
      mockTransactionsModel.getStats.mockResolvedValue({
        totalIncome: 3000,
        totalExpenses: -320.50,
        totalTransactions: 6,
        averageAmount: 450,
        largestIncome: 3000,
        largestExpense: -120.50,
        categorizedCount: 4,
        uncategorizedCount: 2,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/categories/spending')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const groceriesCategory = data.categories.find((c: any) => c.categoryId === 1)
      expect(groceriesCategory.monthlyBudget).toBe(500)
      expect(groceriesCategory.totalSpent).toBe(200.50)
      expect(groceriesCategory.budgetUtilization).toBeCloseTo(40.1, 1)
      expect(groceriesCategory.overBudget).toBe(false)
    })

    it('should identify over-budget categories', async () => {
      const transactionsWithOverspend = {
        ...mockTransactions,
        data: [
          ...mockTransactions.data,
          { id: 7, description: 'Extra Entertainment', amount: -200, categoryId: 3, date: '2025-09-25' }
        ]
      }

      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategories)
      mockTransactionsModel.getAll.mockResolvedValue(transactionsWithOverspend)
      mockTransactionsModel.getStats.mockResolvedValue({
        totalIncome: 3000,
        totalExpenses: -520.50,
        totalTransactions: 7,
        averageAmount: 350,
        largestIncome: 3000,
        largestExpense: -200,
        categorizedCount: 5,
        uncategorizedCount: 2,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/categories/spending')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const entertainmentCategory = data.categories.find((c: any) => c.categoryId === 3)
      expect(entertainmentCategory.totalSpent).toBe(225)
      expect(entertainmentCategory.monthlyBudget).toBe(150)
      // 225 spent / 150 budget = 150% utilization
      expect(entertainmentCategory.budgetUtilization).toBeCloseTo(150, 1)
      expect(entertainmentCategory.overBudget).toBe(true)
      expect(data.budgetAnalysis.overBudgetCategories).toHaveLength(1)
    })
  })

  describe('GET - Different Time Periods', () => {
    it('should handle last_month period', async () => {
      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategories)
      mockTransactionsModel.getAll.mockResolvedValue({ data: [], total: 0 })
      mockTransactionsModel.getStats.mockResolvedValue({
        totalIncome: 0,
        totalExpenses: 0,
        totalTransactions: 0,
        averageAmount: 0,
        largestIncome: 0,
        largestExpense: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/categories/spending?period=last_month')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.period.type).toBe('last_month')
      expect(data.period.dateFrom).toBe('2025-08-01')
      expect(data.period.dateTo).toBe('2025-08-31')
    })

    it('should handle year_to_date period', async () => {
      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategories)
      mockTransactionsModel.getAll.mockResolvedValue({ data: [], total: 0 })
      mockTransactionsModel.getStats.mockResolvedValue({
        totalIncome: 0,
        totalExpenses: 0,
        totalTransactions: 0,
        averageAmount: 0,
        largestIncome: 0,
        largestExpense: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/categories/spending?period=year_to_date')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.period.type).toBe('year_to_date')
      expect(data.period.dateFrom).toBe('2025-01-01')
      expect(data.period.dateTo).toBe('2025-09-30')
    })

    it('should handle last_3_months period', async () => {
      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategories)
      mockTransactionsModel.getAll.mockResolvedValue({ data: [], total: 0 })
      mockTransactionsModel.getStats.mockResolvedValue({
        totalIncome: 0,
        totalExpenses: 0,
        totalTransactions: 0,
        averageAmount: 0,
        largestIncome: 0,
        largestExpense: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/categories/spending?period=last_3_months')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.period.type).toBe('last_3_months')
      expect(data.period.dateFrom).toBe('2025-07-01')
      expect(data.period.dateTo).toBe('2025-09-30')
    })

    it('should handle last_6_months period', async () => {
      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategories)
      mockTransactionsModel.getAll.mockResolvedValue({ data: [], total: 0 })
      mockTransactionsModel.getStats.mockResolvedValue({
        totalIncome: 0,
        totalExpenses: 0,
        totalTransactions: 0,
        averageAmount: 0,
        largestIncome: 0,
        largestExpense: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/categories/spending?period=last_6_months')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.period.type).toBe('last_6_months')
      expect(data.period.dateFrom).toBe('2025-04-01')
      expect(data.period.dateTo).toBe('2025-09-30')
    })

    it('should handle custom period with dates', async () => {
      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategories)
      mockTransactionsModel.getAll.mockResolvedValue({ data: [], total: 0 })
      mockTransactionsModel.getStats.mockResolvedValue({
        totalIncome: 0,
        totalExpenses: 0,
        totalTransactions: 0,
        averageAmount: 0,
        largestIncome: 0,
        largestExpense: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        ignoredCount: 0
      })

      const request = new NextRequest(
        'http://localhost/api/categories/spending?period=custom&dateFrom=2025-06-01&dateTo=2025-06-30'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.period.type).toBe('custom')
      expect(data.period.dateFrom).toBe('2025-06-01')
      expect(data.period.dateTo).toBe('2025-06-30')
    })

    it('should error on custom period without dates', async () => {
      const request = new NextRequest('http://localhost/api/categories/spending?period=custom')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Custom period requires')
    })
  })

  describe('GET - Filtering Options', () => {
    it('should filter by unitId', async () => {
      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategories)
      mockTransactionsModel.getAll.mockResolvedValue({ data: [], total: 0 })
      mockTransactionsModel.getStats.mockResolvedValue({
        totalIncome: 0,
        totalExpenses: 0,
        totalTransactions: 0,
        averageAmount: 0,
        largestIncome: 0,
        largestExpense: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/categories/spending?unitId=2')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockTransactionsModel.getAll).toHaveBeenCalledWith(
        1,
        10000,
        'date',
        'desc',
        expect.objectContaining({
          unitId: 2,
          showIgnored: false
        })
      )
    })

    it('should respect limit parameter', async () => {
      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategories)
      mockTransactionsModel.getAll.mockResolvedValue(mockTransactions)
      mockTransactionsModel.getStats.mockResolvedValue({
        totalIncome: 3000,
        totalExpenses: -320.50,
        totalTransactions: 6,
        averageAmount: 450,
        largestIncome: 3000,
        largestExpense: -120.50,
        categorizedCount: 4,
        uncategorizedCount: 2,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/categories/spending?limit=2')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.categories).toHaveLength(2)
      expect(data.topCategories).toHaveLength(2)
    })
  })

  describe('GET - Savings Rate Calculation', () => {
    it('should calculate correct savings rate', async () => {
      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategories)
      mockTransactionsModel.getAll.mockResolvedValue(mockTransactions)
      mockTransactionsModel.getStats.mockResolvedValue({
        totalIncome: 3000,
        totalExpenses: -320.50,
        totalTransactions: 6,
        averageAmount: 450,
        largestIncome: 3000,
        largestExpense: -120.50,
        categorizedCount: 4,
        uncategorizedCount: 2,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/categories/spending')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary.totalIncome).toBe(3000)
      expect(data.summary.totalExpenses).toBe(320.50)
      // Savings rate = (3000 - 320.50) / 3000 * 100 = 89.35%
      expect(data.summary.savingsRate).toBeCloseTo(89.35, 1)
    })

    it('should handle zero income correctly', async () => {
      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategories)
      mockTransactionsModel.getAll.mockResolvedValue({
        data: mockTransactions.data.filter(t => t.amount < 0),
        total: 5
      })
      mockTransactionsModel.getStats.mockResolvedValue({
        totalIncome: 0,
        totalExpenses: -320.50,
        totalTransactions: 5,
        averageAmount: -64.10,
        largestIncome: 0,
        largestExpense: -120.50,
        categorizedCount: 4,
        uncategorizedCount: 1,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/categories/spending')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary.savingsRate).toBe(0)
    })
  })

  describe('GET - Parent-Child Category Relationships', () => {
    it('should aggregate child category spending to parent categories', async () => {
      const mockTransactionsWithChildren = {
        data: [
          { id: 1, description: 'Grocery Store', amount: -150, categoryId: 2, date: '2025-09-15' },
          { id: 2, description: 'Restaurant', amount: -75, categoryId: 3, date: '2025-09-16' },
          { id: 3, description: 'Gas Station', amount: -60, categoryId: 5, date: '2025-09-17' },
          { id: 4, description: 'Parking Garage', amount: -20, categoryId: 6, date: '2025-09-18' },
          { id: 5, description: 'Salary', amount: 4000, categoryId: null, date: '2025-09-01' }
        ],
        total: 5
      }

      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategoriesWithChildren)
      mockTransactionsModel.getAll.mockResolvedValue(mockTransactionsWithChildren)
      mockTransactionsModel.getStats.mockResolvedValue({
        totalIncome: 4000,
        totalExpenses: -305,
        totalTransactions: 5,
        averageAmount: 739,
        largestIncome: 4000,
        largestExpense: -150,
        categorizedCount: 4,
        uncategorizedCount: 1,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/categories/spending')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Find the aggregated parent categories
      const foodCategory = data.categories.find((c: any) => c.categoryId === 1)
      const transportationCategory = data.categories.find((c: any) => c.categoryId === 4)

      // Food parent should aggregate Groceries + Restaurants
      expect(foodCategory).toBeDefined()
      expect(foodCategory.categoryName).toBe('Food')
      expect(foodCategory.totalSpent).toBe(225) // 150 + 75
      expect(foodCategory.transactionCount).toBe(2)
      expect(foodCategory.monthlyBudget).toBe(600)
      if (foodCategory.budgetUtilization !== null) {
        expect(foodCategory.budgetUtilization).toBeCloseTo(37.5, 1) // 225/600 * 100
      }

      // Transportation parent should aggregate Gas + Parking
      expect(transportationCategory).toBeDefined()
      expect(transportationCategory.categoryName).toBe('Transportation')
      expect(transportationCategory.totalSpent).toBe(80) // 60 + 20
      expect(transportationCategory.transactionCount).toBe(2)
      expect(transportationCategory.monthlyBudget).toBe(300)
      if (transportationCategory.budgetUtilization !== null) {
        expect(transportationCategory.budgetUtilization).toBeCloseTo(26.67, 1) // 80/300 * 100
      }

      // Child categories should also be present in the output
      const groceriesCategory = data.categories.find((c: any) => c.categoryId === 2)
      if (groceriesCategory) {
        expect(groceriesCategory.totalSpent).toBe(150)
        expect(groceriesCategory.parentCategoryId).toBe(1)
      }
    })

    it('should handle child categories without parent budget correctly', async () => {
      const categoriesWithoutParentBudget = [
        { id: 1, name: 'Food', color: '#10b981', parentCategoryId: null, monthlyBudget: null },
        { id: 2, name: 'Groceries', color: '#10b981', parentCategoryId: 1, monthlyBudget: 400 },
        { id: 3, name: 'Restaurants', color: '#10b981', parentCategoryId: 1, monthlyBudget: 200 }
      ]

      const mockTransactionsWithChildren = {
        data: [
          { id: 1, description: 'Grocery Store', amount: -150, categoryId: 2, date: '2025-09-15' },
          { id: 2, description: 'Restaurant', amount: -75, categoryId: 3, date: '2025-09-16' }
        ],
        total: 2
      }

      mockCategoriesModel.getAllFlat.mockResolvedValue(categoriesWithoutParentBudget)
      mockTransactionsModel.getAll.mockResolvedValue(mockTransactionsWithChildren)
      mockTransactionsModel.getStats.mockResolvedValue({
        totalIncome: 0,
        totalExpenses: -225,
        totalTransactions: 2,
        averageAmount: -112.5,
        largestIncome: 0,
        largestExpense: -150,
        categorizedCount: 2,
        uncategorizedCount: 0,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/categories/spending')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const foodCategory = data.categories.find((c: any) => c.categoryId === 1)
      expect(foodCategory).toBeDefined()
      expect(foodCategory.totalSpent).toBe(225)
      expect(foodCategory.monthlyBudget).toBe(null)
      expect(foodCategory.budgetUtilization).toBe(null)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors for categories', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockCategoriesModel.getAllFlat.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/categories/spending')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch category spending analysis')

      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should handle database errors for transactions', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockCategoriesModel.getAllFlat.mockResolvedValue(mockCategories)
      mockTransactionsModel.getAll.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/categories/spending')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch category spending analysis')

      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should handle invalid period parameter', async () => {
      const request = new NextRequest('http://localhost/api/categories/spending?period=invalid')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })
  })
})