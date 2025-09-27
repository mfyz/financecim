/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/transactions/[id]/route'
import { transactionsModel } from '@/db/models/transactions.model'

// Mock the transactions model
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>

// Mock transaction data
const mockTransaction = {
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
}

const mockRouteParams = { params: Promise.resolve({ id: '1' }) }

describe('/api/transactions/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should fetch transaction by valid ID', async () => {
      mockTransactionsModel.getById.mockResolvedValue(mockTransaction)

      const request = new NextRequest('http://localhost:3000/api/transactions/1')
      const response = await GET(request, mockRouteParams)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockTransaction)
      expect(mockTransactionsModel.getById).toHaveBeenCalledWith(1)
    })

    it('should return 404 for non-existent transaction', async () => {
      mockTransactionsModel.getById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/transactions/999')
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Transaction not found')
      expect(mockTransactionsModel.getById).toHaveBeenCalledWith(999)
    })

    it('should return 400 for invalid ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/invalid')
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid transaction ID')
      expect(mockTransactionsModel.getById).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockTransactionsModel.getById.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/transactions/1')
      const response = await GET(request, mockRouteParams)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch transaction')
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching transaction:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('PUT', () => {
    const validUpdateData = {
      unitId: 2,
      categoryId: 2,
      amount: -150.00,
      notes: 'Updated notes'
    }

    it('should update transaction with valid data', async () => {
      const updatedTransaction = { ...mockTransaction, ...validUpdateData }
      mockTransactionsModel.update.mockResolvedValue(updatedTransaction)

      const request = new NextRequest('http://localhost:3000/api/transactions/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUpdateData)
      })

      const response = await PUT(request, mockRouteParams)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedTransaction)
      expect(mockTransactionsModel.update).toHaveBeenCalledWith(1, validUpdateData)
    })

    it('should update transaction with partial data', async () => {
      const partialUpdate = { notes: 'Just updating notes' }
      const updatedTransaction = { ...mockTransaction, ...partialUpdate }
      mockTransactionsModel.update.mockResolvedValue(updatedTransaction)

      const request = new NextRequest('http://localhost:3000/api/transactions/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialUpdate)
      })

      const response = await PUT(request, mockRouteParams)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedTransaction)
      expect(mockTransactionsModel.update).toHaveBeenCalledWith(1, partialUpdate)
    })

    it('should return 400 for invalid ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/invalid', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUpdateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid transaction ID')
      expect(mockTransactionsModel.update).not.toHaveBeenCalled()
    })

    it('should return 400 for validation errors', async () => {
      const invalidData = {
        sourceId: 'invalid', // should be number
        description: '', // should be non-empty
        amount: 'invalid' // should be number
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await PUT(request, mockRouteParams)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
      expect(mockTransactionsModel.update).not.toHaveBeenCalled()
    })

    it('should return 400 for description too long', async () => {
      const invalidData = {
        description: 'A'.repeat(501) // exceeds max length
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await PUT(request, mockRouteParams)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(mockTransactionsModel.update).not.toHaveBeenCalled()
    })

    it('should return 404 for non-existent transaction', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockTransactionsModel.update.mockRejectedValue(new Error('Transaction not found'))

      const request = new NextRequest('http://localhost:3000/api/transactions/999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUpdateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Transaction not found')
      
      consoleSpy.mockRestore()
    })

    it('should handle foreign key constraint errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const foreignKeyError = new Error('FOREIGN KEY constraint failed')
      mockTransactionsModel.update.mockRejectedValue(foreignKeyError)

      const request = new NextRequest('http://localhost:3000/api/transactions/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUpdateData)
      })

      const response = await PUT(request, mockRouteParams)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid source, unit, or category reference')
      
      consoleSpy.mockRestore()
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockTransactionsModel.update.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/transactions/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUpdateData)
      })

      const response = await PUT(request, mockRouteParams)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update transaction')
      
      consoleSpy.mockRestore()
    })
  })

  describe('DELETE', () => {
    it('should delete existing transaction', async () => {
      mockTransactionsModel.delete.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/transactions/1', {
        method: 'DELETE'
      })

      const response = await DELETE(request, mockRouteParams)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Transaction deleted successfully')
      expect(mockTransactionsModel.delete).toHaveBeenCalledWith(1)
    })

    it('should return 400 for invalid ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/invalid', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid transaction ID')
      expect(mockTransactionsModel.delete).not.toHaveBeenCalled()
    })

    it('should return 404 for non-existent transaction', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockTransactionsModel.delete.mockRejectedValue(new Error('Transaction not found'))

      const request = new NextRequest('http://localhost:3000/api/transactions/999', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Transaction not found')
      expect(mockTransactionsModel.delete).toHaveBeenCalledWith(999)
      
      consoleSpy.mockRestore()
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockTransactionsModel.delete.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/transactions/1', {
        method: 'DELETE'
      })

      const response = await DELETE(request, mockRouteParams)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete transaction')
      
      consoleSpy.mockRestore()
    })
  })
})