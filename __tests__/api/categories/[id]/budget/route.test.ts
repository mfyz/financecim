/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/categories/[id]/budget/route'
import { categoriesModel } from '@/db/models/categories.model'

// Mock the categories model
jest.mock('@/db/models/categories.model', () => ({
  categoriesModel: {
    updateBudget: jest.fn(),
  }
}))

const mockCategoriesModel = categoriesModel as jest.Mocked<typeof categoriesModel>

describe('Categories Budget API Endpoint', () => {
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

  describe('PATCH /api/categories/[id]/budget', () => {
    it('should update category budget successfully', async () => {
      const updatedCategory = { ...mockCategory, monthlyBudget: 1000 }
      mockCategoriesModel.updateBudget.mockResolvedValue(updatedCategory)

      const request = new NextRequest('http://localhost:3000/api/categories/1/budget', {
        method: 'PATCH',
        body: JSON.stringify({ monthlyBudget: 1000 })
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockCategoriesModel.updateBudget).toHaveBeenCalledWith(1, 1000)
      expect(data).toEqual(updatedCategory)
    })

    it('should handle null budget (removing budget)', async () => {
      const updatedCategory = { ...mockCategory, monthlyBudget: null }
      mockCategoriesModel.updateBudget.mockResolvedValue(updatedCategory)

      const request = new NextRequest('http://localhost:3000/api/categories/1/budget', {
        method: 'PATCH',
        body: JSON.stringify({ monthlyBudget: null })
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockCategoriesModel.updateBudget).toHaveBeenCalledWith(1, null)
      expect(data).toEqual(updatedCategory)
    })

    it('should return 400 for invalid category ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories/invalid/budget', {
        method: 'PATCH',
        body: JSON.stringify({ monthlyBudget: 1000 })
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid category ID' })
      expect(mockCategoriesModel.updateBudget).not.toHaveBeenCalled()
    })

    it('should return 400 for negative budget', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories/1/budget', {
        method: 'PATCH',
        body: JSON.stringify({ monthlyBudget: -100 })
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details).toBeDefined()
      expect(mockCategoriesModel.updateBudget).not.toHaveBeenCalled()
    })

    it('should return 400 for non-numeric budget', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories/1/budget', {
        method: 'PATCH',
        body: JSON.stringify({ monthlyBudget: 'invalid' })
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(mockCategoriesModel.updateBudget).not.toHaveBeenCalled()
    })

    it('should return 404 when category not found', async () => {
      mockCategoriesModel.updateBudget.mockRejectedValue(new Error('Category not found'))

      const request = new NextRequest('http://localhost:3000/api/categories/999/budget', {
        method: 'PATCH',
        body: JSON.stringify({ monthlyBudget: 1000 })
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Category not found' })
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockCategoriesModel.updateBudget.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/categories/1/budget', {
        method: 'PATCH',
        body: JSON.stringify({ monthlyBudget: 1000 })
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to update category budget' })
      
      consoleSpy.mockRestore()
    })

    it('should handle zero budget', async () => {
      const updatedCategory = { ...mockCategory, monthlyBudget: 0 }
      mockCategoriesModel.updateBudget.mockResolvedValue(updatedCategory)

      const request = new NextRequest('http://localhost:3000/api/categories/1/budget', {
        method: 'PATCH',
        body: JSON.stringify({ monthlyBudget: 0 })
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400) // Zero is not positive, should fail validation
      expect(data.error).toBe('Invalid input')
    })

    it('should handle decimal budget values', async () => {
      const updatedCategory = { ...mockCategory, monthlyBudget: 123.45 }
      mockCategoriesModel.updateBudget.mockResolvedValue(updatedCategory)

      const request = new NextRequest('http://localhost:3000/api/categories/1/budget', {
        method: 'PATCH',
        body: JSON.stringify({ monthlyBudget: 123.45 })
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockCategoriesModel.updateBudget).toHaveBeenCalledWith(1, 123.45)
      expect(data).toEqual(updatedCategory)
    })
  })
})