/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server'
import { GET, POST } from '@/app/api/rules/unit/route'
import { rulesModel } from '@/db/models/rules.model'

jest.mock('@/db/models/rules.model', () => ({
  rulesModel: {
    getAllUnitRules: jest.fn(),
    createUnitRule: jest.fn(),
    getUnitRuleById: jest.fn(),
    updateUnitRule: jest.fn(),
    deleteUnitRule: jest.fn(),
    toggleUnitRuleStatus: jest.fn(),
    updateUnitRulePriorities: jest.fn()
  }
}))

const mockRulesModel = rulesModel as jest.Mocked<typeof rulesModel>

describe('Unit Rules API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/rules/unit', () => {
    it('should return all unit rules successfully', async () => {
      const mockRules = [
        {
          id: 1,
          ruleType: 'description' as const,
          pattern: 'Amazon',
          matchType: 'contains' as const,
          unitId: 1,
          priority: 100,
          active: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          ruleType: 'source' as const,
          pattern: '1',
          matchType: 'exact' as const,
          unitId: 2,
          priority: 90,
          active: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]

      mockRulesModel.getAllUnitRules.mockResolvedValue(mockRules)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockRules)
      expect(mockRulesModel.getAllUnitRules).toHaveBeenCalledTimes(1)
    })

    it('should handle errors when fetching unit rules', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockRulesModel.getAllUnitRules.mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch unit rules' })

      consoleSpy.mockRestore()
    })
  })

  describe('POST /api/rules/unit', () => {
    it('should create a new unit rule successfully', async () => {
      const newRule = {
        ruleType: 'description' as const,
        pattern: 'Grocery Store',
        matchType: 'contains' as const,
        unitId: 1,
        priority: 95,
        active: true
      }

      const createdRule = {
        id: 3,
        ...newRule,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }

      mockRulesModel.createUnitRule.mockResolvedValue(createdRule)

      const request = {
        json: async () => newRule
      } as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(createdRule)
      expect(mockRulesModel.createUnitRule).toHaveBeenCalledWith(newRule)
    })

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        ruleType: 'invalid',
        pattern: '',
        matchType: 'contains',
        unitId: -1,
        priority: -1
      }

      const request = {
        json: async () => invalidData
      } as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid data')
      expect(data.details).toBeDefined()
      expect(mockRulesModel.createUnitRule).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const validData = {
        ruleType: 'description' as const,
        pattern: 'Test Pattern',
        matchType: 'contains' as const,
        unitId: 1,
        priority: 50
      }

      mockRulesModel.createUnitRule.mockRejectedValue(new Error('Database error'))

      const request = {
        json: async () => validData
      } as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to create unit rule' })

      consoleSpy.mockRestore()
    })
  })
})