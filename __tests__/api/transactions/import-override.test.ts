/**
 * @jest-environment node
 *
 * Tests for Transaction Import API with Duplicate Override Logic
 *
 * This test suite covers the critical allowDuplicate flag functionality
 * that allows users to force import duplicate transactions.
 */

import { POST } from '@/app/api/transactions/import/route'
import { transactionsModel } from '@/db/models/transactions.model'
import { NextRequest } from 'next/server'

// Mock the transactions model
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    normalizePayload: jest.fn(),
    getByHash: jest.fn(),
    create: jest.fn()
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>

describe('Transaction Import API - Duplicate Override Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockTransactionsModel.normalizePayload.mockImplementation((data) => ({
      ...data,
      hash: data.hash || 'mock-hash'
    }))

    mockTransactionsModel.create.mockResolvedValue({
      id: 1,
      sourceId: 1,
      unitId: null,
      date: '2024-01-15',
      description: 'Test Transaction',
      amount: -50.0,
      sourceCategory: null,
      categoryId: null,
      ignore: false,
      notes: null,
      tags: null,
      hash: 'mock-hash',
      sourceData: null,
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z'
    })
  })

  describe('allowDuplicate Flag Handling', () => {
    it('should skip duplicate check when allowDuplicate is true', async () => {
      const transaction = {
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.0,
        source_id: 1,
        hash: 'duplicate-hash',
        allowDuplicate: true
      }

      mockTransactionsModel.normalizePayload.mockReturnValue({
        ...transaction,
        hash: 'duplicate-hash'
      })

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({
          transactions: [transaction]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.imported).toBe(1)
      expect(data.skipped).toBe(0)
      expect(mockTransactionsModel.getByHash).not.toHaveBeenCalled()
      expect(mockTransactionsModel.create).toHaveBeenCalledWith(transaction)
    })

    it('should perform duplicate check when allowDuplicate is false', async () => {
      const transaction = {
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.0,
        source_id: 1,
        hash: 'duplicate-hash',
        allowDuplicate: false
      }

      mockTransactionsModel.normalizePayload.mockReturnValue({
        ...transaction,
        hash: 'duplicate-hash'
      })

      mockTransactionsModel.getByHash.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({
          transactions: [transaction]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.imported).toBe(1)
      expect(mockTransactionsModel.getByHash).toHaveBeenCalledWith('duplicate-hash')
      expect(mockTransactionsModel.create).toHaveBeenCalled()
    })

    it('should perform duplicate check when allowDuplicate is undefined', async () => {
      const transaction = {
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.0,
        source_id: 1,
        hash: 'duplicate-hash'
        // allowDuplicate not provided
      }

      mockTransactionsModel.normalizePayload.mockReturnValue({
        ...transaction,
        hash: 'duplicate-hash'
      })

      mockTransactionsModel.getByHash.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({
          transactions: [transaction]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(mockTransactionsModel.getByHash).toHaveBeenCalledWith('duplicate-hash')
      expect(mockTransactionsModel.create).toHaveBeenCalled()
    })
  })

  describe('Duplicate Detection with Override', () => {
    it('should skip existing transaction when allowDuplicate is false', async () => {
      const transaction = {
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.0,
        source_id: 1,
        hash: 'existing-hash',
        allowDuplicate: false
      }

      mockTransactionsModel.normalizePayload.mockReturnValue({
        ...transaction,
        hash: 'existing-hash'
      })

      mockTransactionsModel.getByHash.mockResolvedValue({
        id: 999,
        sourceId: 1,
        unitId: null,
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.0,
        sourceCategory: null,
        categoryId: null,
        ignore: false,
        notes: null,
        tags: null,
        hash: 'existing-hash',
        sourceData: null,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z'
      })

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({
          transactions: [transaction]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.imported).toBe(0)
      expect(data.skipped).toBe(1)
      expect(mockTransactionsModel.getByHash).toHaveBeenCalledWith('existing-hash')
      expect(mockTransactionsModel.create).not.toHaveBeenCalled()
    })

    it('should import existing transaction when allowDuplicate is true', async () => {
      const transaction = {
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.0,
        source_id: 1,
        hash: 'existing-hash',
        allowDuplicate: true
      }

      mockTransactionsModel.normalizePayload.mockReturnValue({
        ...transaction,
        hash: 'existing-hash'
      })

      // Even though duplicate exists, it should not be checked
      mockTransactionsModel.getByHash.mockResolvedValue({
        id: 999,
        sourceId: 1,
        unitId: null,
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.0,
        sourceCategory: null,
        categoryId: null,
        ignore: false,
        notes: null,
        tags: null,
        hash: 'existing-hash',
        sourceData: null,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z'
      })

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({
          transactions: [transaction]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.imported).toBe(1)
      expect(data.skipped).toBe(0)
      expect(mockTransactionsModel.getByHash).not.toHaveBeenCalled()
      expect(mockTransactionsModel.create).toHaveBeenCalledWith(transaction)
    })
  })

  describe('Batch Import with Mixed Override Flags', () => {
    it('should handle mix of allowDuplicate true and false', async () => {
      const transactions = [
        {
          date: '2024-01-15',
          description: 'Transaction 1',
          amount: -50.0,
          source_id: 1,
          hash: 'hash1',
          allowDuplicate: true
        },
        {
          date: '2024-01-16',
          description: 'Transaction 2',
          amount: -75.0,
          source_id: 1,
          hash: 'hash2',
          allowDuplicate: false
        },
        {
          date: '2024-01-17',
          description: 'Transaction 3',
          amount: -100.0,
          source_id: 1,
          hash: 'hash3',
          allowDuplicate: true
        }
      ]

      mockTransactionsModel.normalizePayload.mockImplementation((data) => ({
        ...data,
        hash: data.hash
      }))

      mockTransactionsModel.getByHash.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.imported).toBe(3)
      expect(data.skipped).toBe(0)
      // getByHash should only be called for transaction 2 (allowDuplicate: false)
      expect(mockTransactionsModel.getByHash).toHaveBeenCalledTimes(1)
      expect(mockTransactionsModel.getByHash).toHaveBeenCalledWith('hash2')
      expect(mockTransactionsModel.create).toHaveBeenCalledTimes(3)
    })

    it('should handle duplicates correctly in batch with overrides', async () => {
      const transactions = [
        {
          date: '2024-01-15',
          description: 'Clean Transaction',
          amount: -50.0,
          source_id: 1,
          hash: 'clean-hash',
          allowDuplicate: false
        },
        {
          date: '2024-01-16',
          description: 'Duplicate with Override',
          amount: -75.0,
          source_id: 1,
          hash: 'dup-hash-override',
          allowDuplicate: true
        },
        {
          date: '2024-01-17',
          description: 'Duplicate without Override',
          amount: -100.0,
          source_id: 1,
          hash: 'dup-hash-no-override',
          allowDuplicate: false
        }
      ]

      mockTransactionsModel.normalizePayload.mockImplementation((data) => ({
        ...data,
        hash: data.hash
      }))

      // Mock getByHash to return duplicates for the two duplicate hashes
      mockTransactionsModel.getByHash.mockImplementation(async (hash) => {
        if (hash === 'dup-hash-override' || hash === 'dup-hash-no-override') {
          return {
            id: 999,
            sourceId: 1,
            unitId: null,
            date: '2024-01-15',
            description: 'Existing',
            amount: -50.0,
            sourceCategory: null,
            categoryId: null,
            ignore: false,
            notes: null,
            tags: null,
            hash: hash,
            sourceData: null,
            createdAt: '2024-01-15T00:00:00.000Z',
            updatedAt: '2024-01-15T00:00:00.000Z'
          }
        }
        return null
      })

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.imported).toBe(2) // Clean + overridden duplicate
      expect(data.skipped).toBe(1) // Non-overridden duplicate
      // getByHash should be called for clean-hash and dup-hash-no-override
      expect(mockTransactionsModel.getByHash).toHaveBeenCalledWith('clean-hash')
      expect(mockTransactionsModel.getByHash).toHaveBeenCalledWith('dup-hash-no-override')
      expect(mockTransactionsModel.getByHash).not.toHaveBeenCalledWith('dup-hash-override')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle transaction without hash', async () => {
      const transaction = {
        date: '2024-01-15',
        description: 'Transaction without hash',
        amount: -50.0,
        source_id: 1,
        allowDuplicate: false
      }

      mockTransactionsModel.normalizePayload.mockReturnValue({
        ...transaction,
        hash: undefined as any
      })

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({
          transactions: [transaction]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(mockTransactionsModel.getByHash).not.toHaveBeenCalled()
      expect(mockTransactionsModel.create).toHaveBeenCalled()
    })

    it('should handle creation error and continue with other transactions', async () => {
      const transactions = [
        {
          date: '2024-01-15',
          description: 'Good Transaction',
          amount: -50.0,
          source_id: 1,
          hash: 'good-hash',
          allowDuplicate: false
        },
        {
          date: '2024-01-16',
          description: 'Bad Transaction',
          amount: -75.0,
          source_id: 1,
          hash: 'bad-hash',
          allowDuplicate: false
        },
        {
          date: '2024-01-17',
          description: 'Another Good Transaction',
          amount: -100.0,
          source_id: 1,
          hash: 'good-hash-2',
          allowDuplicate: false
        }
      ]

      mockTransactionsModel.normalizePayload.mockImplementation((data) => ({
        ...data,
        hash: data.hash
      }))

      mockTransactionsModel.getByHash.mockResolvedValue(null)

      mockTransactionsModel.create.mockImplementation(async (data: any) => {
        if (data.hash === 'bad-hash') {
          throw new Error('Database constraint violation')
        }
        return {
          id: 1,
          sourceId: 1,
          unitId: null,
          date: '2024-01-15',
          description: data.description,
          amount: data.amount,
          sourceCategory: null,
          categoryId: null,
          ignore: false,
          notes: null,
          tags: null,
          hash: data.hash,
          sourceData: null,
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions })
      })

      // Silence expected console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const response = await POST(request)
      const data = await response.json()

      consoleSpy.mockRestore()

      expect(data.success).toBe(true)
      expect(data.imported).toBe(2)
      expect(data.skipped).toBe(0)
      expect(data.errors).toBeDefined()
      expect(data.errors).toHaveLength(1)
    })

    it('should handle empty transactions array', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({
          transactions: []
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.imported).toBe(0)
      expect(data.skipped).toBe(0)
      expect(mockTransactionsModel.create).not.toHaveBeenCalled()
    })

    it('should handle invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({
          transactions: null
        })
      })

      // Silence expected console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const response = await POST(request)
      const data = await response.json()

      consoleSpy.mockRestore()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid transaction data')
    })
  })

  describe('Source Data Preservation with Override', () => {
    it('should preserve source_data field when importing with allowDuplicate', async () => {
      const transaction = {
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.0,
        source_id: 1,
        hash: 'hash-with-data',
        allowDuplicate: true,
        source_data: {
          Date: '01/15/2024',
          Description: 'Test Transaction',
          Amount: '-$50.00',
          Category: 'Groceries'
        }
      }

      mockTransactionsModel.normalizePayload.mockReturnValue({
        ...transaction,
        hash: 'hash-with-data'
      })

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({
          transactions: [transaction]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.imported).toBe(1)
      expect(mockTransactionsModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          source_data: transaction.source_data
        })
      )
    })
  })
})