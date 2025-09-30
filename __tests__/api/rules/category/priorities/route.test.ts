/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/rules/category/priorities/route'
import { rulesModel } from '@/db/models/rules.model'

jest.mock('@/db/models/rules.model', () => ({
  rulesModel: {
    updateCategoryRulePriorities: jest.fn(),
  },
}))

const mockRulesModel = rulesModel as jest.Mocked<typeof rulesModel>

describe('/api/rules/category/priorities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('updates priorities for a list of category rules', async () => {
    const payload = [
      { id: 10, priority: 50 },
      { id: 11, priority: 40 },
    ]

    const updated = [
      { id: 10, priority: 50 },
      { id: 11, priority: 40 },
    ]
    mockRulesModel.updateCategoryRulePriorities.mockResolvedValue(updated as any)

    const req = new NextRequest('http://localhost:3000/api/rules/category/priorities', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })

    const res = await PUT(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(updated)
    expect(mockRulesModel.updateCategoryRulePriorities).toHaveBeenCalledWith(payload)
  })

  it('validates payload items', async () => {
    const invalid = [{ id: 0, priority: -1 }]
    const req = new NextRequest('http://localhost:3000/api/rules/category/priorities', {
      method: 'PUT',
      body: JSON.stringify(invalid),
    })

    const res = await PUT(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid data')
    expect(mockRulesModel.updateCategoryRulePriorities).not.toHaveBeenCalled()
  })

  it('handles model errors with 500 status', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockRulesModel.updateCategoryRulePriorities.mockRejectedValue(new Error('DB error'))

    const req = new NextRequest('http://localhost:3000/api/rules/category/priorities', {
      method: 'PUT',
      body: JSON.stringify([{ id: 1, priority: 1 }]),
    })

    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to update category rule priorities' })
    spy.mockRestore()
  })
})

