/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/transactions/tags/suggest/route'
import { transactionsModel } from '@/db/models/transactions.model'

jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getAllTags: jest.fn(),
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>

describe('/api/transactions/tags/suggest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns empty suggestions when q is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/transactions/tags/suggest')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ suggestions: [] })
    expect(mockTransactionsModel.getAllTags).not.toHaveBeenCalled()
  })

  it('returns suggestions matching the prefix (case-insensitive)', async () => {
    mockTransactionsModel.getAllTags.mockResolvedValue([
      'groceries',
      'Grocery-Run',
      'gas',
      'gym',
      'gift'
    ])

    const request = new NextRequest('http://localhost:3000/api/transactions/tags/suggest?q=gr')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.suggestions).toEqual(['groceries', 'grocery-run'])
  })

  it('respects the limit parameter', async () => {
    mockTransactionsModel.getAllTags.mockResolvedValue([
      'alpha', 'alpine', 'alps', 'algebra', 'almanac', 'algae'
    ])

    const request = new NextRequest('http://localhost:3000/api/transactions/tags/suggest?q=al&limit=3')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.suggestions.length).toBe(3)
  })

  it('caps the limit to a maximum of 50', async () => {
    mockTransactionsModel.getAllTags.mockResolvedValue(Array.from({ length: 100 }, (_, i) => `tag${i}`))

    const request = new NextRequest('http://localhost:3000/api/transactions/tags/suggest?q=tag&limit=200')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.suggestions.length).toBeLessThanOrEqual(50)
  })

  it('handles database errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockTransactionsModel.getAllTags.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/transactions/tags/suggest?q=a')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch tag suggestions' })

    consoleSpy.mockRestore()
  })
})
