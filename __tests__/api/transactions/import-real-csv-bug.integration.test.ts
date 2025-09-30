/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/transactions/import/route'
import { transactionsModel } from '@/db/models/transactions.model'
import { sourcesModel } from '@/db/models/sources.model'

describe('Real CSV Import Bug - Integration Test', () => {
  let testSourceId: number

  beforeAll(async () => {
    // Create a test source
    const source = await sourcesModel.create({
      name: 'Bug Test Bank',
      type: 'bank'
    })
    testSourceId = source.id
  })

  it('reproduces the real bug: CSV with Type and Category columns', async () => {
    // Simulate a CSV with these columns:
    // Date,Description,Amount,Type,Category
    // 2024-01-15,Coffee Shop,-4.50,Purchase,Dining
    //
    // User maps column index 4 (Category) to source_category
    // But after import, the transaction shows "Purchase" instead of "Dining"

    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category']
    const row = ['2024-01-15', 'Coffee Shop', '-4.50', 'Purchase', 'Dining']

    // Simulate what the frontend sends
    // Column mapping: source_category maps to index 4 (Category column)
    const columnMapping = {
      date: 0,
      description: 1,
      amount: 2,
      source_category: 4  // This should map to "Dining", not "Purchase"
    }

    // Simulate serializeSourceData function from frontend
    const source_data: Record<string, any> = {}
    headers.forEach((header, index) => {
      const key = header.trim() || `column_${index + 1}`
      source_data[key] = row[index] || null
    })

    // This is what the frontend sends to the API
    const transaction = {
      date: row[columnMapping.date],
      description: row[columnMapping.description],
      amount: parseFloat(row[columnMapping.amount]),
      source_id: testSourceId,
      source_category: row[columnMapping.source_category], // This should be "Dining"
      category_id: null,
      unit_id: null,
      source_data: source_data, // Contains { Date: '...', Type: 'Purchase', Category: 'Dining' }
      allowDuplicate: false
    }

    console.log('Transaction being sent to API:', JSON.stringify(transaction, null, 2))
    console.log('Expected source_category:', 'Dining')
    console.log('Actual source_category in payload:', transaction.source_category)

    const req = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: [transaction] }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.imported).toBe(1)

    // Now fetch the transaction from database to see what was actually stored
    const allTransactions = await transactionsModel.getAll(1, 100, 'created_at', 'desc', {
      showIgnored: undefined,
      dateFrom: '2024-01-15',
      dateTo: '2024-01-15',
      search: 'Coffee Shop'
    })

    const inserted = allTransactions.data.find(t => t.description === 'Coffee Shop')
    console.log('Inserted transaction from DB:', JSON.stringify(inserted, null, 2))

    expect(inserted).toBeTruthy()

    // THIS IS THE CRITICAL TEST
    // The sourceCategory should be "Dining" (from Category column)
    // NOT "Purchase" (from Type column)
    expect(inserted?.sourceCategory).toBe('Dining')
    expect(inserted?.sourceCategory).not.toBe('Purchase')
  })

  it('verifies the bug does not occur with simpler CSV', async () => {
    // CSV without confusing columns:
    // Date,Description,Amount,Category
    // 2024-01-16,Grocery Store,-85.50,Groceries

    const headers = ['Date', 'Description', 'Amount', 'Category']
    const row = ['2024-01-16', 'Grocery Store', '-85.50', 'Groceries']

    const columnMapping = {
      date: 0,
      description: 1,
      amount: 2,
      source_category: 3
    }

    const source_data: Record<string, any> = {}
    headers.forEach((header, index) => {
      source_data[header.trim() || `column_${index + 1}`] = row[index] || null
    })

    const transaction = {
      date: row[columnMapping.date],
      description: row[columnMapping.description],
      amount: parseFloat(row[columnMapping.amount]),
      source_id: testSourceId,
      source_category: row[columnMapping.source_category],
      category_id: null,
      unit_id: null,
      source_data: source_data,
      allowDuplicate: false
    }

    const req = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions: [transaction] }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.imported).toBe(1)

    const allTransactions = await transactionsModel.getAll(1, 100, 'created_at', 'desc', {
      showIgnored: undefined,
      dateFrom: '2024-01-16',
      dateTo: '2024-01-16',
      search: 'Grocery Store'
    })

    const inserted = allTransactions.data.find(t => t.description === 'Grocery Store')

    expect(inserted).toBeTruthy()
    expect(inserted?.sourceCategory).toBe('Groceries')
  })
})