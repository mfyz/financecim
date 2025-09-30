/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Create mock fns
const mockCreate = jest.fn()

// Mock the transactions model prior to importing handler
jest.doMock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getAll: jest.fn(),
    create: mockCreate,
  }
}))

let POST: any

beforeAll(async () => {
  const route = await import('@/app/api/transactions/route')
  POST = route.POST
})

describe('POST /api/transactions - tags normalization', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  it('normalizes tags string before creating', async () => {
    const body = {
      sourceId: 1,
      date: '2024-08-15',
      description: 'TEST PAYMENT',
      amount: -10.5,
      tags: '  Business Travel  , personal, business  ,  '
    }

    // Mock created object
    const created = { id: 99, ...body, tags: 'business-travel,personal,business' }
    mockCreate.mockResolvedValue(created)

    const req = new NextRequest('http://localhost:3000/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledTimes(1)
    // The handler should normalize and dedupe while preserving order
    expect(mockCreate).toHaveBeenCalledWith({
      ...body,
      ignore: false,
      tags: 'business-travel,personal,business'
    })
    expect(json).toEqual(created)
  })
})
