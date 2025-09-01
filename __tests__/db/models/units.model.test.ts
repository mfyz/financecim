/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals'

// Create a mock database that simulates the full Drizzle ORM chain
const createMockDb = () => {
  let mockData: any[] = []
  let shouldThrow = false
  let errorToThrow: Error | null = null

  return {
    setData: (data: any[]) => { mockData = data },
    setShouldThrow: (error: Error | null = null) => { 
      shouldThrow = !!error
      errorToThrow = error
    },
    select: () => ({
      from: () => ({
        // For both getById and getActive - where clause that can be awaited OR chained
        where: (condition: any) => {
          const filteredData = mockData.filter(() => true)
          
          // Create a thenable object that can be awaited (for getById) 
          // AND has orderBy method (for getActive)
          const result: any = {
            // For getActive: where().orderBy() chain
            orderBy: () => shouldThrow ? Promise.reject(errorToThrow) : Promise.resolve(filteredData),
            // For getById: make this thenable so it can be awaited
            then: (resolve: any, reject: any) => {
              if (shouldThrow) {
                reject(errorToThrow)
              } else {
                resolve(filteredData)
              }
            }
          }
          
          return result
        },
        // For getAll - direct orderBy 
        orderBy: () => shouldThrow ? Promise.reject(errorToThrow) : Promise.resolve(mockData)
      }),
      orderBy: () => shouldThrow ? Promise.reject(errorToThrow) : Promise.resolve(mockData)
    }),
    insert: () => ({
      values: (data: any) => ({
        returning: () => shouldThrow ? Promise.reject(errorToThrow) : Promise.resolve([{ id: 1, ...data }])
      })
    }),
    update: () => ({
      set: (data: any) => ({
        where: () => ({
          returning: () => shouldThrow ? Promise.reject(errorToThrow) : Promise.resolve([{ id: 1, ...mockData[0], ...data }])
        })
      })
    }),
    delete: () => ({
      where: () => shouldThrow ? Promise.reject(errorToThrow) : Promise.resolve()
    })
  }
}

const mockDb = createMockDb()

// Mock the database connection
jest.doMock('@/db/connection', () => ({
  getDatabase: () => mockDb
}))

// Mock the schema
jest.doMock('@/db/schema', () => ({
  units: {
    id: 'id',
    name: 'name', 
    description: 'description',
    color: 'color',
    icon: 'icon',
    active: 'active',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
}))

// Import the model after mocking
let unitsModel: any

beforeAll(async () => {
  const model = await import('@/db/models/units.model')
  unitsModel = model.unitsModel
})

// Mock data
const mockUnit = {
  id: 1,
  name: 'Test Personal',
  description: 'Personal expenses and income',
  color: '#6B7280',
  icon: '👤',
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

const mockNewUnit = {
  name: 'New Business Unit',
  description: 'New business operations',
  color: '#3B82F6',
  icon: '💼',
  active: true
}

describe('unitsModel', () => {
  beforeEach(() => {
    // Reset mock state
    mockDb.setData([mockUnit])
    mockDb.setShouldThrow(null)
  })

  describe('getAll', () => {
    it('should return all units ordered by createdAt', async () => {
      const mockUnits = [
        mockUnit, 
        { ...mockUnit, id: 2, name: 'Test Business', icon: '💼' }
      ]
      mockDb.setData(mockUnits)
      
      const result = await unitsModel.getAll()
      
      expect(result).toEqual(mockUnits)
    })

    it('should return empty array when no units exist', async () => {
      mockDb.setData([])
      
      const result = await unitsModel.getAll()
      
      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      mockDb.setShouldThrow(new Error('Database error'))
      
      await expect(unitsModel.getAll()).rejects.toThrow('Database error')
    })
  })

  describe('getById', () => {
    it('should return unit when found', async () => {
      mockDb.setData([mockUnit])
      
      const result = await unitsModel.getById(1)
      
      expect(result).toEqual(mockUnit)
    })

    it('should return null when unit not found', async () => {
      mockDb.setData([])
      
      const result = await unitsModel.getById(999)
      
      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      mockDb.setShouldThrow(new Error('Database error'))
      
      await expect(unitsModel.getById(1)).rejects.toThrow('Database error')
    })
  })

  describe('create', () => {
    it('should create and return new unit', async () => {
      const result = await unitsModel.create(mockNewUnit)
      
      expect(result).toEqual(expect.objectContaining(mockNewUnit))
      expect(result.id).toBeDefined()
    })

    it('should handle creation errors', async () => {
      mockDb.setShouldThrow(new Error('Creation failed'))
      
      await expect(unitsModel.create(mockNewUnit)).rejects.toThrow('Creation failed')
    })
  })

  describe('update', () => {
    it('should update and return updated unit', async () => {
      // Mock getById method to return existing unit
      const originalGetById = unitsModel.getById
      unitsModel.getById = jest.fn().mockResolvedValue(mockUnit)
      
      const updateData = { name: 'Updated Unit Name' }
      
      const result = await unitsModel.update(1, updateData)
      
      expect(result).toEqual(expect.objectContaining(updateData))
      expect(unitsModel.getById).toHaveBeenCalledWith(1)
      
      // Restore original method
      unitsModel.getById = originalGetById
    })

    it('should throw error when unit not found', async () => {
      const originalGetById = unitsModel.getById
      unitsModel.getById = jest.fn().mockResolvedValue(null)
      
      await expect(unitsModel.update(999, { name: 'Updated' })).rejects.toThrow('Unit not found')
      
      unitsModel.getById = originalGetById
    })

    it('should handle update errors', async () => {
      const originalGetById = unitsModel.getById
      unitsModel.getById = jest.fn().mockResolvedValue(mockUnit)
      mockDb.setShouldThrow(new Error('Update failed'))
      
      await expect(unitsModel.update(1, { name: 'Updated' })).rejects.toThrow('Update failed')
      
      unitsModel.getById = originalGetById
    })
  })

  describe('delete', () => {
    it('should delete unit successfully', async () => {
      const originalGetById = unitsModel.getById
      unitsModel.getById = jest.fn().mockResolvedValue(mockUnit)
      
      await unitsModel.delete(1)
      
      expect(unitsModel.getById).toHaveBeenCalledWith(1)
      
      unitsModel.getById = originalGetById
    })

    it('should throw error when unit not found', async () => {
      const originalGetById = unitsModel.getById
      unitsModel.getById = jest.fn().mockResolvedValue(null)
      
      await expect(unitsModel.delete(999)).rejects.toThrow('Unit not found')
      
      unitsModel.getById = originalGetById
    })

    it('should handle foreign key constraint errors', async () => {
      const originalGetById = unitsModel.getById
      unitsModel.getById = jest.fn().mockResolvedValue(mockUnit)
      
      const fkError = new Error('Foreign key constraint') as any
      fkError.code = 'SQLITE_CONSTRAINT_FOREIGNKEY'
      mockDb.setShouldThrow(fkError)
      
      await expect(unitsModel.delete(1)).rejects.toThrow('Cannot delete unit: it is referenced by existing transactions')
      
      unitsModel.getById = originalGetById
    })
  })

  describe('existsByName', () => {
    it('should return true when name exists', async () => {
      mockDb.setData([{ id: 1 }])
      
      const result = await unitsModel.existsByName('Test Personal')
      
      expect(result).toBe(true)
    })

    it('should return false when name does not exist', async () => {
      mockDb.setData([])
      
      const result = await unitsModel.existsByName('Non-existent Unit')
      
      expect(result).toBe(false)
    })

    it('should exclude specified ID when checking', async () => {
      mockDb.setData([])
      
      const result = await unitsModel.existsByName('Test Personal', 1)
      
      expect(result).toBe(false)
    })
  })

  describe('getActive', () => {
    it('should return only active units', async () => {
      const activeUnits = [
        mockUnit, 
        { ...mockUnit, id: 2, name: 'Test Business' }
      ]
      mockDb.setData(activeUnits)
      
      const result = await unitsModel.getActive()
      
      expect(result).toEqual(activeUnits)
    })
  })

  describe('toggleActive', () => {
    it('should toggle unit status from active to inactive', async () => {
      const originalGetById = unitsModel.getById
      unitsModel.getById = jest.fn().mockResolvedValue({ ...mockUnit, active: true })
      
      const result = await unitsModel.toggleActive(1)
      
      expect(result).toEqual(expect.objectContaining({ active: false }))
      expect(unitsModel.getById).toHaveBeenCalledWith(1)
      
      unitsModel.getById = originalGetById
    })

    it('should toggle unit status from inactive to active', async () => {
      const originalGetById = unitsModel.getById
      unitsModel.getById = jest.fn().mockResolvedValue({ ...mockUnit, active: false })
      
      const result = await unitsModel.toggleActive(1)
      
      expect(result).toEqual(expect.objectContaining({ active: true }))
      expect(unitsModel.getById).toHaveBeenCalledWith(1)
      
      unitsModel.getById = originalGetById
    })

    it('should throw error when unit not found', async () => {
      const originalGetById = unitsModel.getById
      unitsModel.getById = jest.fn().mockResolvedValue(null)
      
      await expect(unitsModel.toggleActive(999)).rejects.toThrow('Unit not found')
      
      unitsModel.getById = originalGetById
    })
  })

  describe('getCountByStatus', () => {
    it('should return correct count of active and inactive units', async () => {
      const allUnits = [
        { ...mockUnit, id: 1, active: true },
        { ...mockUnit, id: 2, active: true },
        { ...mockUnit, id: 3, active: false },
        { ...mockUnit, id: 4, active: false },
        { ...mockUnit, id: 5, active: false }
      ]
      
      const originalGetAll = unitsModel.getAll
      unitsModel.getAll = jest.fn().mockResolvedValue(allUnits)
      
      const result = await unitsModel.getCountByStatus()
      
      expect(result).toEqual({ active: 2, inactive: 3 })
      expect(unitsModel.getAll).toHaveBeenCalledTimes(1)
      
      unitsModel.getAll = originalGetAll
    })

    it('should return zero counts when no units exist', async () => {
      const originalGetAll = unitsModel.getAll
      unitsModel.getAll = jest.fn().mockResolvedValue([])
      
      const result = await unitsModel.getCountByStatus()
      
      expect(result).toEqual({ active: 0, inactive: 0 })
      
      unitsModel.getAll = originalGetAll
    })
  })
})