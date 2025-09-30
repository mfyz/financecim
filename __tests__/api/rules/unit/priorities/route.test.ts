/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/rules/unit/priorities/route'
import { rulesModel } from '@/db/models/rules.model'

jest.mock('@/db/models/rules.model', () => ({
  rulesModel: {
    updateUnitRulePriorities: jest.fn(),
  },
}))

const mockRulesModel = rulesModel as jest.Mocked<typeof rulesModel>

describe('/api/rules/unit/priorities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('updates priorities for a list of unit rules', async () => {
    const payload = [
      { id: 1, priority: 100 },
      { id: 2, priority: 90 },
    ]

    const updated = [
      { id: 1, priority: 100 },
      { id: 2, priority: 90 },
    ]
    mockRulesModel.updateUnitRulePriorities.mockResolvedValue(updated as any)

    const req = new NextRequest('http://localhost:3000/api/rules/unit/priorities', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })

    const res = await PUT(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(updated)
    expect(mockRulesModel.updateUnitRulePriorities).toHaveBeenCalledWith(payload)
  })

  it('validates payload shape and values', async () => {
    const invalid = [{ id: -1, priority: -5 }]
    const req = new NextRequest('http://localhost:3000/api/rules/unit/priorities', {
      method: 'PUT',
      body: JSON.stringify(invalid),
    })

    const res = await PUT(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid data')
    expect(mockRulesModel.updateUnitRulePriorities).not.toHaveBeenCalled()
  })

  it('handles model errors with 500 status', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockRulesModel.updateUnitRulePriorities.mockRejectedValue(new Error('DB error'))

    const req = new NextRequest('http://localhost:3000/api/rules/unit/priorities', {
      method: 'PUT',
      body: JSON.stringify([{ id: 1, priority: 1 }]),
    })

    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to update unit rule priorities' })
    spy.mockRestore()
  })
})

