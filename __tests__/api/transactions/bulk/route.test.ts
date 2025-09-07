/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { PUT, DELETE } from '@/app/api/transactions/bulk/route'
import { transactionsModel } from '@/db/models/transactions.model'

// Mock the transactions model
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    bulkUpdate: jest.fn(),
    bulkDelete: jest.fn(),
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>

describe('/api/transactions/bulk', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PUT (bulk update)', () => {
    const validBulkUpdateData = {
      ids: [1, 2, 3],
      data: {
        unitId: 2,
        categoryId: 1,
        ignore: true
      }
    }

    it('should perform bulk update with valid data', async () => {
      mockTransactionsModel.bulkUpdate.mockResolvedValue(3)

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBulkUpdateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        message: 'Successfully updated 3 transactions',
        updatedCount: 3
      })
      expect(mockTransactionsModel.bulkUpdate).toHaveBeenCalledWith([1, 2, 3], {
        unitId: 2,
        categoryId: 1,
        ignore: true
      })
    })

    it('should handle single transaction update', async () => {
      const singleUpdateData = {
        ids: [1],
        data: { notes: 'Updated note' }
      }
      mockTransactionsModel.bulkUpdate.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(singleUpdateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        message: 'Successfully updated 1 transaction',
        updatedCount: 1
      })
    })

    it('should update with partial data', async () => {
      const partialUpdateData = {
        ids: [1, 2],
        data: { ignore: true }
      }
      mockTransactionsModel.bulkUpdate.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialUpdateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        message: 'Successfully updated 2 transactions',
        updatedCount: 2
      })
      expect(mockTransactionsModel.bulkUpdate).toHaveBeenCalledWith([1, 2], { ignore: true })
    })

    it('should return 400 for empty IDs array', async () => {
      const invalidData = {
        ids: [],
        data: { unitId: 2 }
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
      expect(mockTransactionsModel.bulkUpdate).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid ID types', async () => {
      const invalidData = {
        ids: ['invalid', 2, 3],
        data: { unitId: 2 }
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(mockTransactionsModel.bulkUpdate).not.toHaveBeenCalled()
    })

    it('should return 400 for empty update data', async () => {
      const invalidData = {
        ids: [1, 2, 3],
        data: {} // no update fields provided
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(mockTransactionsModel.bulkUpdate).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid data types in update', async () => {
      const invalidData = {
        ids: [1, 2, 3],
        data: {
          unitId: 'invalid', // should be number
          ignore: 'not-boolean' // should be boolean
        }
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(mockTransactionsModel.bulkUpdate).not.toHaveBeenCalled()
    })

    it('should handle foreign key constraint errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const foreignKeyError = new Error('FOREIGN KEY constraint failed')
      mockTransactionsModel.bulkUpdate.mockRejectedValue(foreignKeyError)

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBulkUpdateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid unit or category reference')
      
      consoleSpy.mockRestore()
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockTransactionsModel.bulkUpdate.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBulkUpdateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update transactions')
      
      consoleSpy.mockRestore()
    })
  })

  describe('DELETE (bulk delete)', () => {
    const validBulkDeleteData = {
      ids: [1, 2, 3]
    }

    it('should perform bulk delete with valid data', async () => {
      mockTransactionsModel.bulkDelete.mockResolvedValue(3)

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBulkDeleteData)
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        message: 'Successfully deleted 3 transactions',
        deletedCount: 3
      })
      expect(mockTransactionsModel.bulkDelete).toHaveBeenCalledWith([1, 2, 3])
    })

    it('should handle single transaction delete', async () => {
      const singleDeleteData = {
        ids: [1]
      }
      mockTransactionsModel.bulkDelete.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(singleDeleteData)
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        message: 'Successfully deleted 1 transaction',
        deletedCount: 1
      })
    })

    it('should return 400 for empty IDs array', async () => {
      const invalidData = {
        ids: []
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(mockTransactionsModel.bulkDelete).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid ID types', async () => {
      const invalidData = {
        ids: ['invalid', 2, 3]
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(mockTransactionsModel.bulkDelete).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockTransactionsModel.bulkDelete.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBulkDeleteData)
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete transactions')
      
      consoleSpy.mockRestore()
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      })

      const response = await DELETE(request)

      expect(response.status).toBe(500)
    })
  })
})