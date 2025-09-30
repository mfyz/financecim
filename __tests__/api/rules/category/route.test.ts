/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/rules/category/route'
import { rulesModel } from '@/db/models/rules.model'
import { NextRequest } from 'next/server'

jest.mock('@/db/models/rules.model', () => ({
  rulesModel: {
    getAllCategoryRules: jest.fn(),
    createCategoryRule: jest.fn()
  }
}))

const mockRulesModel = rulesModel as jest.Mocked<typeof rulesModel>

describe('Category Rules API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/rules/category', () => {
    it('should return all category rules successfully', async () => {
      const mockRules = [
        {
          id: 1,
          ruleType: 'description',
          pattern: 'WALMART',
          matchType: 'contains',
          categoryId: 1,
          category: { id: 1, name: 'Groceries' },
          priority: 1,
          active: true
        },
        {
          id: 2,
          ruleType: 'source_category',
          pattern: 'Gas Station',
          matchType: 'exact',
          categoryId: 2,
          category: { id: 2, name: 'Transportation' },
          priority: 2,
          active: true
        }
      ]

      mockRulesModel.getAllCategoryRules.mockResolvedValue(mockRules)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockRules)
      expect(mockRulesModel.getAllCategoryRules).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when no rules exist', async () => {
      mockRulesModel.getAllCategoryRules.mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
      expect(mockRulesModel.getAllCategoryRules).toHaveBeenCalledTimes(1)
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockRulesModel.getAllCategoryRules.mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch category rules' })
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching category rules:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('POST /api/rules/category', () => {
    it('should create a new category rule successfully', async () => {
      const newRule = {
        ruleType: 'description' as const,
        pattern: 'STARBUCKS',
        matchType: 'contains' as const,
        categoryId: 3,
        priority: 5,
        active: true
      }

      const createdRule = {
        id: 10,
        ...newRule,
        category: { id: 3, name: 'Coffee' },
        createdAt: '2025-03-15T10:00:00Z',
        updatedAt: '2025-03-15T10:00:00Z'
      }

      mockRulesModel.createCategoryRule.mockResolvedValue(createdRule)

      const request = new NextRequest('http://localhost:5601/api/rules/category', {
        method: 'POST',
        body: JSON.stringify(newRule)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(createdRule)
      expect(mockRulesModel.createCategoryRule).toHaveBeenCalledWith(newRule)
    })

    it('should create rule with minimum required fields', async () => {
      const minimalRule = {
        ruleType: 'source_category' as const,
        pattern: 'Dining',
        matchType: 'exact' as const,
        categoryId: 4,
        priority: 0
      }

      const createdRule = {
        id: 11,
        ...minimalRule,
        active: true, // Default value
        category: { id: 4, name: 'Restaurants' },
        createdAt: '2025-03-15T10:00:00Z',
        updatedAt: '2025-03-15T10:00:00Z'
      }

      mockRulesModel.createCategoryRule.mockResolvedValue(createdRule)

      const request = new NextRequest('http://localhost:5601/api/rules/category', {
        method: 'POST',
        body: JSON.stringify(minimalRule)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(createdRule)
      expect(mockRulesModel.createCategoryRule).toHaveBeenCalledWith(minimalRule)
    })

    it('should validate rule types correctly', async () => {
      const invalidRuleType = {
        ruleType: 'invalid_type',
        pattern: 'test',
        matchType: 'contains',
        categoryId: 1,
        priority: 1
      }

      const request = new NextRequest('http://localhost:5601/api/rules/category', {
        method: 'POST',
        body: JSON.stringify(invalidRuleType)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid data')
      expect(data).toHaveProperty('details')
      expect(mockRulesModel.createCategoryRule).not.toHaveBeenCalled()
    })

    it('should validate match types correctly', async () => {
      const invalidMatchType = {
        ruleType: 'description',
        pattern: 'test',
        matchType: 'invalid_match',
        categoryId: 1,
        priority: 1
      }

      const request = new NextRequest('http://localhost:5601/api/rules/category', {
        method: 'POST',
        body: JSON.stringify(invalidMatchType)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid data')
      expect(data).toHaveProperty('details')
      expect(mockRulesModel.createCategoryRule).not.toHaveBeenCalled()
    })

    it('should reject empty pattern', async () => {
      const emptyPattern = {
        ruleType: 'description',
        pattern: '',
        matchType: 'contains',
        categoryId: 1,
        priority: 1
      }

      const request = new NextRequest('http://localhost:5601/api/rules/category', {
        method: 'POST',
        body: JSON.stringify(emptyPattern)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid data')
      expect(mockRulesModel.createCategoryRule).not.toHaveBeenCalled()
    })

    it('should reject negative or non-integer category ID', async () => {
      const invalidCategoryId = {
        ruleType: 'description',
        pattern: 'test',
        matchType: 'contains',
        categoryId: -1,
        priority: 1
      }

      const request = new NextRequest('http://localhost:5601/api/rules/category', {
        method: 'POST',
        body: JSON.stringify(invalidCategoryId)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid data')
      expect(mockRulesModel.createCategoryRule).not.toHaveBeenCalled()
    })

    it('should reject negative priority', async () => {
      const negativePriority = {
        ruleType: 'description',
        pattern: 'test',
        matchType: 'contains',
        categoryId: 1,
        priority: -5
      }

      const request = new NextRequest('http://localhost:5601/api/rules/category', {
        method: 'POST',
        body: JSON.stringify(negativePriority)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid data')
      expect(mockRulesModel.createCategoryRule).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const validRule = {
        ruleType: 'description' as const,
        pattern: 'test',
        matchType: 'contains' as const,
        categoryId: 1,
        priority: 1
      }

      mockRulesModel.createCategoryRule.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:5601/api/rules/category', {
        method: 'POST',
        body: JSON.stringify(validRule)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to create category rule' })
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating category rule:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should handle malformed JSON gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const request = new NextRequest('http://localhost:5601/api/rules/category', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Failed to create category rule')

      consoleSpy.mockRestore()
    })
  })
})