/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/rules/test/route'
import { rulesModel } from '@/db/models/rules.model'

jest.mock('@/db/models/rules.model', () => ({
  rulesModel: {
    applyRulesToTransaction: jest.fn(),
  },
}))

const mockRulesModel = rulesModel as jest.Mocked<typeof rulesModel>

describe('/api/rules/test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('applies rules to provided transaction-like input', async () => {
    const payload = {
      description: 'TEST AMAZON MARKETPLACE',
      sourceCategory: 'Shopping',
      sourceId: 1,
    }

    const result = { unitId: 2, categoryId: 5 }
    mockRulesModel.applyRulesToTransaction.mockResolvedValue(result as any)

    const req = new NextRequest('http://localhost:3000/api/rules/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(result)
    expect(mockRulesModel.applyRulesToTransaction).toHaveBeenCalledWith(payload)
  })

  it('validates required description', async () => {
    const req = new NextRequest('http://localhost:3000/api/rules/test', {
      method: 'POST',
      body: JSON.stringify({ description: '' }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid data')
    expect(mockRulesModel.applyRulesToTransaction).not.toHaveBeenCalled()
  })

  it('handles model errors with 500 status', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockRulesModel.applyRulesToTransaction.mockRejectedValue(new Error('DB error'))

    const req = new NextRequest('http://localhost:3000/api/rules/test', {
      method: 'POST',
      body: JSON.stringify({ description: 'ANY' }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to test rules' })

    spy.mockRestore()
  })
})

