/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/transactions/import/route'
import { getDatabase } from '@/db/connection'
import { transactions } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Mock the database
jest.mock('@/db/connection', () => ({
  getDatabase: jest.fn()
}))

describe('POST /api/transactions/import', () => {
  let mockDb: any
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    // Mock console to capture logs
    consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    // Reset all mocks
    jest.clearAllMocks()

    // Create mock database
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]), // No existing transactions by default
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue({ rowCount: 1 })
    }

    ;(getDatabase as jest.Mock).mockReturnValue(mockDb)
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should successfully import new transactions', async () => {
    const testTransactions = [
      {
        date: '2024-01-15',
        description: 'Test Transaction 1',
        amount: -50.00,
        source_id: 1,
        category_id: null,
        unit_id: 1,
        hash: 'hash123',
        source_data: {}
      },
      {
        date: '2024-01-16',
        description: 'Test Transaction 2',
        amount: 100.00,
        source_id: 1,
        category_id: 2,
        unit_id: 1,
        hash: 'hash456',
        source_data: {}
      }
    ]

    const request = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: testTransactions })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.imported).toBe(2)
    expect(data.skipped).toBe(0)
    expect(data.total).toBe(2)

    // Verify insert was called twice
    expect(mockDb.insert).toHaveBeenCalledTimes(2)
    expect(mockDb.values).toHaveBeenCalledTimes(2)

    // Verify the first transaction data
    expect(mockDb.values).toHaveBeenNthCalledWith(1, expect.objectContaining({
      description: 'Test Transaction 1',
      amount: -50.00,
      source_id: 1,
      hash: 'hash123'
    }))
  })

  it('should skip duplicate transactions', async () => {
    // Mock that a transaction already exists
    mockDb.limit = jest.fn().mockResolvedValue([{ id: 1, hash: 'hash123' }])

    const testTransactions = [
      {
        date: '2024-01-15',
        description: 'Duplicate Transaction',
        amount: -50.00,
        source_id: 1,
        hash: 'hash123',
        source_data: {}
      }
    ]

    const request = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: testTransactions })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.imported).toBe(0)
    expect(data.skipped).toBe(1)
    expect(data.total).toBe(1)

    // Verify insert was not called for duplicate
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('should handle invalid transaction data', async () => {
    const request = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: 'not-an-array' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid transaction data')
  })

  it('should continue processing after individual transaction errors', async () => {
    // Make the first insert fail
    mockDb.values = jest.fn()
      .mockRejectedValueOnce(new Error('Database error'))
      .mockResolvedValue({ rowCount: 1 })

    const testTransactions = [
      {
        date: 'invalid-date', // This will cause an error
        description: 'Bad Transaction',
        amount: 'not-a-number',
        source_id: 1,
        hash: 'hash789',
        source_data: {}
      },
      {
        date: '2024-01-17',
        description: 'Good Transaction',
        amount: 75.00,
        source_id: 1,
        hash: 'hash101',
        source_data: {}
      }
    ]

    const request = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: testTransactions })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.imported).toBe(1) // Only the good transaction
    expect(data.errors).toHaveLength(1) // One error recorded
  })

  it('should handle missing required fields gracefully', async () => {
    const testTransactions = [
      {
        // Missing date
        description: 'Missing Date Transaction',
        amount: 50.00,
        source_id: 1,
        hash: 'hash111'
      }
    ]

    const request = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: testTransactions })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    // Even with missing date, it should try to insert with Invalid Date
    expect(mockDb.insert).toHaveBeenCalled()
  })
})