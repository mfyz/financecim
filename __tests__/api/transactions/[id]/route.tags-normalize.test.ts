/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

const mockUpdate = jest.fn()
const mockGetById = jest.fn()

// Mock the transactions model
jest.doMock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getById: mockGetById,
    update: mockUpdate,
    delete: jest.fn(),
  }
}))

let PUT: any

beforeAll(async () => {
  const route = await import('@/app/api/transactions/[id]/route')
  PUT = route.PUT
})

describe('PUT /api/transactions/[id] - tags normalization', () => {
  beforeEach(() => {
    mockUpdate.mockReset()
  })

  it('normalizes tags string before updating', async () => {
    const id = 123
    const body = {
      tags: 'Work,  travel,work',
    }

    const req = new NextRequest(`http://localhost:3000/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const updated = { id, tags: 'work,travel' }
    mockUpdate.mockResolvedValue(updated)

    const res = await PUT(req, { params: Promise.resolve({ id: String(id) }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(id, { tags: 'work,travel' })
    expect(json).toEqual(updated)
  })
})
