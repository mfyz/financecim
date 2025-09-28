/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/rules/unit/[id]/route'
import { rulesModel } from '@/db/models/rules.model'

jest.mock('@/db/models/rules.model', () => ({
  rulesModel: {
    getUnitRuleById: jest.fn(),
    updateUnitRule: jest.fn(),
    deleteUnitRule: jest.fn()
  }
}))

const mockRulesModel = rulesModel as jest.Mocked<typeof rulesModel>

describe('Unit Rules [id] API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/rules/unit/[id]', () => {
    it('should return a unit rule by ID', async () => {
      const mockRule = {
        id: 1,
        ruleType: 'description' as const,
        pattern: 'Amazon',
        matchType: 'contains' as const,
        unitId: 1,
        priority: 100,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      mockRulesModel.getUnitRuleById.mockResolvedValue(mockRule)

      const request = {} as NextRequest
      const params = Promise.resolve({ id: '1' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockRule)
      expect(mockRulesModel.getUnitRuleById).toHaveBeenCalledWith(1)
    })

    it('should return 404 when unit rule not found', async () => {
      mockRulesModel.getUnitRuleById.mockResolvedValue(null)

      const request = {} as NextRequest
      const params = Promise.resolve({ id: '999' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Unit rule not found' })
    })

    it('should return 400 for invalid ID', async () => {
      const request = {} as NextRequest
      const params = Promise.resolve({ id: 'invalid' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid rule ID' })
      expect(mockRulesModel.getUnitRuleById).not.toHaveBeenCalled()
    })
  })

  describe('PUT /api/rules/unit/[id]', () => {
    it('should update a unit rule successfully', async () => {
      const updateData = {
        pattern: 'Updated Pattern',
        priority: 85
      }

      const updatedRule = {
        id: 1,
        ruleType: 'description' as const,
        pattern: 'Updated Pattern',
        matchType: 'contains' as const,
        unitId: 1,
        priority: 85,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }

      mockRulesModel.updateUnitRule.mockResolvedValue(updatedRule)

      const request = {
        json: async () => updateData
      } as NextRequest
      const params = Promise.resolve({ id: '1' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedRule)
      expect(mockRulesModel.updateUnitRule).toHaveBeenCalledWith(1, updateData)
    })

    it('should return 404 when updating non-existent unit rule', async () => {
      mockRulesModel.updateUnitRule.mockResolvedValue(null)

      const request = {
        json: async () => ({ pattern: 'Test' })
      } as NextRequest
      const params = Promise.resolve({ id: '999' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Unit rule not found' })
    })

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        ruleType: 'invalid',
        priority: -10
      }

      const request = {
        json: async () => invalidData
      } as NextRequest
      const params = Promise.resolve({ id: '1' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid data')
      expect(data.details).toBeDefined()
      expect(mockRulesModel.updateUnitRule).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /api/rules/unit/[id]', () => {
    it('should delete a unit rule successfully', async () => {
      const deletedRule = {
        id: 1,
        ruleType: 'description' as const,
        pattern: 'Amazon',
        matchType: 'contains' as const,
        unitId: 1,
        priority: 100,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      mockRulesModel.deleteUnitRule.mockResolvedValue(deletedRule)

      const request = {} as NextRequest
      const params = Promise.resolve({ id: '1' })

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ message: 'Unit rule deleted successfully' })
      expect(mockRulesModel.deleteUnitRule).toHaveBeenCalledWith(1)
    })

    it('should return 404 when deleting non-existent unit rule', async () => {
      mockRulesModel.deleteUnitRule.mockResolvedValue(null)

      const request = {} as NextRequest
      const params = Promise.resolve({ id: '999' })

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Unit rule not found' })
    })
  })
})