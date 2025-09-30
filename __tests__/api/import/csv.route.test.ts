/**
 * @jest-environment node
 */

import { PUT, POST } from '@/app/api/import/csv/route'

// Mock models used by the handlers
jest.mock('@/db/models/rules.model', () => ({
  rulesModel: {
    applyUnitRules: jest.fn().mockResolvedValue(42),
    applyCategoryRules: jest.fn().mockResolvedValue(7),
  }
}))

jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getByHash: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 1 }),
  }
}))

jest.mock('@/db/models/import-log.model', () => ({
  importLogModel: {
    logImport: jest.fn().mockResolvedValue({ id: 99 })
  }
}))

describe('CSV Import API', () => {
  const makeFormData = (entries: Record<string, any>) => ({
    get: (key: string) => entries[key] ?? null,
  })

  const makeFile = (name: string, textContent: string) => ({
    name,
    text: async () => textContent,
  })

  const sampleCSV = `Date,Description,Amount,Category\n` +
    `2024-01-15,TEST STORE,-45.50,Groceries\n` +
    `2024-01-16,TEST SALARY,3500.00,Income\n`

  describe('PUT /api/import/csv (preview)', () => {
    it('returns preview with headers, mapping, and suggestions', async () => {
      const file = makeFile('preview.csv', sampleCSV)
      const formData = makeFormData({ file })
      const request = { formData: async () => formData } as any

      const response = await PUT(request)
      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(Array.isArray(data.headers)).toBe(true)
      expect(data.headers).toEqual(['Date', 'Description', 'Amount', 'Category'])
      expect(typeof data.mapping).toBe('object')
      expect(data.mapping.date).toBeGreaterThanOrEqual(0)
      expect(data.mapping.description).toBeGreaterThanOrEqual(0)
      expect(data.mapping.amount).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(data.preview)).toBe(true)
      expect(data.preview.length).toBeGreaterThan(0)
      // Suggestions from mocked rules
      expect(data.preview[0].suggested_unit_id).toBe(42)
      expect(data.preview[0].suggested_category_id).toBe(7)
    })

    it('returns 400 for empty file', async () => {
      const file = makeFile('empty.csv', '')
      const formData = makeFormData({ file })
      const request = { formData: async () => formData } as any

      const response = await PUT(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('File is empty')
    })
  })

  describe('POST /api/import/csv (upload)', () => {
    it('returns 400 when no file provided', async () => {
      const formData = makeFormData({ sourceId: '1' })
      const request = { formData: async () => formData } as any
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('No file provided')
    })

    it('returns 400 for invalid source ID', async () => {
      const file = makeFile('import.csv', sampleCSV)
      const formData = makeFormData({ file, sourceId: 'abc' })
      const request = { formData: async () => formData } as any
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid source ID')
    })
  })
})

