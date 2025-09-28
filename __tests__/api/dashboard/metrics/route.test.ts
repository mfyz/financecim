/**
 * @jest-environment node
 */

import { GET } from '@/app/api/dashboard/metrics/route'
import { transactionsModel } from '@/db/models/transactions.model'

// Mock the transactions model
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getStats: jest.fn(),
    getAll: jest.fn(),
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>

describe('/api/dashboard/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns aggregated dashboard metrics', async () => {
    // Mock overall and monthly stats
    mockTransactionsModel.getStats
      .mockResolvedValueOnce({
        totalIncome: 5000,
        totalExpenses: 3200,
        totalTransactions: 120,
      } as any)
      .mockResolvedValueOnce({
        totalIncome: 3000,
        totalExpenses: 1500,
        totalTransactions: 40,
      } as any)

    // Mock recent transactions for category breakdown and recent list
    mockTransactionsModel.getAll.mockResolvedValue({
      data: [
        {
          id: 1,
          date: '2024-01-10',
          description: 'Coffee',
          amount: -4.5,
          category: { id: 10, name: 'Food & Drink', color: '#ff0000' },
        },
        {
          id: 2,
          date: '2024-01-12',
          description: 'Salary',
          amount: 3000,
          category: null,
        },
      ],
      total: 2,
      totalPages: 1,
    })

    const response = await GET()
    const data = await response.json()

    // Basic shape and derived values
    expect(response.status).toBe(200)
    expect(data.accountBalance).toBe(5000 - 3200)
    expect(data.monthlyIncome).toBe(3000)
    expect(data.monthlyExpenses).toBe(1500)
    expect(data.totalTransactions).toBe(120)

    // Recent transactions slice and stats forwarding
    expect(Array.isArray(data.recentTransactions)).toBe(true)
    expect(data.recentTransactions.length).toBeLessThanOrEqual(5)
    expect(data.stats.overall.totalIncome).toBe(5000)
    expect(data.stats.monthly.totalExpenses).toBe(1500)

    // Category breakdown derived from expenses only
    expect(Array.isArray(data.categoryBreakdown)).toBe(true)
    if (data.categoryBreakdown.length > 0) {
      expect(data.categoryBreakdown[0]).toHaveProperty('name')
      expect(data.categoryBreakdown[0]).toHaveProperty('amount')
      expect(data.categoryBreakdown[0]).toHaveProperty('color')
    }

    // Ensure model calls were made
    expect(mockTransactionsModel.getStats).toHaveBeenCalledTimes(2)
    expect(mockTransactionsModel.getAll).toHaveBeenCalled()
  })

  it('handles errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockTransactionsModel.getStats.mockRejectedValue(new Error('DB error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch dashboard metrics' })
    consoleSpy.mockRestore()
  })
})

