/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '@/app/api/rules/category/[id]/route'
import { rulesModel } from '@/db/models/rules.model'
import { NextRequest } from 'next/server'

jest.mock('@/db/models/rules.model', () => ({
  rulesModel: {
    getCategoryRuleById: jest.fn(),
    updateCategoryRule: jest.fn(),
    deleteCategoryRule: jest.fn()
  }
}))

const mockRulesModel = rulesModel as jest.Mocked<typeof rulesModel>

describe('Category Rule by ID API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/rules/category/[id]', () => {
    it('should return a category rule by ID successfully', async () => {
      const mockRule = {
        id: 1,
        ruleType: 'description',
        pattern: 'WALMART',
        matchType: 'contains',
        categoryId: 1,
        category: { id: 1, name: 'Groceries' },
        priority: 1,
        active: true,
        createdAt: '2025-03-15T10:00:00Z',
        updatedAt: '2025-03-15T10:00:00Z'
      }

      mockRulesModel.getCategoryRuleById.mockResolvedValue(mockRule)

      const request = new NextRequest('http://localhost:5601/api/rules/category/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockRule)
      expect(mockRulesModel.getCategoryRuleById).toHaveBeenCalledWith(1)
    })

    it('should return 404 when rule not found', async () => {
      mockRulesModel.getCategoryRuleById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:5601/api/rules/category/999')
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Category rule not found' })
      expect(mockRulesModel.getCategoryRuleById).toHaveBeenCalledWith(999)
    })

    it('should return 400 for invalid ID format', async () => {
      const request = new NextRequest('http://localhost:5601/api/rules/category/invalid')
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid rule ID' })
      expect(mockRulesModel.getCategoryRuleById).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockRulesModel.getCategoryRuleById.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:5601/api/rules/category/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch category rule' })
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching category rule:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('PUT /api/rules/category/[id]', () => {
    it('should update a category rule successfully', async () => {
      const updateData = {
        pattern: 'TARGET',
        priority: 3,
        active: false
      }

      const updatedRule = {
        id: 1,
        ruleType: 'description',
        pattern: 'TARGET',
        matchType: 'contains',
        categoryId: 1,
        category: { id: 1, name: 'Groceries' },
        priority: 3,
        active: false,
        createdAt: '2025-03-15T10:00:00Z',
        updatedAt: '2025-03-16T10:00:00Z'
      }

      mockRulesModel.updateCategoryRule.mockResolvedValue(updatedRule)

      const request = new NextRequest('http://localhost:5601/api/rules/category/1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedRule)
      expect(mockRulesModel.updateCategoryRule).toHaveBeenCalledWith(1, updateData)
    })

    it('should update all fields when provided', async () => {
      const fullUpdate = {
        ruleType: 'source_category' as const,
        pattern: 'New Pattern',
        matchType: 'exact' as const,
        categoryId: 5,
        priority: 10,
        active: true
      }

      const updatedRule = {
        id: 1,
        ...fullUpdate,
        category: { id: 5, name: 'New Category' },
        createdAt: '2025-03-15T10:00:00Z',
        updatedAt: '2025-03-16T10:00:00Z'
      }

      mockRulesModel.updateCategoryRule.mockResolvedValue(updatedRule)

      const request = new NextRequest('http://localhost:5601/api/rules/category/1', {
        method: 'PUT',
        body: JSON.stringify(fullUpdate)
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedRule)
      expect(mockRulesModel.updateCategoryRule).toHaveBeenCalledWith(1, fullUpdate)
    })

    it('should return 404 when rule not found', async () => {
      mockRulesModel.updateCategoryRule.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:5601/api/rules/category/999', {
        method: 'PUT',
        body: JSON.stringify({ pattern: 'New' })
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Category rule not found' })
    })

    it('should return 400 for invalid ID format', async () => {
      const request = new NextRequest('http://localhost:5601/api/rules/category/invalid', {
        method: 'PUT',
        body: JSON.stringify({ pattern: 'New' })
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid rule ID' })
      expect(mockRulesModel.updateCategoryRule).not.toHaveBeenCalled()
    })

    it('should validate update data', async () => {
      const invalidData = {
        ruleType: 'invalid_type',
        priority: -5
      }

      const request = new NextRequest('http://localhost:5601/api/rules/category/1', {
        method: 'PUT',
        body: JSON.stringify(invalidData)
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid data')
      expect(data).toHaveProperty('details')
      expect(mockRulesModel.updateCategoryRule).not.toHaveBeenCalled()
    })

    it('should reject empty pattern', async () => {
      const invalidData = {
        pattern: ''
      }

      const request = new NextRequest('http://localhost:5601/api/rules/category/1', {
        method: 'PUT',
        body: JSON.stringify(invalidData)
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid data')
      expect(mockRulesModel.updateCategoryRule).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockRulesModel.updateCategoryRule.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:5601/api/rules/category/1', {
        method: 'PUT',
        body: JSON.stringify({ pattern: 'New' })
      })
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to update category rule' })
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error updating category rule:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('DELETE /api/rules/category/[id]', () => {
    it('should delete a category rule successfully', async () => {
      mockRulesModel.deleteCategoryRule.mockResolvedValue(true)

      const request = new NextRequest('http://localhost:5601/api/rules/category/1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ message: 'Category rule deleted successfully' })
      expect(mockRulesModel.deleteCategoryRule).toHaveBeenCalledWith(1)
    })

    it('should return 404 when rule not found', async () => {
      mockRulesModel.deleteCategoryRule.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:5601/api/rules/category/999', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Category rule not found' })
      expect(mockRulesModel.deleteCategoryRule).toHaveBeenCalledWith(999)
    })

    it('should return 400 for invalid ID format', async () => {
      const request = new NextRequest('http://localhost:5601/api/rules/category/invalid', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid rule ID' })
      expect(mockRulesModel.deleteCategoryRule).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockRulesModel.deleteCategoryRule.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:5601/api/rules/category/1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to delete category rule' })
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error deleting category rule:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })
})