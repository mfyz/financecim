/**
 * @jest-environment node
 */

import { transactionsModel } from '@/db/models/transactions.model'
import { getDatabase } from '@/db/connection'

// Mock the database connection
jest.mock('@/db/connection', () => ({
  getDatabase: jest.fn()
}))

describe('transactionsModel.getTrends', () => {
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

  it('should get monthly transaction trends', async () => {
    const mockTrendsData = [
      {
        period: '2024-01',
        income: 5000,
        expenses: 3500,
        transactionCount: 45
      },
      {
        period: '2024-02',
        income: 5200,
        expenses: 3200,
        transactionCount: 42
      }
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue(mockTrendsData),
      where: jest.fn().mockReturnThis()
    }

    mockDb.select.mockReturnValue(mockQuery)

    const result = await transactionsModel.getTrends('monthly')

    expect(result.period).toBe('monthly')
    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toEqual({
      period: '2024-01',
      income: 5000,
      expenses: 3500,
      net: 1500,
      transactionCount: 45
    })
    expect(result.summary.totalIncome).toBe(10200)
    expect(result.summary.totalExpenses).toBe(6700)
    expect(result.summary.totalNet).toBe(3500)
    expect(result.summary.bestPeriod).toEqual({ period: '2024-02', value: 2000 })
    expect(result.summary.worstPeriod).toEqual({ period: '2024-01', value: 1500 })
  })

  it('should get yearly transaction trends', async () => {
    const mockTrendsData = [
      {
        period: '2023',
        income: 60000,
        expenses: 45000,
        transactionCount: 500
      },
      {
        period: '2024',
        income: 65000,
        expenses: 48000,
        transactionCount: 520
      }
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue(mockTrendsData),
      where: jest.fn().mockReturnThis()
    }

    mockDb.select.mockReturnValue(mockQuery)

    const result = await transactionsModel.getTrends('yearly')

    expect(result.period).toBe('yearly')
    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toEqual({
      period: '2023',
      income: 60000,
      expenses: 45000,
      net: 15000,
      transactionCount: 500
    })
    expect(result.summary.totalIncome).toBe(125000)
    expect(result.summary.totalExpenses).toBe(93000)
    expect(result.summary.totalNet).toBe(32000)
    expect(result.summary.bestPeriod).toEqual({ period: '2024', value: 17000 })
    expect(result.summary.worstPeriod).toEqual({ period: '2023', value: 15000 })
  })

  it('should filter by unitId when provided', async () => {
    const mockTrendsData = [
      {
        period: '2024-01',
        income: 2000,
        expenses: 1500,
        transactionCount: 20
      }
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(mockTrendsData)
    }

    mockDb.select.mockReturnValue(mockQuery)

    const result = await transactionsModel.getTrends('monthly', 1)

    expect(result.data).toHaveLength(1)
    expect(result.summary.totalIncome).toBe(2000)
    expect(result.summary.totalExpenses).toBe(1500)
    expect(mockQuery.where).toHaveBeenCalled()
  })

  it('should filter by categoryId when provided', async () => {
    const mockTrendsData = [
      {
        period: '2024-01',
        income: 0,
        expenses: 500,
        transactionCount: 10
      }
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(mockTrendsData)
    }

    mockDb.select.mockReturnValue(mockQuery)

    const result = await transactionsModel.getTrends('monthly', undefined, 5)

    expect(result.data).toHaveLength(1)
    expect(result.data[0].expenses).toBe(500)
    expect(result.summary.totalExpenses).toBe(500)
    expect(mockQuery.where).toHaveBeenCalled()
  })

  it('should handle empty data gracefully', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([]),
      where: jest.fn().mockReturnThis()
    }

    mockDb.select.mockReturnValue(mockQuery)

    const result = await transactionsModel.getTrends('monthly')

    expect(result.data).toEqual([])
    expect(result.summary).toEqual({
      totalIncome: 0,
      totalExpenses: 0,
      totalNet: 0,
      bestPeriod: null,
      worstPeriod: null
    })
  })

  it('should handle missing values in data', async () => {
    const mockTrendsData = [
      {
        period: null,
        income: null,
        expenses: null,
        transactionCount: null
      }
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue(mockTrendsData),
      where: jest.fn().mockReturnThis()
    }

    mockDb.select.mockReturnValue(mockQuery)

    const result = await transactionsModel.getTrends('monthly')

    expect(result.data[0]).toEqual({
      period: '',
      income: 0,
      expenses: 0,
      net: 0,
      transactionCount: 0
    })
  })

  it('should calculate correct best and worst periods', async () => {
    const mockTrendsData = [
      { period: '2024-01', income: 1000, expenses: 2000, transactionCount: 10 }, // net: -1000
      { period: '2024-02', income: 3000, expenses: 1000, transactionCount: 15 }, // net: 2000
      { period: '2024-03', income: 2000, expenses: 1500, transactionCount: 12 }  // net: 500
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue(mockTrendsData),
      where: jest.fn().mockReturnThis()
    }

    mockDb.select.mockReturnValue(mockQuery)

    const result = await transactionsModel.getTrends('monthly')

    expect(result.summary.bestPeriod).toEqual({ period: '2024-02', value: 2000 })
    expect(result.summary.worstPeriod).toEqual({ period: '2024-01', value: -1000 })
  })
})