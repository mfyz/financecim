/**
 * @jest-environment node
 */

import { GET } from '@/app/api/import-log/stats/route'
import { importLogModel } from '@/db/models/import-log.model'

// Mock the import log model
jest.mock('@/db/models/import-log.model', () => ({
  importLogModel: {
    getImportStats: jest.fn(),
  }
}))

const mockImportLogModel = importLogModel as jest.Mocked<typeof importLogModel>

describe('/api/import-log/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns import statistics', async () => {
    const stats = {
      totalImports: 12,
      totalAdded: 3456,
      totalSkipped: 120,
      totalUpdated: 45,
      bySource: [
        { sourceId: 1, name: 'Test Bank', count: 8 },
        { sourceId: 2, name: 'Card', count: 4 },
      ],
    }
    mockImportLogModel.getImportStats.mockResolvedValue(stats)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(stats)
    expect(mockImportLogModel.getImportStats).toHaveBeenCalledTimes(1)
  })

  it('handles errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockImportLogModel.getImportStats.mockRejectedValue(new Error('DB error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch import stats' })
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

