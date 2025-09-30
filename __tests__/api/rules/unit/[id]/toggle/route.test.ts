/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/rules/unit/[id]/toggle/route'
import { rulesModel } from '@/db/models/rules.model'

jest.mock('@/db/models/rules.model', () => ({
  rulesModel: {
    toggleUnitRuleStatus: jest.fn(),
  },
}))

const mockRulesModel = rulesModel as jest.Mocked<typeof rulesModel>

describe('Unit Rule Toggle API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/rules/unit/[id]/toggle', () => {
    it('should successfully toggle unit rule status', async () => {
      const mockRule = {
        id: 1,
        rule_type: 'description',
        pattern: 'WALMART',
        match_type: 'contains',
        unit_id: 2,
        priority: 1,
        active: false,
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
      }

      mockRulesModel.toggleUnitRuleStatus.mockResolvedValue(mockRule)

      const response = await POST(
        new NextRequest('http://localhost/api/rules/unit/1/toggle'),
        { params: Promise.resolve({ id: '1' }) }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({
        ...mockRule,
        created_at: mockRule.created_at.toISOString(),
        updated_at: mockRule.updated_at.toISOString(),
      })
      expect(mockRulesModel.toggleUnitRuleStatus).toHaveBeenCalledWith(1)
      expect(mockRulesModel.toggleUnitRuleStatus).toHaveBeenCalledTimes(1)
    })

    it('should return error for invalid rule ID format', async () => {
      const response = await POST(
        new NextRequest('http://localhost/api/rules/unit/invalid/toggle'),
        { params: Promise.resolve({ id: 'invalid' }) }
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toEqual({ error: 'Invalid rule ID' })
      expect(mockRulesModel.toggleUnitRuleStatus).not.toHaveBeenCalled()
    })

    it('should return 404 when unit rule not found', async () => {
      mockRulesModel.toggleUnitRuleStatus.mockResolvedValue(null)

      const response = await POST(
        new NextRequest('http://localhost/api/rules/unit/999/toggle'),
        { params: Promise.resolve({ id: '999' }) }
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data).toEqual({ error: 'Unit rule not found' })
      expect(mockRulesModel.toggleUnitRuleStatus).toHaveBeenCalledWith(999)
      expect(mockRulesModel.toggleUnitRuleStatus).toHaveBeenCalledTimes(1)
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockRulesModel.toggleUnitRuleStatus.mockRejectedValue(new Error('Database error'))

      const response = await POST(
        new NextRequest('http://localhost/api/rules/unit/1/toggle'),
        { params: Promise.resolve({ id: '1' }) }
      )

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toEqual({ error: 'Failed to toggle unit rule status' })
      expect(mockRulesModel.toggleUnitRuleStatus).toHaveBeenCalledWith(1)
      expect(mockRulesModel.toggleUnitRuleStatus).toHaveBeenCalledTimes(1)

      consoleSpy.mockRestore()
    })
  })
})