/**
 * @jest-environment node
 */
import { GET } from '@/app/api/dashboard/metrics/route'
import { transactionsModel } from '@/db/models/transactions.model'

jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getStats: jest.fn(),
    getAll: jest.fn()
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>

describe('Dashboard Metrics API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set a fixed date for consistent testing
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-03-15'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('GET /api/dashboard/metrics', () => {
    it('should return dashboard metrics successfully', async () => {
      // Mock overall stats
      const mockOverallStats = {
        totalTransactions: 150,
        totalIncome: 15000,
        totalExpenses: 10000,
        netTotal: 5000,
        avgTransactionAmount: 100
      }

      // Mock monthly stats
      const mockMonthlyStats = {
        totalTransactions: 30,
        totalIncome: 3000,
        totalExpenses: 2000,
        netTotal: 1000,
        avgTransactionAmount: 100
      }

      // Mock recent transactions
      const mockTransactions = [
        {
          id: 1,
          description: 'Salary',
          amount: 3000,
          date: '2025-03-14',
          category: { name: 'Income', color: '#10b981' }
        },
        {
          id: 2,
          description: 'Groceries',
          amount: -150,
          date: '2025-03-13',
          category: { name: 'Food', color: '#ef4444' }
        },
        {
          id: 3,
          description: 'Electric Bill',
          amount: -100,
          date: '2025-03-12',
          category: { name: 'Utilities', color: '#f59e0b' }
        },
        {
          id: 4,
          description: 'Gas',
          amount: -50,
          date: '2025-03-11',
          category: { name: 'Transportation', color: '#3b82f6' }
        },
        {
          id: 5,
          description: 'Restaurant',
          amount: -75,
          date: '2025-03-10',
          category: { name: 'Food', color: '#ef4444' }
        }
      ]

      mockTransactionsModel.getStats
        .mockResolvedValueOnce(mockOverallStats) // Overall stats
        .mockResolvedValueOnce(mockMonthlyStats) // Monthly stats

      mockTransactionsModel.getAll
        .mockResolvedValueOnce({
          data: mockTransactions,
          total: 150,
          page: 1,
          limit: 10
        }) // Recent transactions
        .mockResolvedValueOnce({
          data: mockTransactions.filter(t => t.amount < 0),
          total: 20,
          page: 1,
          limit: 1000
        }) // Transactions for category breakdown

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('accountBalance', 5000)
      expect(data).toHaveProperty('monthlyIncome', 3000)
      expect(data).toHaveProperty('monthlyExpenses', 2000)
      expect(data).toHaveProperty('totalTransactions', 150)
      expect(data).toHaveProperty('recentTransactions')
      expect(data.recentTransactions).toHaveLength(5)
      expect(data).toHaveProperty('categoryBreakdown')

      // Verify correct date range for monthly stats
      expect(mockTransactionsModel.getStats).toHaveBeenNthCalledWith(2, {
        dateFrom: '2025-03-01',
        dateTo: '2025-03-31'
      })

      // Verify recent transactions query
      expect(mockTransactionsModel.getAll).toHaveBeenNthCalledWith(1, 1, 10, 'date', 'desc')
    })

    it('should handle empty data gracefully', async () => {
      const emptyStats = {
        totalTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netTotal: 0,
        avgTransactionAmount: 0
      }

      mockTransactionsModel.getStats.mockResolvedValue(emptyStats)
      mockTransactionsModel.getAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.accountBalance).toBe(0)
      expect(data.monthlyIncome).toBe(0)
      expect(data.monthlyExpenses).toBe(0)
      expect(data.totalTransactions).toBe(0)
      expect(data.recentTransactions).toEqual([])
      expect(data.categoryBreakdown).toEqual([])
    })

    it('should calculate category breakdown correctly', async () => {
      const mockStats = {
        totalTransactions: 10,
        totalIncome: 1000,
        totalExpenses: 500,
        netTotal: 500,
        avgTransactionAmount: 50
      }

      const mockCategoryTransactions = [
        { amount: -200, category: { name: 'Food', color: '#ef4444' } },
        { amount: -150, category: { name: 'Food', color: '#ef4444' } },
        { amount: -100, category: { name: 'Transport', color: '#3b82f6' } },
        { amount: -50, category: { name: 'Entertainment', color: '#8b5cf6' } },
        { amount: 500, category: { name: 'Income', color: '#10b981' } }, // Should be excluded (income)
        { amount: -25, category: null }, // Should be excluded (no category)
      ]

      mockTransactionsModel.getStats.mockResolvedValue(mockStats)
      mockTransactionsModel.getAll
        .mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 10 })
        .mockResolvedValueOnce({
          data: mockCategoryTransactions,
          total: 6,
          page: 1,
          limit: 1000
        })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.categoryBreakdown).toHaveLength(3)
      expect(data.categoryBreakdown[0]).toEqual({
        name: 'Food',
        amount: 350,
        color: '#ef4444'
      })
      expect(data.categoryBreakdown[1]).toEqual({
        name: 'Transport',
        amount: 100,
        color: '#3b82f6'
      })
      expect(data.categoryBreakdown[2]).toEqual({
        name: 'Entertainment',
        amount: 50,
        color: '#8b5cf6'
      })
    })

    it('should limit results to top 5 categories and recent transactions', async () => {
      const mockStats = {
        totalTransactions: 100,
        totalIncome: 10000,
        totalExpenses: 8000,
        netTotal: 2000,
        avgTransactionAmount: 80
      }

      // Create 10 transactions
      const manyTransactions = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        description: `Transaction ${i + 1}`,
        amount: -100,
        date: `2025-03-${15 - i}`,
        category: { name: `Category ${i + 1}`, color: '#000000' }
      }))

      mockTransactionsModel.getStats.mockResolvedValue(mockStats)
      mockTransactionsModel.getAll
        .mockResolvedValueOnce({ data: manyTransactions, total: 10, page: 1, limit: 10 })
        .mockResolvedValueOnce({ data: manyTransactions, total: 10, page: 1, limit: 1000 })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.recentTransactions).toHaveLength(5) // Limited to 5
      expect(data.categoryBreakdown).toHaveLength(5) // Limited to top 5
    })

    it('should handle database errors gracefully', async () => {
      // Silence expected console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockTransactionsModel.getStats.mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch dashboard metrics' })
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching dashboard metrics:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should handle January month boundary correctly', async () => {
      // Test at end of January
      jest.setSystemTime(new Date('2025-01-31'))

      const mockStats = {
        totalTransactions: 10,
        totalIncome: 1000,
        totalExpenses: 500,
        netTotal: 500,
        avgTransactionAmount: 50
      }

      mockTransactionsModel.getStats.mockResolvedValue(mockStats)
      mockTransactionsModel.getAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })

      await GET()

      // Should query January 1-31
      expect(mockTransactionsModel.getStats).toHaveBeenNthCalledWith(2, {
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31'
      })
    })

    it('should handle December month boundary correctly', async () => {
      // Test in December (to verify year boundary handling)
      jest.setSystemTime(new Date('2025-12-15'))

      const mockStats = {
        totalTransactions: 10,
        totalIncome: 1000,
        totalExpenses: 500,
        netTotal: 500,
        avgTransactionAmount: 50
      }

      mockTransactionsModel.getStats.mockResolvedValue(mockStats)
      mockTransactionsModel.getAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })

      await GET()

      // Should query December 1-31
      expect(mockTransactionsModel.getStats).toHaveBeenNthCalledWith(2, {
        dateFrom: '2025-12-01',
        dateTo: '2025-12-31'
      })
    })
  })
})