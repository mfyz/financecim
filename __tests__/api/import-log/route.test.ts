/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server'
import { GET, POST } from '@/app/api/import-log/route'
import { importLogModel } from '@/db/models/import-log.model'

jest.mock('@/db/models/import-log.model', () => ({
  importLogModel: {
    getAll: jest.fn(),
    getById: jest.fn(),
    getBySourceId: jest.fn(),
    getRecentImports: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getImportStats: jest.fn(),
    logSuccessfulImport: jest.fn(),
    logFailedImport: jest.fn(),
    logPartialImport: jest.fn()
  }
}))

const mockImportLogModel = importLogModel as jest.Mocked<typeof importLogModel>

describe('Import Log API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/import-log', () => {
    it('should return all import logs successfully', async () => {
      const mockLogs = [
        {
          id: 1,
          sourceId: 1,
          importDate: '2024-01-01T00:00:00Z',
          fileName: 'test.csv',
          transactionsAdded: 100,
          transactionsSkipped: 5,
          transactionsUpdated: 0,
          status: 'success' as const,
          errorMessage: null,
          metadata: '{"columns":["date","amount","description"]}',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          sourceId: 2,
          importDate: '2024-01-02T00:00:00Z',
          fileName: 'bank.csv',
          transactionsAdded: 50,
          transactionsSkipped: 2,
          transactionsUpdated: 10,
          status: 'partial' as const,
          errorMessage: 'Some rows failed validation',
          metadata: null,
          createdAt: '2024-01-02T00:00:00Z'
        }
      ]

      mockImportLogModel.getAll.mockResolvedValue(mockLogs)

      const request = {
        nextUrl: {
          searchParams: new URLSearchParams()
        }
      } as NextRequest

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockLogs)
      expect(mockImportLogModel.getAll).toHaveBeenCalledTimes(1)
    })

    it('should return logs filtered by sourceId', async () => {
      const mockLogs = [
        {
          id: 1,
          sourceId: 1,
          importDate: '2024-01-01T00:00:00Z',
          fileName: 'test.csv',
          transactionsAdded: 100,
          transactionsSkipped: 5,
          transactionsUpdated: 0,
          status: 'success' as const,
          errorMessage: null,
          metadata: null,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ]

      mockImportLogModel.getBySourceId.mockResolvedValue(mockLogs)

      const searchParams = new URLSearchParams({ sourceId: '1' })
      const request = {
        nextUrl: {
          searchParams
        }
      } as NextRequest

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockLogs)
      expect(mockImportLogModel.getBySourceId).toHaveBeenCalledWith(1)
    })

    it('should return recent imports with limit', async () => {
      const mockLogs = [
        {
          id: 3,
          sourceId: 1,
          importDate: '2024-01-03T00:00:00Z',
          fileName: 'recent.csv',
          transactionsAdded: 25,
          transactionsSkipped: 0,
          transactionsUpdated: 0,
          status: 'success' as const,
          errorMessage: null,
          metadata: null,
          createdAt: '2024-01-03T00:00:00Z'
        }
      ]

      mockImportLogModel.getRecentImports.mockResolvedValue(mockLogs)

      const searchParams = new URLSearchParams({ limit: '5' })
      const request = {
        nextUrl: {
          searchParams
        }
      } as NextRequest

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockLogs)
      expect(mockImportLogModel.getRecentImports).toHaveBeenCalledWith(5)
    })

    it('should return 400 for invalid sourceId', async () => {
      const searchParams = new URLSearchParams({ sourceId: 'invalid' })
      const request = {
        nextUrl: {
          searchParams
        }
      } as NextRequest

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid source ID' })
      expect(mockImportLogModel.getBySourceId).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockImportLogModel.getAll.mockRejectedValue(new Error('Database error'))

      const request = {
        nextUrl: {
          searchParams: new URLSearchParams()
        }
      } as NextRequest

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch import logs' })

      consoleSpy.mockRestore()
    })
  })

  describe('POST /api/import-log', () => {
    it('should create a new import log successfully', async () => {
      const newLog = {
        sourceId: 1,
        fileName: 'new-import.csv',
        transactionsAdded: 75,
        transactionsSkipped: 3,
        transactionsUpdated: 0,
        status: 'success' as const,
        metadata: { format: 'csv', delimiter: ',' }
      }

      const createdLog = {
        id: 4,
        ...newLog,
        importDate: '2024-01-04T00:00:00Z',
        errorMessage: null,
        metadata: '{"format":"csv","delimiter":","}',
        createdAt: '2024-01-04T00:00:00Z'
      }

      mockImportLogModel.create.mockResolvedValue(createdLog)

      const request = {
        json: async () => newLog
      } as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(createdLog)
      expect(mockImportLogModel.create).toHaveBeenCalledWith(newLog)
    })

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        sourceId: -1,
        status: 'invalid',
        transactionsAdded: -10
      }

      const request = {
        json: async () => invalidData
      } as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid data')
      expect(data.details).toBeDefined()
      expect(mockImportLogModel.create).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const validData = {
        sourceId: 1,
        fileName: 'test.csv',
        transactionsAdded: 50,
        transactionsSkipped: 0,
        transactionsUpdated: 0,
        status: 'success' as const
      }

      mockImportLogModel.create.mockRejectedValue(new Error('Database error'))

      const request = {
        json: async () => validData
      } as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to create import log' })

      consoleSpy.mockRestore()
    })
  })
})