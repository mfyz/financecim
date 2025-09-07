/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/transactions/route'
import { transactionsModel } from '@/db/models/transactions.model'

// Mock the transactions model
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getAll: jest.fn(),
    create: jest.fn(),
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>

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
    updatedAt: '2024-01-20T10:00:00Z',
    unit: { id: 1, name: 'Test Personal', color: '#3B82F6' },
    source: { id: 1, name: 'Test Bank', type: 'bank' },
    category: { id: 1, name: 'Test Groceries', color: '#10B981' }
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
    updatedAt: '2024-01-19T09:00:00Z',
    unit: { id: 2, name: 'Test Business', color: '#F59E0B' },
    source: { id: 1, name: 'Test Bank', type: 'bank' },
    category: null
  }
]

const mockTransactionsResponse = {
  data: mockTransactions,
  total: 2,
  totalPages: 1
}

describe('/api/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should fetch transactions with default parameters', async () => {
      mockTransactionsModel.getAll.mockResolvedValue(mockTransactionsResponse)

      const request = new NextRequest('http://localhost:3000/api/transactions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockTransactionsResponse)
      expect(mockTransactionsModel.getAll).toHaveBeenCalledWith(
        1, // page
        50, // limit
        'date', // sortBy
        'desc', // sortOrder
        {} // filters
      )
    })

    it('should fetch transactions with query parameters', async () => {
      mockTransactionsModel.getAll.mockResolvedValue(mockTransactionsResponse)

      const request = new NextRequest('http://localhost:3000/api/transactions?page=2&limit=25&sortBy=amount&sortOrder=asc&search=GROCERY&unitId=1&sourceId=1&categoryId=1&dateFrom=2024-01-01&dateTo=2024-01-31&amountMin=100&amountMax=1000&showIgnored=true&tags=groceries,weekly')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockTransactionsModel.getAll).toHaveBeenCalledWith(
        2, // page
        25, // limit
        'amount', // sortBy
        'asc', // sortOrder
        {
          search: 'GROCERY',
          unitId: 1,
          sourceId: 1,
          categoryId: 1,
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31',
          amountMin: 100,
          amountMax: 1000,
          showIgnored: true,
          tags: ['groceries', 'weekly']
        }
      )
    })

    it('should handle showIgnored parameter correctly', async () => {
      mockTransactionsModel.getAll.mockResolvedValue(mockTransactionsResponse)

      // Test showIgnored=false
      const request1 = new NextRequest('http://localhost:3000/api/transactions?showIgnored=false')
      await GET(request1)
      expect(mockTransactionsModel.getAll).toHaveBeenLastCalledWith(
        1, 50, 'date', 'desc',
        { showIgnored: false }
      )

      // Test showIgnored=true
      const request2 = new NextRequest('http://localhost:3000/api/transactions?showIgnored=true')
      await GET(request2)
      expect(mockTransactionsModel.getAll).toHaveBeenLastCalledWith(
        1, 50, 'date', 'desc',
        { showIgnored: true }
      )

      // Test no showIgnored parameter
      const request3 = new NextRequest('http://localhost:3000/api/transactions')
      await GET(request3)
      expect(mockTransactionsModel.getAll).toHaveBeenLastCalledWith(
        1, 50, 'date', 'desc',
        {}
      )
    })

    it('should limit page size to maximum of 200', async () => {
      mockTransactionsModel.getAll.mockResolvedValue(mockTransactionsResponse)

      const request = new NextRequest('http://localhost:3000/api/transactions?limit=500')
      await GET(request)

      expect(mockTransactionsModel.getAll).toHaveBeenCalledWith(
        1, 200, 'date', 'desc', {}
      )
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockTransactionsModel.getAll.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/transactions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch transactions' })
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching transactions:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('POST', () => {
    const validTransactionData = {
      sourceId: 1,
      unitId: 1,
      date: '2024-01-20',
      description: 'TEST NEW TRANSACTION',
      amount: -99.99,
      sourceCategory: 'Shopping',
      categoryId: 1,
      ignore: false,
      notes: 'Test note',
      tags: 'test,new'
    }

    it('should create transaction with valid data', async () => {
      const newTransaction = { ...mockTransactions[0], id: 3 }
      mockTransactionsModel.create.mockResolvedValue(newTransaction)

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validTransactionData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(newTransaction)
      expect(mockTransactionsModel.create).toHaveBeenCalledWith(validTransactionData)
    })

    it('should create transaction with minimal required fields', async () => {
      const minimalData = {
        sourceId: 1,
        date: '2024-01-20',
        description: 'TEST MINIMAL TRANSACTION',
        amount: -25.00
      }
      const newTransaction = { ...mockTransactions[0], ...minimalData, id: 3 }
      mockTransactionsModel.create.mockResolvedValue(newTransaction)

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(newTransaction)
      expect(mockTransactionsModel.create).toHaveBeenCalledWith({
        ...minimalData,
        ignore: false // default value
      })
    })

    it('should return 400 for invalid data - missing required fields', async () => {
      const invalidData = {
        sourceId: 1,
        // missing date, description, amount
      }

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
      expect(mockTransactionsModel.create).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid data types', async () => {
      const invalidData = {
        sourceId: 'invalid', // should be number
        date: '2024-01-20',
        description: 'TEST TRANSACTION',
        amount: 'invalid' // should be number
      }

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
      expect(mockTransactionsModel.create).not.toHaveBeenCalled()
    })

    it('should return 400 for description too long', async () => {
      const invalidData = {
        sourceId: 1,
        date: '2024-01-20',
        description: 'A'.repeat(501), // exceeds max length of 500
        amount: -99.99
      }

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(mockTransactionsModel.create).not.toHaveBeenCalled()
    })

    it('should handle foreign key constraint errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const foreignKeyError = new Error('FOREIGN KEY constraint failed')
      mockTransactionsModel.create.mockRejectedValue(foreignKeyError)

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validTransactionData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid source, unit, or category reference')
      
      consoleSpy.mockRestore()
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockTransactionsModel.create.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validTransactionData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create transaction')
      
      consoleSpy.mockRestore()
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})