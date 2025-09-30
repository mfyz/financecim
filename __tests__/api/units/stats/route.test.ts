/**
 * @jest-environment node
 */

import { GET } from '@/app/api/units/stats/route'
import { unitsModel } from '@/db/models/units.model'

jest.mock('@/db/models/units.model', () => ({
  unitsModel: {
    getCountByStatus: jest.fn(),
  },
}))

const mockUnitsModel = unitsModel as jest.Mocked<typeof unitsModel>

describe('/api/units/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns unit status counts', async () => {
    mockUnitsModel.getCountByStatus.mockResolvedValue({ active: 3, inactive: 1 })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ active: 3, inactive: 1 })
    expect(mockUnitsModel.getCountByStatus).toHaveBeenCalledTimes(1)
  })

  it('handles errors gracefully', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockUnitsModel.getCountByStatus.mockRejectedValue(new Error('DB error'))

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to fetch unit stats' })
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

