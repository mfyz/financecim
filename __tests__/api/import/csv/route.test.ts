/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST, PUT } from '@/app/api/import/csv/route'
import { transactionsModel } from '@/db/models/transactions.model'
import { rulesModel } from '@/db/models/rules.model'
import { importLogModel } from '@/db/models/import-log.model'

// Mock the data models
jest.mock('@/db/models/transactions.model')
jest.mock('@/db/models/rules.model')
jest.mock('@/db/models/import-log.model')

describe('CSV Import API', () => {
  const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>
  const mockRulesModel = rulesModel as jest.Mocked<typeof rulesModel>
  const mockImportLogModel = importLogModel as jest.Mocked<typeof importLogModel>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/import/csv', () => {
    it('should successfully import CSV transactions', async () => {
      const csvContent = `Date,Description,Amount
2024-01-15,Grocery Store,-45.50
2024-01-16,Salary Deposit,2500.00`

      const formData = new FormData()
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv')
      formData.append('sourceId', '1')
      formData.append('applyRules', 'false')

      mockTransactionsModel.getByHash = jest.fn().mockResolvedValue(null)
      mockTransactionsModel.create = jest.fn().mockImplementation(async (data) => ({
        id: Math.floor(Math.random() * 1000),
        ...data
      }))

      mockImportLogModel.logImport = jest.fn().mockResolvedValue({
        id: 1,
        sourceId: 1,
        fileName: 'test.csv',
        transactionsAdded: 2,
        transactionsSkipped: 0,
        transactionsUpdated: 0,
        status: 'success'
      })

      const request = new NextRequest('http://localhost:3000/api/import/csv', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.imported).toBe(2)
      expect(data.skipped).toBe(0)
      expect(mockTransactionsModel.create).toHaveBeenCalledTimes(2)
      expect(mockImportLogModel.logImport).toHaveBeenCalledTimes(1)
    })

    it('should apply auto-categorization rules when enabled', async () => {
      const csvContent = `Date,Description,Amount,Category
2024-01-15,WALMART STORE,-45.50,Groceries
2024-01-16,CHASE BANK DEPOSIT,2500.00,Income`

      const formData = new FormData()
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv')
      formData.append('sourceId', '1')
      formData.append('applyRules', 'true')

      mockTransactionsModel.getByHash = jest.fn().mockResolvedValue(null)
      mockTransactionsModel.create = jest.fn().mockImplementation(async (data) => ({
        id: Math.floor(Math.random() * 1000),
        ...data
      }))

      mockRulesModel.applyUnitRules = jest.fn()
        .mockResolvedValueOnce(1) // Personal unit
        .mockResolvedValueOnce(2) // Business unit

      mockRulesModel.applyCategoryRules = jest.fn()
        .mockResolvedValueOnce(5) // Groceries category
        .mockResolvedValueOnce(10) // Income category

      mockImportLogModel.logImport = jest.fn().mockResolvedValue({
        id: 1,
        status: 'success'
      })

      const request = new NextRequest('http://localhost:3000/api/import/csv', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockRulesModel.applyUnitRules).toHaveBeenCalledTimes(2)
      expect(mockRulesModel.applyCategoryRules).toHaveBeenCalledTimes(2)

      // Check that rules were called with correct parameters
      expect(mockRulesModel.applyUnitRules).toHaveBeenCalledWith({
        source_id: 1,
        description: 'WALMART STORE'
      })

      expect(mockRulesModel.applyCategoryRules).toHaveBeenCalledWith({
        description: 'WALMART STORE',
        source_category: 'Groceries'
      })
    })

    it('should skip duplicate transactions based on hash', async () => {
      const csvContent = `Date,Description,Amount
2024-01-15,Grocery Store,-45.50
2024-01-15,Duplicate Transaction,-45.50`

      const formData = new FormData()
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv')
      formData.append('sourceId', '1')
      formData.append('applyRules', 'false')

      mockTransactionsModel.getByHash = jest.fn()
        .mockResolvedValueOnce(null) // First transaction - new
        .mockResolvedValueOnce({ id: 999 }) // Second transaction - duplicate

      mockTransactionsModel.create = jest.fn().mockResolvedValue({ id: 1 })

      mockImportLogModel.logImport = jest.fn().mockResolvedValue({
        id: 1,
        status: 'success'
      })

      const request = new NextRequest('http://localhost:3000/api/import/csv', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.imported).toBe(1)
      expect(data.skipped).toBe(1)
      expect(mockTransactionsModel.create).toHaveBeenCalledTimes(1)
    })

    it('should handle custom column mapping', async () => {
      const csvContent = `Trans Date,Merchant,Debit
15/01/2024,Store A,45.50
16/01/2024,Store B,30.00`

      const mapping = {
        date: 0,
        description: 1,
        amount: 2
      }

      const formData = new FormData()
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv')
      formData.append('sourceId', '1')
      formData.append('mapping', JSON.stringify(mapping))
      formData.append('applyRules', 'false')

      mockTransactionsModel.getByHash = jest.fn().mockResolvedValue(null)
      mockTransactionsModel.create = jest.fn().mockResolvedValue({ id: 1 })
      mockImportLogModel.logImport = jest.fn().mockResolvedValue({ id: 1, status: 'success' })

      const request = new NextRequest('http://localhost:3000/api/import/csv', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.imported).toBe(2)
    })

    it('should return error for missing file', async () => {
      const formData = new FormData()
      formData.append('sourceId', '1')

      const request = new NextRequest('http://localhost:3000/api/import/csv', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No file provided')
    })

    it('should return error for missing source ID', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test'], { type: 'text/csv' }), 'test.csv')

      const request = new NextRequest('http://localhost:3000/api/import/csv', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Source ID is required')
    })

    it('should return error for empty file', async () => {
      const formData = new FormData()
      formData.append('file', new Blob([''], { type: 'text/csv' }), 'test.csv')
      formData.append('sourceId', '1')

      const request = new NextRequest('http://localhost:3000/api/import/csv', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('File is empty')
    })

    it('should handle parse errors and continue with valid transactions', async () => {
      const csvContent = `Date,Description,Amount
2024-01-15,Valid Transaction,45.50
invalid-date,Invalid Date,30.00
2024-01-17,Valid Transaction 2,25.00`

      const formData = new FormData()
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv')
      formData.append('sourceId', '1')
      formData.append('applyRules', 'false')

      mockTransactionsModel.getByHash = jest.fn().mockResolvedValue(null)
      mockTransactionsModel.create = jest.fn().mockResolvedValue({ id: 1 })
      mockImportLogModel.logImport = jest.fn().mockResolvedValue({ id: 1, status: 'partial' })

      const request = new NextRequest('http://localhost:3000/api/import/csv', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.imported).toBe(2)
      expect(data.parseErrors).toBeDefined()
      expect(data.parseErrors.length).toBeGreaterThan(0)
    })
  })

  describe('PUT /api/import/csv (preview)', () => {
    it('should preview CSV without importing', async () => {
      const csvContent = `Date,Description,Amount
2024-01-15,Grocery Store,-45.50
2024-01-16,Salary Deposit,2500.00
2024-01-17,Gas Station,-30.00`

      const formData = new FormData()
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv')

      mockRulesModel.applyUnitRules = jest.fn().mockResolvedValue(1)
      mockRulesModel.applyCategoryRules = jest.fn().mockResolvedValue(5)

      const request = new NextRequest('http://localhost:3000/api/import/csv', {
        method: 'PUT',
        body: formData
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.headers).toEqual(['Date', 'Description', 'Amount'])
      expect(data.mapping).toBeDefined()
      expect(data.totalRows).toBe(3)
      expect(data.preview).toBeDefined()
      expect(data.preview.length).toBeLessThanOrEqual(10)

      // Check that preview includes suggested categorizations
      expect(data.preview[0].suggested_unit_id).toBeDefined()
      expect(data.preview[0].suggested_category_id).toBeDefined()
    })

    it('should auto-detect column mapping in preview', async () => {
      const csvContent = `Transaction Date,Merchant Description,Debit Amount
2024-01-15,Store A,45.50`

      const formData = new FormData()
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv')

      const request = new NextRequest('http://localhost:3000/api/import/csv', {
        method: 'PUT',
        body: formData
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mapping.date).toBe(0)
      expect(data.mapping.description).toBe(1)
      expect(data.mapping.amount).toBe(2)
    })

    it('should use custom mapping if provided', async () => {
      const csvContent = `Col1,Col2,Col3
2024-01-15,Store,45.50`

      const mapping = {
        date: 0,
        description: 1,
        amount: 2
      }

      const formData = new FormData()
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv')
      formData.append('mapping', JSON.stringify(mapping))

      const request = new NextRequest('http://localhost:3000/api/import/csv', {
        method: 'PUT',
        body: formData
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mapping).toEqual(mapping)
      expect(data.preview.length).toBe(1)
    })

    it('should return error for empty file in preview', async () => {
      const formData = new FormData()
      formData.append('file', new Blob([''], { type: 'text/csv' }), 'test.csv')

      const request = new NextRequest('http://localhost:3000/api/import/csv', {
        method: 'PUT',
        body: formData
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('File is empty')
    })
  })
})