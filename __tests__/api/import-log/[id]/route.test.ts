/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '@/app/api/import-log/[id]/route'
import { importLogModel } from '@/db/models/import-log.model'
import { NextRequest } from 'next/server'

jest.mock('@/db/models/import-log.model', () => ({
  importLogModel: {
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}))

const mockImportLogModel = importLogModel as jest.Mocked<typeof importLogModel>

describe('Import Log by ID API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/import-log/[id]', () => {
    it('should return an import log by ID successfully', async () => {
      const mockLog = {
        id: 1,
        sourceId: 1,
        source: { id: 1, name: 'Test Bank' },
        importDate: '2025-03-15T10:00:00Z',
        fileName: 'transactions.csv',
        transactionsAdded: 50,
        transactionsSkipped: 5,
        transactionsUpdated: 10,
        status: 'success',
        errorMessage: null,
        metadata: { version: '1.0', format: 'csv' },
        createdAt: '2025-03-15T10:00:00Z'
      }

      mockImportLogModel.getById.mockResolvedValue(mockLog)

      const request = new NextRequest('http://localhost:5601/api/import-log/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockLog)
      expect(mockImportLogModel.getById).toHaveBeenCalledWith(1)
    })

    it('should parse metadata when it is a string', async () => {
      const mockLog = {
        id: 1,
        sourceId: 1,
        source: { id: 1, name: 'Test Bank' },
        importDate: '2025-03-15T10:00:00Z',
        fileName: 'transactions.csv',
        transactionsAdded: 50,
        transactionsSkipped: 5,
        transactionsUpdated: 10,
        status: 'success',
        errorMessage: null,
        metadata: '{"version":"1.0","format":"csv"}', // String metadata
        createdAt: '2025-03-15T10:00:00Z'
      }

      mockImportLogModel.getById.mockResolvedValue({ ...mockLog })

      const request = new NextRequest('http://localhost:5601/api/import-log/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata).toEqual({ version: '1.0', format: 'csv' }) // Parsed object
    })

    it('should keep metadata as string when parsing fails', async () => {
      const mockLog = {
        id: 1,
        sourceId: 1,
        source: { id: 1, name: 'Test Bank' },
        importDate: '2025-03-15T10:00:00Z',
        fileName: 'transactions.csv',
        transactionsAdded: 50,
        transactionsSkipped: 5,
        transactionsUpdated: 10,
        status: 'success',
        errorMessage: null,
        metadata: 'invalid json', // Invalid JSON string
        createdAt: '2025-03-15T10:00:00Z'
      }

      mockImportLogModel.getById.mockResolvedValue({ ...mockLog })

      const request = new NextRequest('http://localhost:5601/api/import-log/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata).toBe('invalid json') // Kept as string
    })

    it('should return 404 when log not found', async () => {
      mockImportLogModel.getById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:5601/api/import-log/999')
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Import log not found' })
      expect(mockImportLogModel.getById).toHaveBeenCalledWith(999)
    })

    it('should return 400 for invalid ID format', async () => {
      const request = new NextRequest('http://localhost:5601/api/import-log/invalid')
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid log ID' })
      expect(mockImportLogModel.getById).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockImportLogModel.getById.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:5601/api/import-log/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch import log' })
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching import log:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('PUT /api/import-log/[id]', () => {
    it('should update an import log successfully', async () => {
      const updateData = {
        transactionsAdded: 75,
        status: 'success' as const
      }

      const updatedLog = {
        id: 1,
        sourceId: 1,
        source: { id: 1, name: 'Test Bank' },
        importDate: '2025-03-15T10:00:00Z',
        fileName: 'transactions.csv',
        transactionsAdded: 75,
        transactionsSkipped: 5,
        transactionsUpdated: 10,
        status: 'success',
        errorMessage: null,
        metadata: { version: '1.0' },
        createdAt: '2025-03-15T10:00:00Z'
      }

      mockImportLogModel.update.mockResolvedValue(updatedLog)

      const request = new NextRequest('http://localhost:5601/api/import-log/1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedLog)
      expect(mockImportLogModel.update).toHaveBeenCalledWith(1, updateData)
    })

    it('should update all fields when provided', async () => {
      const fullUpdate = {
        sourceId: 2,
        fileName: 'new_transactions.csv',
        transactionsAdded: 100,
        transactionsSkipped: 10,
        transactionsUpdated: 20,
        status: 'partial' as const,
        errorMessage: 'Some rows had invalid dates',
        metadata: { version: '2.0', warnings: ['date_parse_errors'] }
      }

      const updatedLog = {
        id: 1,
        ...fullUpdate,
        source: { id: 2, name: 'New Bank' },
        importDate: '2025-03-15T10:00:00Z',
        createdAt: '2025-03-15T10:00:00Z'
      }

      mockImportLogModel.update.mockResolvedValue(updatedLog)

      const request = new NextRequest('http://localhost:5601/api/import-log/1', {
        method: 'PUT',
        body: JSON.stringify(fullUpdate)
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedLog)
      expect(mockImportLogModel.update).toHaveBeenCalledWith(1, fullUpdate)
    })

    it('should return 404 when log not found', async () => {
      mockImportLogModel.update.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:5601/api/import-log/999', {
        method: 'PUT',
        body: JSON.stringify({ status: 'success' })
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Import log not found' })
    })

    it('should return 400 for invalid ID format', async () => {
      const request = new NextRequest('http://localhost:5601/api/import-log/invalid', {
        method: 'PUT',
        body: JSON.stringify({ status: 'success' })
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid log ID' })
      expect(mockImportLogModel.update).not.toHaveBeenCalled()
    })

    it('should validate status field', async () => {
      const invalidData = {
        status: 'invalid_status'
      }

      const request = new NextRequest('http://localhost:5601/api/import-log/1', {
        method: 'PUT',
        body: JSON.stringify(invalidData)
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid data')
      expect(data).toHaveProperty('details')
      expect(mockImportLogModel.update).not.toHaveBeenCalled()
    })

    it('should reject negative transaction counts', async () => {
      const invalidData = {
        transactionsAdded: -5,
        transactionsSkipped: -10
      }

      const request = new NextRequest('http://localhost:5601/api/import-log/1', {
        method: 'PUT',
        body: JSON.stringify(invalidData)
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid data')
      expect(mockImportLogModel.update).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockImportLogModel.update.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:5601/api/import-log/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'success' })
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to update import log' })
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error updating import log:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('DELETE /api/import-log/[id]', () => {
    it('should delete an import log successfully', async () => {
      mockImportLogModel.delete.mockResolvedValue(true)

      const request = new NextRequest('http://localhost:5601/api/import-log/1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ message: 'Import log deleted successfully' })
      expect(mockImportLogModel.delete).toHaveBeenCalledWith(1)
    })

    it('should return 404 when log not found', async () => {
      mockImportLogModel.delete.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:5601/api/import-log/999', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Import log not found' })
      expect(mockImportLogModel.delete).toHaveBeenCalledWith(999)
    })

    it('should return 400 for invalid ID format', async () => {
      const request = new NextRequest('http://localhost:5601/api/import-log/invalid', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid log ID' })
      expect(mockImportLogModel.delete).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockImportLogModel.delete.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:5601/api/import-log/1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to delete import log' })
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error deleting import log:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })
})