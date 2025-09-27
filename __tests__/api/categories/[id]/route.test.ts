/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/categories/[id]/route'
import { categoriesModel } from '@/db/models/categories.model'

// Mock the categories model
jest.mock('@/db/models/categories.model', () => ({
  categoriesModel: {
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}))

const mockCategoriesModel = categoriesModel as jest.Mocked<typeof categoriesModel>

describe('Categories Dynamic Route API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockCategory = {
    id: 1,
    name: 'Food & Dining',
    parentCategoryId: null,
    color: '#10B981',
    icon: '🍔',
    monthlyBudget: 800,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }

  describe('GET /api/categories/[id]', () => {
    it('should return a category by valid ID', async () => {
      mockCategoriesModel.getById.mockResolvedValue(mockCategory)

      const request = new NextRequest('http://localhost:3000/api/categories/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockCategoriesModel.getById).toHaveBeenCalledWith(1)
      expect(data).toEqual(mockCategory)
    })

    it('should return 404 for non-existent category', async () => {
      mockCategoriesModel.getById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/categories/999')
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Category not found' })
    })

    it('should return 400 for invalid category ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories/invalid')
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid category ID' })
      expect(mockCategoriesModel.getById).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockCategoriesModel.getById.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/categories/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch category' })
      
      consoleSpy.mockRestore()
    })
  })

  describe('PUT /api/categories/[id]', () => {
    const updateData = {
      name: 'Updated Food & Dining',
      color: '#FF0000',
      monthlyBudget: 1000
    }

    const updatedCategory = {
      ...mockCategory,
      ...updateData,
      updatedAt: '2024-01-02T00:00:00Z'
    }

    it('should update a category with valid data', async () => {
      mockCategoriesModel.update.mockResolvedValue(updatedCategory)

      const request = new NextRequest('http://localhost:3000/api/categories/1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockCategoriesModel.update).toHaveBeenCalledWith(1, updateData)
      expect(data).toEqual(updatedCategory)
    })

    it('should return 400 for invalid category ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories/invalid', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid category ID' })
      expect(mockCategoriesModel.update).not.toHaveBeenCalled()
    })

    it('should return 404 when category not found', async () => {
      mockCategoriesModel.update.mockRejectedValue(new Error('Category not found'))

      const request = new NextRequest('http://localhost:3000/api/categories/999', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Category not found' })
    })

    it('should return 400 for self-parent error', async () => {
      mockCategoriesModel.update.mockRejectedValue(new Error('A category cannot be its own parent'))

      const selfParentData = { parentCategoryId: 1 }
      const request = new NextRequest('http://localhost:3000/api/categories/1', {
        method: 'PUT',
        body: JSON.stringify(selfParentData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'A category cannot be its own parent' })
    })

    it('should return 400 for circular dependency error', async () => {
      mockCategoriesModel.update.mockRejectedValue(new Error('This change would create a circular dependency'))

      const circularData = { parentCategoryId: 2 }
      const request = new NextRequest('http://localhost:3000/api/categories/1', {
        method: 'PUT',
        body: JSON.stringify(circularData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'This change would create a circular dependency' })
    })

    it('should validate input data', async () => {
      const invalidData = {
        name: '', // Empty name should fail
        color: 'invalid-color' // Invalid color format
      }

      const request = new NextRequest('http://localhost:3000/api/categories/1', {
        method: 'PUT',
        body: JSON.stringify(invalidData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details).toBeDefined()
      expect(mockCategoriesModel.update).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockCategoriesModel.update.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/categories/1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to update category' })
      
      consoleSpy.mockRestore()
    })
  })

  describe('DELETE /api/categories/[id]', () => {
    it('should delete a category successfully', async () => {
      mockCategoriesModel.delete.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/categories/1')
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockCategoriesModel.delete).toHaveBeenCalledWith(1)
      expect(data).toEqual({ success: true })
    })

    it('should return 400 for invalid category ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories/invalid')
      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid category ID' })
      expect(mockCategoriesModel.delete).not.toHaveBeenCalled()
    })

    it('should return 404 when category not found', async () => {
      mockCategoriesModel.delete.mockRejectedValue(new Error('Category not found'))

      const request = new NextRequest('http://localhost:3000/api/categories/999')
      const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Category not found' })
    })

    it('should return 400 when category has subcategories', async () => {
      mockCategoriesModel.delete.mockRejectedValue(new Error('Cannot delete category with subcategories'))

      const request = new NextRequest('http://localhost:3000/api/categories/1')
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Cannot delete category with subcategories' })
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockCategoriesModel.delete.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/categories/1')
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to delete category' })
      
      consoleSpy.mockRestore()
    })
  })
})