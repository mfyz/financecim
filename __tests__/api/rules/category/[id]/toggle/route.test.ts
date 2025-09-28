/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/rules/category/[id]/toggle/route'
import { rulesModel } from '@/db/models/rules.model'

jest.mock('@/db/models/rules.model', () => ({
  rulesModel: {
    toggleCategoryRuleStatus: jest.fn(),
  },
}))

const mockRulesModel = rulesModel as jest.Mocked<typeof rulesModel>

describe('Category Rule Toggle API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/rules/category/[id]/toggle', () => {
    it('should successfully toggle category rule status', async () => {
      const mockRule = {
        id: 1,
        rule_type: 'description',
        pattern: 'STARBUCKS',
        match_type: 'contains',
        category_id: 3,
        priority: 1,
        active: false,
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
      }

      mockRulesModel.toggleCategoryRuleStatus.mockResolvedValue(mockRule)

      const response = await POST(
        new NextRequest('http://localhost/api/rules/category/1/toggle'),
        { params: Promise.resolve({ id: '1' }) }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({
        ...mockRule,
        created_at: mockRule.created_at.toISOString(),
        updated_at: mockRule.updated_at.toISOString(),
      })
      expect(mockRulesModel.toggleCategoryRuleStatus).toHaveBeenCalledWith(1)
      expect(mockRulesModel.toggleCategoryRuleStatus).toHaveBeenCalledTimes(1)
    })

    it('should return error for invalid rule ID format', async () => {
      const response = await POST(
        new NextRequest('http://localhost/api/rules/category/abc/toggle'),
        { params: Promise.resolve({ id: 'abc' }) }
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toEqual({ error: 'Invalid rule ID' })
      expect(mockRulesModel.toggleCategoryRuleStatus).not.toHaveBeenCalled()
    })

    it('should return 404 when category rule not found', async () => {
      mockRulesModel.toggleCategoryRuleStatus.mockResolvedValue(null)

      const response = await POST(
        new NextRequest('http://localhost/api/rules/category/999/toggle'),
        { params: Promise.resolve({ id: '999' }) }
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data).toEqual({ error: 'Category rule not found' })
      expect(mockRulesModel.toggleCategoryRuleStatus).toHaveBeenCalledWith(999)
      expect(mockRulesModel.toggleCategoryRuleStatus).toHaveBeenCalledTimes(1)
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockRulesModel.toggleCategoryRuleStatus.mockRejectedValue(new Error('Database connection failed'))

      const response = await POST(
        new NextRequest('http://localhost/api/rules/category/1/toggle'),
        { params: Promise.resolve({ id: '1' }) }
      )

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toEqual({ error: 'Failed to toggle category rule status' })
      expect(mockRulesModel.toggleCategoryRuleStatus).toHaveBeenCalledWith(1)
      expect(mockRulesModel.toggleCategoryRuleStatus).toHaveBeenCalledTimes(1)

      consoleSpy.mockRestore()
    })
  })
})