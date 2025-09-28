/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/transactions/search/route'
import { transactionsModel } from '@/db/models/transactions.model'

// Mock the transactions model
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    search: jest.fn(),
  },
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>

const sampleResults = [
  { id: 1, sourceId: 1, unitId: 1, date: '2024-01-01', description: 'TEST ABC', amount: -10, sourceCategory: null, categoryId: null, ignore: false, notes: null, tags: null, createdAt: '2024-01-01', updatedAt: '2024-01-01', source: { id: 1, name: 'Test Bank', type: 'bank' } },
]

describe('/api/transactions/search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns results for valid query with default limit', async () => {
    mockTransactionsModel.search.mockResolvedValue(sampleResults as any)

    const req = new NextRequest('http://localhost:3000/api/transactions/search?q=ABC')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual({ data: sampleResults })
    expect(mockTransactionsModel.search).toHaveBeenCalledWith('ABC', 20)
  })

  it('trims query and clamps limit between 1 and 100', async () => {
    mockTransactionsModel.search.mockResolvedValue(sampleResults as any)

    // limit below range → 1
    let req = new NextRequest('http://localhost:3000/api/transactions/search?q=%20%20abc%20%20&limit=0')
    await GET(req)
    expect(mockTransactionsModel.search).toHaveBeenLastCalledWith('abc', 1)

    // limit above range → 100
    req = new NextRequest('http://localhost:3000/api/transactions/search?q=abc&limit=999')
    await GET(req)
    expect(mockTransactionsModel.search).toHaveBeenLastCalledWith('abc', 100)

    // limit invalid → default 20
    req = new NextRequest('http://localhost:3000/api/transactions/search?q=abc&limit=not-a-number')
    await GET(req)
    expect(mockTransactionsModel.search).toHaveBeenLastCalledWith('abc', 20)
  })

  it('returns empty list and does not call search when q is missing or blank', async () => {
    let req = new NextRequest('http://localhost:3000/api/transactions/search')
    let res = await GET(req)
    let data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toEqual({ data: [] })
    expect(mockTransactionsModel.search).not.toHaveBeenCalled()

    req = new NextRequest('http://localhost:3000/api/transactions/search?q=%20%20%20')
    res = await GET(req)
    data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toEqual({ data: [] })
    expect(mockTransactionsModel.search).not.toHaveBeenCalled()
  })

  it('handles model errors with 500 status', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockTransactionsModel.search.mockRejectedValue(new Error('DB error'))

    const req = new NextRequest('http://localhost:3000/api/transactions/search?q=abc')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to search transactions' })

    consoleSpy.mockRestore()
  })
})

