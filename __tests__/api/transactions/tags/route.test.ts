/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/transactions/tags/route'
import { transactionsModel } from '@/db/models/transactions.model'

// Mock the transactions model
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getAllTags: jest.fn(),
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>

describe('/api/transactions/tags', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns all distinct tags', async () => {
    mockTransactionsModel.getAllTags.mockResolvedValue(['groceries', 'coffee', 'salary'])

    const request = new NextRequest('http://localhost:3000/api/transactions/tags')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ tags: ['groceries', 'coffee', 'salary'] })
    expect(mockTransactionsModel.getAllTags).toHaveBeenCalledTimes(1)
  })

  it('handles database errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockTransactionsModel.getAllTags.mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost:3000/api/transactions/tags')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch transaction tags' })
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

