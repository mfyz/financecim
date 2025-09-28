/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/transactions/export/route'
import { transactionsModel } from '@/db/models/transactions.model'

jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getAll: jest.fn(),
  },
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>

const sample = {
  data: [
    {
      id: 1,
      sourceId: 10,
      unitId: 5,
      date: '2024-09-01',
      description: 'Grocery, "Weekly" run',
      amount: -123.45,
      sourceCategory: 'Groceries',
      categoryId: 3,
      ignore: false,
      notes: 'bought fruits & veg',
      tags: 'groceries,weekly',
      createdAt: '2024-09-01T10:00:00Z',
      updatedAt: '2024-09-01T10:00:00Z',
      unit: { id: 5, name: 'Personal', color: '#000000' },
      source: { id: 10, name: 'Test Bank', type: 'bank' },
      category: { id: 3, name: 'Food', color: '#00FF00' },
    },
  ],
  total: 1,
  totalPages: 1,
}

describe('/api/transactions/export', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns CSV with correct headers and content', async () => {
    mockTransactionsModel.getAll.mockResolvedValue(sample as any)

    const req = new NextRequest('http://localhost:3000/api/transactions/export?search=Grocery&sortBy=date&sortOrder=desc')
    const res = await GET(req)
    const text = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/csv')
    expect(res.headers.get('content-disposition')).toContain('transactions_export.csv')

    // First line is header
    const lines = text.trim().split('\n')
    expect(lines[0]).toBe('id,date,description,amount,source,source_type,unit,category,source_category,ignore,notes,tags')

    // Quoting: description contains comma and quotes → should be quoted and quotes doubled
    expect(lines[1]).toContain('"Grocery, ""Weekly"" run"')

    // Model called with expected args
    expect(mockTransactionsModel.getAll).toHaveBeenCalledWith(
      1,
      1000,
      'date',
      'desc',
      expect.objectContaining({ search: 'Grocery' })
    )
  })

  it('applies filter parsing and limit clamping', async () => {
    mockTransactionsModel.getAll.mockResolvedValue({ data: [], total: 0, totalPages: 0 } as any)

    const req = new NextRequest('http://localhost:3000/api/transactions/export?unitId=2&sourceId=3&categoryId=4&amountMin=10&amountMax=20&showIgnored=true&tags=a,b&limit=99999')
    await GET(req)

    expect(mockTransactionsModel.getAll).toHaveBeenCalledWith(
      1,
      5000, // clamped
      'date',
      'desc',
      {
        unitId: 2,
        sourceId: 3,
        categoryId: 4,
        amountMin: 10,
        amountMax: 20,
        showIgnored: true,
        tags: ['a', 'b'],
      }
    )
  })

  it('handles model errors with 500 status', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockTransactionsModel.getAll.mockRejectedValue(new Error('DB error'))

    const req = new NextRequest('http://localhost:3000/api/transactions/export')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to export transactions' })
    spy.mockRestore()
  })
})

