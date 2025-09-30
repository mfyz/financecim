/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/transactions/import/route'
import { transactionsModel } from '@/db/models/transactions.model'
import { sourcesModel } from '@/db/models/sources.model'

describe('POST /api/transactions/import - Integration Tests', () => {
  let consoleSpy: jest.SpyInstance
  let consoleErrSpy: jest.SpyInstance
  let testSourceId: number

  beforeAll(async () => {
    // Create a test source
    try {
      const source = await sourcesModel.create({
        name: 'Test Bank Import',
        type: 'bank'
      })
      testSourceId = source.id
    } catch (error) {
      console.error('Failed to create test source:', error)
      throw error
    }
  })

  beforeEach(() => {
    // Don't suppress console logs - we need to see them
    consoleSpy = jest.spyOn(console, 'log')
    consoleErrSpy = jest.spyOn(console, 'error')
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    consoleErrSpy.mockRestore()
  })

  it('imports a real transaction to the database', async () => {
    // Use timestamp to ensure unique transaction each test run
    const timestamp = Date.now()
    const transaction = {
      date: '2024-01-15',
      description: `Integration Test Transaction ${timestamp}`,
      amount: -99.99,
      source_id: testSourceId,
      source_category: 'Test Category',
      source_data: {
        'Original Column 1': 'Value 1',
        'Original Column 2': 'Value 2'
      }
    }

    const req = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: [transaction] }),
    })

    console.log('=== Running Integration Test ===')
    console.log('Transaction to import:', JSON.stringify(transaction, null, 2))

    const res = await POST(req)
    const body = await res.json()

    console.log('Response status:', res.status)
    console.log('Response body:', JSON.stringify(body, null, 2))

    // Check console logs for debugging
    const allLogs = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n')
    const allErrors = consoleErrSpy.mock.calls.map(call => call.join(' ')).join('\n')

    console.log('=== Console Logs ===')
    console.log(allLogs)

    if (allErrors) {
      console.log('=== Console Errors ===')
      console.log(allErrors)
    }

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      imported: 1,
      skipped: 0,
      total: 1
    })

    // Verify the transaction was actually inserted
    if (body.imported > 0) {
      // Query specifically for transactions from 2024-01-15
      const allTransactions = await transactionsModel.getAll(1, 100, 'created_at', 'desc', {
        showIgnored: undefined,
        dateFrom: '2024-01-15',
        dateTo: '2024-01-15'
      })

      console.log('Total transactions found for 2024-01-15:', allTransactions.total)
      console.log('Looking for description:', `Integration Test Transaction ${timestamp}`)

      const inserted = allTransactions.data.find(t => t.description === `Integration Test Transaction ${timestamp}`)

      console.log('Found inserted transaction:', inserted)
      expect(inserted).toBeTruthy()
      expect(inserted?.amount).toBe(-99.99)
      expect(inserted?.sourceCategory).toBe('Test Category')
    }
  })

  it('correctly normalizes payload and generates hash', async () => {
    const transaction = {
      date: '2024-01-20',
      description: 'Hash Test Transaction',
      amount: -50.00,
      source_id: testSourceId
    }

    const req = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: [transaction] }),
    })

    const res = await POST(req)
    const body = await res.json()

    console.log('Hash test response:', body)

    expect(res.status).toBe(200)
    expect(body.imported).toBe(1)

    // Try to import the same transaction again - should be skipped as duplicate
    const req2 = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: [transaction] }),
    })

    const res2 = await POST(req2)
    const body2 = await res2.json()

    console.log('Duplicate test response:', body2)

    expect(res2.status).toBe(200)
    expect(body2.skipped).toBe(1)
    expect(body2.imported).toBe(0)
  })
})