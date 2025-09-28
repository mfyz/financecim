/**
 * @jest-environment node
 */

import { GET } from '@/app/api/sources/stats/route'
import { sourcesModel } from '@/db/models/sources.model'

jest.mock('@/db/models/sources.model', () => ({
  sourcesModel: {
    getCountByType: jest.fn(),
  },
}))

const mockSourcesModel = sourcesModel as jest.Mocked<typeof sourcesModel>

describe('/api/sources/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns source counts by type', async () => {
    const counts = [
      { type: 'bank', count: 2 },
      { type: 'credit_card', count: 1 },
      { type: 'manual', count: 1 },
    ]
    mockSourcesModel.getCountByType.mockResolvedValue(counts)

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual(counts)
    expect(mockSourcesModel.getCountByType).toHaveBeenCalledTimes(1)
  })

  it('handles errors gracefully', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockSourcesModel.getCountByType.mockRejectedValue(new Error('DB error'))

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to fetch source stats' })
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

