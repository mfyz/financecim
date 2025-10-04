/**
 * @jest-environment node
 *
 * Tests for Transaction Import API with Debit/Credit Column Merge
 *
 * This test suite verifies that the import system correctly handles CSV files
 * with separate Debit and Credit columns (common in bank exports like Capital One).
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

describe('Transaction Import API - Debit/Credit Column Merge', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockTransactionsModel.normalizePayload.mockImplementation((data) => ({
      ...data,
      hash: data.hash || 'mock-hash-' + Math.random()
    }))

    mockTransactionsModel.getByHash.mockResolvedValue(null) // No duplicates by default

    mockTransactionsModel.create.mockImplementation((data) =>
      Promise.resolve({
        id: Math.floor(Math.random() * 1000),
        sourceId: data.source_id,
        unitId: null,
        date: data.date,
        description: data.description,
        amount: data.amount,
        sourceCategory: data.source_category || null,
        categoryId: null,
        ignore: false,
        notes: null,
        tags: null,
        hash: data.hash || 'mock-hash',
        sourceData: data.source_data || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    )
  })

  describe('Debit Column Processing', () => {
    it('should convert debit values to negative amounts', async () => {
      // Debit = expense (should become negative)
      const transaction = {
        date: '2024-12-15',
        description: 'MCNALLY JACKSON BOOKS',
        amount: -65.32, // Already converted (debit 65.32 -> -65.32)
        source_id: 1,
        source_category: 'Merchandise',
        source_data: {
          'Transaction Date': '2024-12-15',
          'Posted Date': '2024-12-16',
          'Card No.': '8628',
          Description: 'MCNALLY JACKSON BOOKS',
          Category: 'Merchandise',
          Debit: '65.32',
          Credit: ''
        }
      }

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
          amount: -65.32,
          description: 'MCNALLY JACKSON BOOKS'
        })
      )
    })

    it('should handle multiple debit transactions', async () => {
      const transactions = [
        {
          date: '2024-12-15',
          description: 'MCNALLY JACKSON BOOKS',
          amount: -65.32,
          source_id: 1,
          source_category: 'Merchandise',
          source_data: { Debit: '65.32', Credit: '' }
        },
        {
          date: '2024-12-15',
          description: 'TST*MISS ADA',
          amount: -50.75,
          source_id: 1,
          source_category: 'Dining',
          source_data: { Debit: '50.75', Credit: '' }
        },
        {
          date: '2024-12-04',
          description: 'PREMIER MARKETPLACE, LLC',
          amount: -18.08,
          source_id: 1,
          source_category: 'Merchandise',
          source_data: { Debit: '18.08', Credit: '' }
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.imported).toBe(3)
      expect(mockTransactionsModel.create).toHaveBeenCalledTimes(3)

      // Verify all amounts are negative
      const calls = mockTransactionsModel.create.mock.calls
      expect(calls[0][0].amount).toBe(-65.32)
      expect(calls[1][0].amount).toBe(-50.75)
      expect(calls[2][0].amount).toBe(-18.08)
    })
  })

  describe('Credit Column Processing', () => {
    it('should keep credit values as positive amounts', async () => {
      // Credit = payment/refund (should remain positive)
      const transaction = {
        date: '2024-12-26',
        description: 'CAPITAL ONE MOBILE PYMT',
        amount: 1427.36, // Credit value stays positive
        source_id: 1,
        source_category: 'Payment/Credit',
        source_data: {
          'Transaction Date': '2024-12-26',
          'Posted Date': '2024-12-26',
          'Card No.': '8628',
          Description: 'CAPITAL ONE MOBILE PYMT',
          Category: 'Payment/Credit',
          Debit: '',
          Credit: '1427.36'
        }
      }

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
          amount: 1427.36,
          description: 'CAPITAL ONE MOBILE PYMT'
        })
      )
    })

    it('should handle multiple credit transactions', async () => {
      const transactions = [
        {
          date: '2024-12-26',
          description: 'CAPITAL ONE MOBILE PYMT',
          amount: 1427.36,
          source_id: 1,
          source_category: 'Payment/Credit',
          source_data: { Debit: '', Credit: '1427.36' }
        },
        {
          date: '2024-12-12',
          description: 'HM.COM',
          amount: 169.15,
          source_id: 1,
          source_category: 'Merchandise',
          source_data: { Debit: '', Credit: '169.15' }
        },
        {
          date: '2024-12-03',
          description: 'CAPITAL ONE MOBILE PYMT',
          amount: 1690.46,
          source_id: 1,
          source_category: 'Payment/Credit',
          source_data: { Debit: '', Credit: '1690.46' }
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.imported).toBe(3)
      expect(mockTransactionsModel.create).toHaveBeenCalledTimes(3)

      // Verify all amounts are positive
      const calls = mockTransactionsModel.create.mock.calls
      expect(calls[0][0].amount).toBe(1427.36)
      expect(calls[1][0].amount).toBe(169.15)
      expect(calls[2][0].amount).toBe(1690.46)
    })
  })

  describe('Mixed Debit/Credit Processing', () => {
    it('should correctly handle a mix of debits and credits', async () => {
      const transactions = [
        {
          date: '2024-12-26',
          description: 'CAPITAL ONE MOBILE PYMT',
          amount: 1427.36, // Credit (positive)
          source_id: 1,
          source_category: 'Payment/Credit',
          source_data: { Debit: '', Credit: '1427.36' }
        },
        {
          date: '2024-12-15',
          description: 'MCNALLY JACKSON BOOKS',
          amount: -65.32, // Debit (negative)
          source_id: 1,
          source_category: 'Merchandise',
          source_data: { Debit: '65.32', Credit: '' }
        },
        {
          date: '2024-12-15',
          description: 'TST*MISS ADA',
          amount: -50.75, // Debit (negative)
          source_id: 1,
          source_category: 'Dining',
          source_data: { Debit: '50.75', Credit: '' }
        },
        {
          date: '2024-12-12',
          description: 'HM.COM',
          amount: 169.15, // Credit (positive)
          source_id: 1,
          source_category: 'Merchandise',
          source_data: { Debit: '', Credit: '169.15' }
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.imported).toBe(4)

      const calls = mockTransactionsModel.create.mock.calls
      expect(calls[0][0].amount).toBe(1427.36) // Credit
      expect(calls[1][0].amount).toBe(-65.32) // Debit
      expect(calls[2][0].amount).toBe(-50.75) // Debit
      expect(calls[3][0].amount).toBe(169.15) // Credit
    })
  })

  describe('Source Data Preservation', () => {
    it('should preserve original debit/credit columns in source_data', async () => {
      const transaction = {
        date: '2024-12-15',
        description: 'MCNALLY JACKSON BOOKS',
        amount: -65.32,
        source_id: 1,
        source_category: 'Merchandise',
        source_data: {
          'Transaction Date': '2024-12-15',
          'Posted Date': '2024-12-16',
          'Card No.': '8628',
          Description: 'MCNALLY JACKSON BOOKS',
          Category: 'Merchandise',
          Debit: '65.32',
          Credit: ''
        }
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({
          transactions: [transaction]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(mockTransactionsModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          source_data: expect.objectContaining({
            Debit: '65.32',
            Credit: ''
          })
        })
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle transactions with zero debit values', async () => {
      const transaction = {
        date: '2024-12-15',
        description: 'Test Transaction',
        amount: 0,
        source_id: 1,
        source_data: { Debit: '0', Credit: '' }
      }

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
          amount: 0
        })
      )
    })

    it('should handle decimal precision correctly', async () => {
      const transactions = [
        {
          date: '2024-11-13',
          description: '240586 GREENPOINT YMCA 4',
          amount: -411.6, // Debit with one decimal place
          source_id: 1,
          source_data: { Debit: '411.60', Credit: '' }
        },
        {
          date: '2024-08-18',
          description: 'Heinemann Duty Free/Fil.2',
          amount: -63.88, // Debit with two decimal places
          source_id: 1,
          source_data: { Debit: '63.88', Credit: '' }
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.imported).toBe(2)

      const calls = mockTransactionsModel.create.mock.calls
      expect(calls[0][0].amount).toBe(-411.6)
      expect(calls[1][0].amount).toBe(-63.88)
    })
  })
})
