/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/transactions/stats/route'
import { transactionsModel } from '@/db/models/transactions.model'

// Mock the transactions model
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getStats: jest.fn(),
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>

// Mock stats data
const mockStats = {
  totalTransactions: 150,
  totalIncome: 8500.00,
  totalExpenses: 3245.67,
  averageTransaction: 35.03,
  categorizedCount: 120,
  uncategorizedCount: 30,
  ignoredCount: 15
}

describe('/api/transactions/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should fetch stats without filters', async () => {
      mockTransactionsModel.getStats.mockResolvedValue(mockStats)

      const request = new NextRequest('http://localhost:3000/api/transactions/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockStats)
      expect(mockTransactionsModel.getStats).toHaveBeenCalledWith({})
    })

    it('should fetch stats with all filters', async () => {
      mockTransactionsModel.getStats.mockResolvedValue(mockStats)

      const request = new NextRequest('http://localhost:3000/api/transactions/stats?search=GROCERY&unitId=1&sourceId=1&categoryId=1&dateFrom=2024-01-01&dateTo=2024-01-31&amountMin=10&amountMax=1000&tags=groceries,weekly')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockStats)
      expect(mockTransactionsModel.getStats).toHaveBeenCalledWith({
        search: 'GROCERY',
        unitId: 1,
        sourceId: 1,
        categoryId: 1,
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        amountMin: 10,
        amountMax: 1000,
        tags: ['groceries', 'weekly']
      })
    })

    it('should handle individual filters correctly', async () => {
      mockTransactionsModel.getStats.mockResolvedValue(mockStats)

      // Test search filter
      const request1 = new NextRequest('http://localhost:3000/api/transactions/stats?search=TEST')
      await GET(request1)
      expect(mockTransactionsModel.getStats).toHaveBeenLastCalledWith({
        search: 'TEST'
      })

      // Test unitId filter
      const request2 = new NextRequest('http://localhost:3000/api/transactions/stats?unitId=2')
      await GET(request2)
      expect(mockTransactionsModel.getStats).toHaveBeenLastCalledWith({
        unitId: 2
      })

      // Test sourceId filter
      const request3 = new NextRequest('http://localhost:3000/api/transactions/stats?sourceId=3')
      await GET(request3)
      expect(mockTransactionsModel.getStats).toHaveBeenLastCalledWith({
        sourceId: 3
      })

      // Test categoryId filter
      const request4 = new NextRequest('http://localhost:3000/api/transactions/stats?categoryId=4')
      await GET(request4)
      expect(mockTransactionsModel.getStats).toHaveBeenLastCalledWith({
        categoryId: 4
      })
    })

    it('should handle date range filters', async () => {
      mockTransactionsModel.getStats.mockResolvedValue(mockStats)

      const request = new NextRequest('http://localhost:3000/api/transactions/stats?dateFrom=2024-01-01&dateTo=2024-01-31')
      await GET(request)

      expect(mockTransactionsModel.getStats).toHaveBeenCalledWith({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31'
      })
    })

    it('should handle amount range filters', async () => {
      mockTransactionsModel.getStats.mockResolvedValue(mockStats)

      const request = new NextRequest('http://localhost:3000/api/transactions/stats?amountMin=100.50&amountMax=999.99')
      await GET(request)

      expect(mockTransactionsModel.getStats).toHaveBeenCalledWith({
        amountMin: 100.50,
        amountMax: 999.99
      })
    })

    it('should handle tags filter correctly', async () => {
      mockTransactionsModel.getStats.mockResolvedValue(mockStats)

      // Single tag
      const request1 = new NextRequest('http://localhost:3000/api/transactions/stats?tags=groceries')
      await GET(request1)
      expect(mockTransactionsModel.getStats).toHaveBeenLastCalledWith({
        tags: ['groceries']
      })

      // Multiple tags
      const request2 = new NextRequest('http://localhost:3000/api/transactions/stats?tags=groceries,weekly,shopping')
      await GET(request2)
      expect(mockTransactionsModel.getStats).toHaveBeenLastCalledWith({
        tags: ['groceries', 'weekly', 'shopping']
      })

      // Tags with spaces (should be trimmed)
      const request3 = new NextRequest('http://localhost:3000/api/transactions/stats?tags=groceries, weekly , shopping')
      await GET(request3)
      expect(mockTransactionsModel.getStats).toHaveBeenLastCalledWith({
        tags: ['groceries', 'weekly', 'shopping']
      })

      // Empty tags should be filtered out
      const request4 = new NextRequest('http://localhost:3000/api/transactions/stats?tags=groceries,,weekly,')
      await GET(request4)
      expect(mockTransactionsModel.getStats).toHaveBeenLastCalledWith({
        tags: ['groceries', 'weekly']
      })
    })

    it('should handle invalid numeric parameters gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockTransactionsModel.getStats.mockResolvedValue(mockStats)

      const request = new NextRequest('http://localhost:3000/api/transactions/stats?unitId=invalid&amountMin=not-a-number')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
      expect(data.details).toBeDefined()
      expect(mockTransactionsModel.getStats).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should ignore empty string parameters', async () => {
      mockTransactionsModel.getStats.mockResolvedValue(mockStats)

      const request = new NextRequest('http://localhost:3000/api/transactions/stats?search=&unitId=&tags=')
      await GET(request)

      expect(mockTransactionsModel.getStats).toHaveBeenCalledWith({})
    })

    it('should return stats with zero values when no data', async () => {
      const emptyStats = {
        totalTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        averageTransaction: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        ignoredCount: 0
      }
      mockTransactionsModel.getStats.mockResolvedValue(emptyStats)

      const request = new NextRequest('http://localhost:3000/api/transactions/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(emptyStats)
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockTransactionsModel.getStats.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/transactions/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch transaction statistics')
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching transaction stats:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should handle complex filter combinations', async () => {
      mockTransactionsModel.getStats.mockResolvedValue(mockStats)

      const complexFilters = new URLSearchParams({
        search: 'GROCERY STORE',
        unitId: '1',
        sourceId: '2',
        categoryId: '3',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        amountMin: '50.00',
        amountMax: '500.00',
        tags: 'groceries,essential,weekly'
      })

      const request = new NextRequest(`http://localhost:3000/api/transactions/stats?${complexFilters}`)
      await GET(request)

      expect(mockTransactionsModel.getStats).toHaveBeenCalledWith({
        search: 'GROCERY STORE',
        unitId: 1,
        sourceId: 2,
        categoryId: 3,
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        amountMin: 50.00,
        amountMax: 500.00,
        tags: ['groceries', 'essential', 'weekly']
      })
    })
  })
})