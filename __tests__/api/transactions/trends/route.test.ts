/**
 * @jest-environment node
 */
import { GET } from '@/app/api/transactions/trends/route'
import { transactionsModel } from '@/db/models/transactions.model'
import { NextRequest } from 'next/server'

// Mock the transactions model
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getStats: jest.fn()
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>

describe('/api/transactions/trends', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock Date to have consistent test results
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-09-28'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('GET - Monthly Trends', () => {
    it('should return monthly trends for default 12 months', async () => {
      // Setup mock for each month
      mockTransactionsModel.getStats.mockImplementation(async (filters) => ({
        totalTransactions: 50,
        totalIncome: 5000,
        totalExpenses: -3000,
        averageAmount: 40,
        largestIncome: 2000,
        largestExpense: -500,
        categorizedCount: 40,
        uncategorizedCount: 10,
        ignoredCount: 5
      }))

      const request = new NextRequest('http://localhost/api/transactions/trends')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.period).toBe('monthly')
      expect(data.trends).toHaveLength(12)
      expect(data.trends[0].period).toBe('2024-10')
      expect(data.trends[11].period).toBe('2025-09')
      expect(mockTransactionsModel.getStats).toHaveBeenCalledTimes(12)
    })

    it('should handle custom month count parameter', async () => {
      mockTransactionsModel.getStats.mockResolvedValue({
        totalTransactions: 30,
        totalIncome: 3000,
        totalExpenses: -2000,
        averageAmount: 33,
        largestIncome: 1500,
        largestExpense: -400,
        categorizedCount: 25,
        uncategorizedCount: 5,
        ignoredCount: 2
      })

      const request = new NextRequest('http://localhost/api/transactions/trends?months=6')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trends).toHaveLength(6)
      expect(data.trends[0].period).toBe('2025-04')
      expect(data.trends[5].period).toBe('2025-09')
      expect(mockTransactionsModel.getStats).toHaveBeenCalledTimes(6)
    })

    it('should filter by unitId when provided', async () => {
      mockTransactionsModel.getStats.mockResolvedValue({
        totalTransactions: 20,
        totalIncome: 2000,
        totalExpenses: -1500,
        averageAmount: 25,
        largestIncome: 1000,
        largestExpense: -300,
        categorizedCount: 18,
        uncategorizedCount: 2,
        ignoredCount: 1
      })

      const request = new NextRequest('http://localhost/api/transactions/trends?unitId=1&months=3')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockTransactionsModel.getStats).toHaveBeenCalledWith(
        expect.objectContaining({
          unitId: 1,
          showIgnored: false
        })
      )
    })

    it('should filter by categoryId when provided', async () => {
      mockTransactionsModel.getStats.mockResolvedValue({
        totalTransactions: 15,
        totalIncome: 0,
        totalExpenses: -1000,
        averageAmount: -66,
        largestIncome: 0,
        largestExpense: -200,
        categorizedCount: 15,
        uncategorizedCount: 0,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/transactions/trends?categoryId=5&months=3')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockTransactionsModel.getStats).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 5,
          showIgnored: false
        })
      )
    })

    it('should calculate correct summary statistics', async () => {
      // Different values for each month
      const monthlyStats = [
        { income: 5000, expenses: 3000 },
        { income: 4000, expenses: 3500 },
        { income: 6000, expenses: 2500 }
      ]

      let callCount = 0
      mockTransactionsModel.getStats.mockImplementation(async () => ({
        totalTransactions: 50,
        totalIncome: monthlyStats[callCount].income,
        totalExpenses: -monthlyStats[callCount].expenses,
        averageAmount: 40,
        largestIncome: 2000,
        largestExpense: -500,
        categorizedCount: 40,
        uncategorizedCount: 10,
        ignoredCount: 5
      })).mockImplementation(async () => {
        const stats = monthlyStats[callCount] || { income: 0, expenses: 0 }
        callCount++
        return {
          totalTransactions: 50,
          totalIncome: stats.income,
          totalExpenses: -stats.expenses,
          averageAmount: 40,
          largestIncome: 2000,
          largestExpense: -500,
          categorizedCount: 40,
          uncategorizedCount: 10,
          ignoredCount: 5
        }
      })

      const request = new NextRequest('http://localhost/api/transactions/trends?months=3')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary.averageIncome).toBe(5000) // (5000+4000+6000)/3
      expect(data.summary.averageExpenses).toBe(3000) // (3000+3500+2500)/3
      expect(data.summary.averageNet).toBe(2000) // Average of net values
      expect(data.summary.bestPeriod).toBe('2025-09') // 6000-2500 = 3500
      expect(data.summary.worstPeriod).toBe('2025-08') // 4000-3500 = 500
    })
  })

  describe('GET - Yearly Trends', () => {
    it('should return yearly trends for last 5 years', async () => {
      mockTransactionsModel.getStats.mockResolvedValue({
        totalTransactions: 600,
        totalIncome: 60000,
        totalExpenses: -45000,
        averageAmount: 25,
        largestIncome: 5000,
        largestExpense: -2000,
        categorizedCount: 500,
        uncategorizedCount: 100,
        ignoredCount: 50
      })

      const request = new NextRequest('http://localhost/api/transactions/trends?period=yearly')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.period).toBe('yearly')
      expect(data.trends).toHaveLength(5)
      expect(data.trends[0].period).toBe('2021')
      expect(data.trends[4].period).toBe('2025')
      expect(mockTransactionsModel.getStats).toHaveBeenCalledTimes(5)
    })

    it('should handle yearly trends with filters', async () => {
      mockTransactionsModel.getStats.mockResolvedValue({
        totalTransactions: 400,
        totalIncome: 40000,
        totalExpenses: -30000,
        averageAmount: 25,
        largestIncome: 3000,
        largestExpense: -1500,
        categorizedCount: 350,
        uncategorizedCount: 50,
        ignoredCount: 25
      })

      const request = new NextRequest('http://localhost/api/transactions/trends?period=yearly&unitId=2')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockTransactionsModel.getStats).toHaveBeenCalledWith(
        expect.objectContaining({
          unitId: 2,
          showIgnored: false
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid period parameter', async () => {
      const request = new NextRequest('http://localhost/api/transactions/trends?period=invalid')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })

    it('should handle invalid unitId parameter', async () => {
      const request = new NextRequest('http://localhost/api/transactions/trends?unitId=abc')
      const response = await GET(request)

      // Invalid unitId is ignored and treated as undefined
      expect(response.status).toBe(200)
    })

    it('should handle database errors', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockTransactionsModel.getStats.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/transactions/trends')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch transaction trends')

      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should handle months parameter out of range', async () => {
      mockTransactionsModel.getStats.mockResolvedValue({
        totalTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        averageAmount: 0,
        largestIncome: 0,
        largestExpense: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        ignoredCount: 0
      })

      // Should default to 12 months if out of range
      const request = new NextRequest('http://localhost/api/transactions/trends?months=100')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trends).toHaveLength(12)
    })

    it('should handle empty result sets gracefully', async () => {
      mockTransactionsModel.getStats.mockResolvedValue({
        totalTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        averageAmount: 0,
        largestIncome: 0,
        largestExpense: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        ignoredCount: 0
      })

      const request = new NextRequest('http://localhost/api/transactions/trends?months=1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trends).toHaveLength(1)
      expect(data.trends[0].income).toBe(0)
      expect(data.trends[0].expenses).toBe(0)
      expect(data.summary.averageIncome).toBe(0)
      expect(data.summary.averageExpenses).toBe(0)
    })
  })
})