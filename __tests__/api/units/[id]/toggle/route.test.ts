/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'

// Mocks for units model
const mockToggleActive = jest.fn()

jest.doMock('@/db/models/units.model', () => ({
  unitsModel: {
    toggleActive: mockToggleActive,
  },
}))

// Load the actual route handler
let POST: any
beforeAll(async () => {
  const handlers = await import('@/app/api/units/[id]/toggle/route')
  POST = handlers.POST
})

beforeEach(() => {
  jest.clearAllMocks()
  mockToggleActive.mockReset()
})

describe('/api/units/[id]/toggle', () => {
  const paramsOk = { params: Promise.resolve({ id: '1' }) }
  const paramsInvalid = { params: Promise.resolve({ id: 'abc' }) }
  const paramsMissing = { params: Promise.resolve({ id: '0' }) }

  it('toggles unit active status successfully', async () => {
    const updated = {
      id: 1,
      name: 'Personal',
      description: 'desc',
      color: '#111111',
      icon: '👤',
      active: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    }
    mockToggleActive.mockResolvedValue(updated)

    const req = new NextRequest('http://localhost:3000/api/units/1/toggle', { method: 'POST' })
    const res = await POST(req, paramsOk)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({
      success: true,
      data: updated,
      message: 'Unit deactivated successfully',
    })
    expect(mockToggleActive).toHaveBeenCalledWith(1)
  })

  it('returns 400 for invalid id', async () => {
    const req = new NextRequest('http://localhost:3000/api/units/abc/toggle', { method: 'POST' })
    const res = await POST(req, paramsInvalid)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json).toEqual({
      success: false,
      error: 'Invalid ID',
      message: 'Unit ID must be a positive integer',
    })
    expect(mockToggleActive).not.toHaveBeenCalled()
  })

  it('returns 400 for non-positive id', async () => {
    const req = new NextRequest('http://localhost:3000/api/units/0/toggle', { method: 'POST' })
    const res = await POST(req, paramsMissing)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json).toEqual({
      success: false,
      error: 'Invalid ID',
      message: 'Unit ID must be a positive integer',
    })
    expect(mockToggleActive).not.toHaveBeenCalled()
  })

  it('returns 404 when unit not found', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockToggleActive.mockRejectedValue(new Error('Unit not found'))

    const req = new NextRequest('http://localhost:3000/api/units/1/toggle', { method: 'POST' })
    const res = await POST(req, paramsOk)
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json).toEqual({
      success: false,
      error: 'Unit not found',
      message: 'Unit with ID 1 does not exist',
    })
    spy.mockRestore()
  })

  it('handles unexpected errors', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockToggleActive.mockRejectedValue(new Error('DB failure'))

    const req = new NextRequest('http://localhost:3000/api/units/1/toggle', { method: 'POST' })
    const res = await POST(req, paramsOk)
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toEqual({
      success: false,
      error: 'Internal server error',
      message: 'Failed to toggle unit status',
    })
    spy.mockRestore()
  })
})

