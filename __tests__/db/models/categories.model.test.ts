/**
 * @jest-environment node
 */

import { categoriesModel, CategoryWithChildren } from '@/db/models/categories.model'
import { Category } from '@/db/schema'

// Mock the database connection
jest.mock('@/db/connection', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        orderBy: jest.fn(() => Promise.resolve([])),
        where: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve([])),
          orderBy: jest.fn(() => Promise.resolve([]))
        }))
      }))
    })),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([]))
      }))
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([]))
        }))
      }))
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([]))
      }))
    }))
  })),
}))

describe('Categories Model', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockCategories: Category[] = [
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
    },
    {
      id: 3,
      name: 'Transportation',
      parentCategoryId: null,
      color: '#3B82F6',
      icon: '🚗',
      monthlyBudget: 500,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ]

  describe('buildHierarchy', () => {
    it('should build hierarchical structure correctly', () => {
      const hierarchical = categoriesModel.buildHierarchy(mockCategories)
      
      expect(hierarchical).toHaveLength(2) // 2 root categories
      expect(hierarchical[0].name).toBe('Food & Dining')
      expect(hierarchical[0].children).toHaveLength(1)
      expect(hierarchical[0].children![0].name).toBe('Groceries')
      expect(hierarchical[1].name).toBe('Transportation')
      expect(hierarchical[1].children).toHaveLength(0)
    })

    it('should handle empty array', () => {
      const hierarchical = categoriesModel.buildHierarchy([])
      expect(hierarchical).toEqual([])
    })

    it('should handle categories with missing parents', () => {
      const categoriesWithOrphans: Category[] = [
        ...mockCategories,
        {
          id: 4,
          name: 'Orphaned Category',
          parentCategoryId: 999, // Non-existent parent
          color: '#FF0000',
          icon: '❓',
          monthlyBudget: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]

      const hierarchical = categoriesModel.buildHierarchy(categoriesWithOrphans)
      
      // Orphaned category should be treated as root
      expect(hierarchical).toHaveLength(3)
      expect(hierarchical.find(cat => cat.name === 'Orphaned Category')).toBeDefined()
    })

    it('should handle deeply nested categories', () => {
      const deepCategories: Category[] = [
        {
          id: 1,
          name: 'Level 1',
          parentCategoryId: null,
          color: '#10B981',
          icon: '1️⃣',
          monthlyBudget: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Level 2',
          parentCategoryId: 1,
          color: '#10B981',
          icon: '2️⃣',
          monthlyBudget: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Level 3',
          parentCategoryId: 2,
          color: '#10B981',
          icon: '3️⃣',
          monthlyBudget: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]

      const hierarchical = categoriesModel.buildHierarchy(deepCategories)
      
      expect(hierarchical).toHaveLength(1)
      expect(hierarchical[0].name).toBe('Level 1')
      expect(hierarchical[0].children).toHaveLength(1)
      expect(hierarchical[0].children![0].name).toBe('Level 2')
      expect(hierarchical[0].children![0].children).toHaveLength(1)
      expect(hierarchical[0].children![0].children![0].name).toBe('Level 3')
    })
  })

  describe('checkCircularDependency', () => {
    it('should detect self-parent relationship', async () => {
      // Mock getById to return category when called
      const mockGetById = jest.spyOn(categoriesModel, 'getById')
      
      const result = await categoriesModel.checkCircularDependency(1, 1)
      expect(result).toBe(true)
      
      mockGetById.mockRestore()
    })

    it('should detect circular dependency chain', async () => {
      const mockGetById = jest.spyOn(categoriesModel, 'getById')
      
      // Mock chain: 1 -> 2 -> 3 -> 1 (circular)
      mockGetById
        .mockResolvedValueOnce({ // First call for parent 2
          id: 2,
          parentCategoryId: 3,
          name: 'Category 2',
          color: '#000000',
          icon: null,
          monthlyBudget: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        })
        .mockResolvedValueOnce({ // Second call for parent 3
          id: 3,
          parentCategoryId: 1, // Points back to category 1
          name: 'Category 3',
          color: '#000000',
          icon: null,
          monthlyBudget: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        })

      const result = await categoriesModel.checkCircularDependency(1, 2)
      expect(result).toBe(true)
      
      mockGetById.mockRestore()
    })

    it('should allow valid parent relationships', async () => {
      const mockGetById = jest.spyOn(categoriesModel, 'getById')
      
      mockGetById
        .mockResolvedValueOnce({ // Parent category with no further parent
          id: 2,
          parentCategoryId: null,
          name: 'Category 2',
          color: '#000000',
          icon: null,
          monthlyBudget: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        })

      const result = await categoriesModel.checkCircularDependency(1, 2)
      expect(result).toBe(false)
      
      mockGetById.mockRestore()
    })

    it('should handle non-existent categories', async () => {
      const mockGetById = jest.spyOn(categoriesModel, 'getById')
      mockGetById.mockResolvedValue(null)

      const result = await categoriesModel.checkCircularDependency(1, 999)
      expect(result).toBe(false)
      
      mockGetById.mockRestore()
    })
  })

  describe('getForDropdown', () => {
    it('should format categories for dropdown with indentation', async () => {
      const mockGetAll = jest.spyOn(categoriesModel, 'getAll')
      
      const hierarchicalData: CategoryWithChildren[] = [
        {
          ...mockCategories[0],
          children: [
            {
              ...mockCategories[1],
              children: []
            }
          ]
        },
        {
          ...mockCategories[2],
          children: []
        }
      ]
      
      mockGetAll.mockResolvedValue(hierarchicalData)

      const dropdownOptions = await categoriesModel.getForDropdown()
      
      expect(dropdownOptions).toEqual([
        { value: '1', label: 'Food & Dining' },
        { value: '2', label: '  Groceries' },
        { value: '3', label: 'Transportation' }
      ])
      
      mockGetAll.mockRestore()
    })

    it('should handle empty categories list', async () => {
      const mockGetAll = jest.spyOn(categoriesModel, 'getAll')
      mockGetAll.mockResolvedValue([])

      const dropdownOptions = await categoriesModel.getForDropdown()
      expect(dropdownOptions).toEqual([])
      
      mockGetAll.mockRestore()
    })

    it('should handle deeply nested categories with proper indentation', async () => {
      const mockGetAll = jest.spyOn(categoriesModel, 'getAll')
      
      const deepHierarchy: CategoryWithChildren[] = [
        {
          id: 1,
          name: 'Level 0',
          parentCategoryId: null,
          color: '#000000',
          icon: null,
          monthlyBudget: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          children: [
            {
              id: 2,
              name: 'Level 1',
              parentCategoryId: 1,
              color: '#000000',
              icon: null,
              monthlyBudget: null,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              children: [
                {
                  id: 3,
                  name: 'Level 2',
                  parentCategoryId: 2,
                  color: '#000000',
                  icon: null,
                  monthlyBudget: null,
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-01T00:00:00Z',
                  children: []
                }
              ]
            }
          ]
        }
      ]
      
      mockGetAll.mockResolvedValue(deepHierarchy)

      const dropdownOptions = await categoriesModel.getForDropdown()
      
      expect(dropdownOptions).toEqual([
        { value: '1', label: 'Level 0' },
        { value: '2', label: '  Level 1' },
        { value: '3', label: '    Level 2' }
      ])
      
      mockGetAll.mockRestore()
    })
  })
})