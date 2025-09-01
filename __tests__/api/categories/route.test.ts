/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/categories/route'
import { categoriesModel } from '@/db/models/categories.model'

// Mock the categories model
jest.mock('@/db/models/categories.model', () => ({
  categoriesModel: {
    getAll: jest.fn(),
    getAllFlat: jest.fn(),
    create: jest.fn(),
  }
}))

const mockCategoriesModel = categoriesModel as jest.Mocked<typeof categoriesModel>

describe('Categories API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/categories', () => {
    const mockCategories = [
      {
        id: 1,
        name: 'Food & Dining',
        parentCategoryId: null,
        color: '#10B981',
        icon: '🍔',
        monthlyBudget: 800,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        children: [
          {
            id: 2,
            name: 'Groceries',
            parentCategoryId: 1,
            color: '#10B981',
            icon: '🛒',
            monthlyBudget: 400,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            children: []
          }
        ]
      }
    ]

    const mockFlatCategories = [
      {
        id: 1,
        name: 'Food & Dining',
        parentCategoryId: null,
        color: '#10B981',
        icon: '🍔',
        monthlyBudget: 800,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Groceries',
        parentCategoryId: 1,
        color: '#10B981',
        icon: '🛒',
        monthlyBudget: 400,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ]

    it('should return hierarchical categories by default', async () => {
      mockCategoriesModel.getAll.mockResolvedValue(mockCategories)

      const request = new NextRequest('http://localhost:3000/api/categories')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockCategoriesModel.getAll).toHaveBeenCalledTimes(1)
      expect(mockCategoriesModel.getAllFlat).not.toHaveBeenCalled()
      expect(data).toEqual(mockCategories)
    })

    it('should return flat categories when flat=true', async () => {
      mockCategoriesModel.getAllFlat.mockResolvedValue(mockFlatCategories)

      const request = new NextRequest('http://localhost:3000/api/categories?flat=true')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockCategoriesModel.getAllFlat).toHaveBeenCalledTimes(1)
      expect(mockCategoriesModel.getAll).not.toHaveBeenCalled()
      expect(data).toEqual(mockFlatCategories)
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockCategoriesModel.getAll.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/categories')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch categories' })
      
      consoleSpy.mockRestore()
    })
  })

  describe('POST /api/categories', () => {
    const validCategory = {
      name: 'Entertainment',
      parentCategoryId: null,
      color: '#8B5CF6',
      icon: '🎮',
      monthlyBudget: 150
    }

    const createdCategory = {
      id: 3,
      ...validCategory,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }

    it('should create a new category with valid data', async () => {
      mockCategoriesModel.create.mockResolvedValue(createdCategory)

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify(validCategory)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(mockCategoriesModel.create).toHaveBeenCalledWith({
        name: 'Entertainment',
        parentCategoryId: null,
        color: '#8B5CF6',
        icon: '🎮',
        monthlyBudget: 150
      })
      expect(data).toEqual(createdCategory)
    })

    it('should handle missing required fields', async () => {
      const invalidData = {
        parentCategoryId: null,
        color: '#8B5CF6',
        icon: '🎮'
      }

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details).toBeDefined()
      expect(mockCategoriesModel.create).not.toHaveBeenCalled()
    })

    it('should validate color format', async () => {
      const invalidColorData = {
        name: 'Test Category',
        color: 'invalid-color',
        parentCategoryId: null
      }

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify(invalidColorData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(mockCategoriesModel.create).not.toHaveBeenCalled()
    })

    it('should handle optional fields correctly', async () => {
      const minimalCategory = {
        name: 'Minimal Category',
        color: '#FF0000'
      }

      const createdMinimal = {
        id: 4,
        name: 'Minimal Category',
        parentCategoryId: null,
        color: '#FF0000',
        icon: null,
        monthlyBudget: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      mockCategoriesModel.create.mockResolvedValue(createdMinimal)

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify(minimalCategory)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(mockCategoriesModel.create).toHaveBeenCalledWith({
        name: 'Minimal Category',
        parentCategoryId: null,
        color: '#FF0000',
        icon: null,
        monthlyBudget: null
      })
      expect(data).toEqual(createdMinimal)
    })

    it('should handle database errors during creation', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockCategoriesModel.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify(validCategory)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to create category' })
      
      consoleSpy.mockRestore()
    })
  })
})