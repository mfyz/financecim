/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/categories/dropdown/route'
import { categoriesModel } from '@/db/models/categories.model'

// Mock the categories model
jest.mock('@/db/models/categories.model', () => ({
  categoriesModel: {
    getForDropdown: jest.fn(),
  }
}))

const mockCategoriesModel = categoriesModel as jest.Mocked<typeof categoriesModel>

describe('Categories Dropdown API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/categories/dropdown', () => {
    const mockDropdownOptions = [
      { value: '1', label: 'Food & Dining' },
      { value: '2', label: '  Groceries' },
      { value: '3', label: '  Restaurants' },
      { value: '4', label: 'Transportation' },
      { value: '5', label: '  Gas' },
      { value: '6', label: '    Premium Gas' },
    ]

    it('should return dropdown formatted categories', async () => {
      mockCategoriesModel.getForDropdown.mockResolvedValue(mockDropdownOptions)

      const request = new NextRequest('http://localhost:3000/api/categories/dropdown')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockCategoriesModel.getForDropdown).toHaveBeenCalledTimes(1)
      expect(data).toEqual(mockDropdownOptions)
    })

    it('should return empty array when no categories exist', async () => {
      mockCategoriesModel.getForDropdown.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/categories/dropdown')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockCategoriesModel.getForDropdown.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/categories/dropdown')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch category options' })
      
      consoleSpy.mockRestore()
    })

    it('should maintain hierarchical indentation in labels', async () => {
      const hierarchicalOptions = [
        { value: '1', label: 'Parent Category' },
        { value: '2', label: '  Child Category' },
        { value: '3', label: '    Grandchild Category' },
      ]

      mockCategoriesModel.getForDropdown.mockResolvedValue(hierarchicalOptions)

      const request = new NextRequest('http://localhost:3000/api/categories/dropdown')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(hierarchicalOptions)
      
      // Verify indentation structure
      expect(data[0].label).toBe('Parent Category')
      expect(data[1].label).toBe('  Child Category')
      expect(data[2].label).toBe('    Grandchild Category')
    })
  })
})