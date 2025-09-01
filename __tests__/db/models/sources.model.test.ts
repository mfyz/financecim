/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals'

// Create mock database functions
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockValues = jest.fn()
const mockSet = jest.fn()
const mockReturning = jest.fn()

// Mock the database connection
jest.doMock('@/db/connection', () => ({
  getDatabase: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  }))
}))

// Mock the schema
jest.doMock('@/db/schema', () => ({
  sources: {
    id: 'id',
    name: 'name', 
    type: 'type',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
}))

// Import the model after mocking
let sourcesModel: any

beforeAll(async () => {
  const model = await import('@/db/models/sources.model')
  sourcesModel = model.sourcesModel
})

// Mock data
const mockSource = {
  id: 1,
  name: 'Test Bank',
  type: 'bank' as const,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

const mockNewSource = {
  name: 'New Bank',
  type: 'bank' as const
}

describe('sourcesModel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset all mock chains
    mockSelect.mockReturnValue({
      from: mockFrom.mockReturnValue({
        where: jest.fn().mockResolvedValue([mockSource]),
        orderBy: mockOrderBy.mockResolvedValue([mockSource])
      })
    })
    
    // Set up specific where mock for the select queries
    mockFrom.mockReturnValue({
      where: jest.fn().mockResolvedValue([mockSource]),
      orderBy: mockOrderBy.mockResolvedValue([mockSource])
    })
    
    mockInsert.mockReturnValue({
      values: mockValues.mockReturnValue({
        returning: mockReturning.mockReturnValue(Promise.resolve([mockSource]))
      })
    })
    
    mockUpdate.mockReturnValue({
      set: mockSet.mockReturnValue({
        where: mockWhere.mockReturnValue({
          returning: mockReturning.mockResolvedValue([mockSource])
        })
      })
    })
    
    mockDelete.mockReturnValue({
      where: mockWhere.mockReturnValue(Promise.resolve())
    })
  })

  describe('getAll', () => {
    it('should return all sources ordered by createdAt', async () => {
      const mockSources = [mockSource, { ...mockSource, id: 2, name: 'Test Bank 2' }]
      mockOrderBy.mockReturnValue(Promise.resolve(mockSources))
      
      const result = await sourcesModel.getAll()
      
      expect(result).toEqual(mockSources)
      expect(mockSelect).toHaveBeenCalledTimes(1)
      expect(mockFrom).toHaveBeenCalledTimes(1)
      expect(mockOrderBy).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when no sources exist', async () => {
      mockOrderBy.mockReturnValue(Promise.resolve([]))
      
      const result = await sourcesModel.getAll()
      
      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      mockOrderBy.mockRejectedValue(new Error('Database error'))
      
      await expect(sourcesModel.getAll()).rejects.toThrow('Database error')
    })
  })

  describe('getById', () => {
    it('should return source when found', async () => {
      const mockQuery = {
        where: jest.fn().mockResolvedValue([mockSource])
      }
      mockFrom.mockReturnValue(mockQuery)
      
      const result = await sourcesModel.getById(1)
      
      expect(result).toEqual(mockSource)
      expect(mockSelect).toHaveBeenCalledTimes(1)
      expect(mockQuery.where).toHaveBeenCalledTimes(1)
    })

    it('should return null when source not found', async () => {
      const mockQuery = {
        where: jest.fn().mockResolvedValue([])
      }
      mockFrom.mockReturnValue(mockQuery)
      
      const result = await sourcesModel.getById(999)
      
      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      const mockQuery = {
        where: jest.fn().mockRejectedValue(new Error('Database error'))
      }
      mockFrom.mockReturnValue(mockQuery)
      
      await expect(sourcesModel.getById(1)).rejects.toThrow('Database error')
    })
  })

  describe('create', () => {
    it('should create and return new source', async () => {
      const createdSource = { id: 1, ...mockNewSource, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }
      mockReturning.mockReturnValue(Promise.resolve([createdSource]))
      
      const result = await sourcesModel.create(mockNewSource)
      
      expect(result).toEqual(createdSource)
      expect(mockInsert).toHaveBeenCalledTimes(1)
      expect(mockValues).toHaveBeenCalledWith(mockNewSource)
      expect(mockReturning).toHaveBeenCalledTimes(1)
    })

    it('should handle database errors', async () => {
      mockReturning.mockRejectedValue(new Error('Database constraint error'))
      
      await expect(sourcesModel.create(mockNewSource)).rejects.toThrow('Database constraint error')
    })
  })

  describe('update', () => {
    beforeEach(() => {
      // Setup proper update chain mock for each test
      mockUpdate.mockReturnValue({
        set: mockSet.mockReturnValue({
          where: mockWhere.mockReturnValue({
            returning: mockReturning.mockResolvedValue([mockSource])
          })
        })
      })
    })
    
    it('should update and return source when exists', async () => {
      const updateData = { name: 'Updated Bank' }
      const updatedSource = { ...mockSource, ...updateData }
      
      // Mock getById to return existing source
      jest.spyOn(sourcesModel, 'getById').mockResolvedValue(mockSource)
      
      // Mock the returning to resolve with updated data
      mockReturning.mockResolvedValue([updatedSource])
      
      const result = await sourcesModel.update(1, updateData)
      
      expect(result).toEqual(updatedSource)
      expect(sourcesModel.getById).toHaveBeenCalledWith(1)
      expect(mockUpdate).toHaveBeenCalledTimes(1)
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        ...updateData,
        updatedAt: expect.any(String)
      }))
    })

    it('should throw error when source not found', async () => {
      jest.spyOn(sourcesModel, 'getById').mockResolvedValue(null)
      
      await expect(sourcesModel.update(999, { name: 'Updated' })).rejects.toThrow('Source not found')
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('should handle partial updates', async () => {
      const updateData = { type: 'credit_card' as const }
      const updatedSource = { ...mockSource, ...updateData }
      
      jest.spyOn(sourcesModel, 'getById').mockResolvedValue(mockSource)
      mockReturning.mockResolvedValue([updatedSource])
      
      const result = await sourcesModel.update(1, updateData)
      
      expect(result.type).toBe('credit_card')
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        type: 'credit_card',
        updatedAt: expect.any(String)
      }))
    })

    it('should handle database errors during update', async () => {
      jest.spyOn(sourcesModel, 'getById').mockResolvedValue(mockSource)
      mockReturning.mockRejectedValue(new Error('Database error'))
      
      await expect(sourcesModel.update(1, { name: 'Updated' })).rejects.toThrow('Database error')
    })
  })

  describe('delete', () => {
    it('should delete source when exists', async () => {
      jest.spyOn(sourcesModel, 'getById').mockResolvedValue(mockSource)
      mockWhere.mockReturnValue(Promise.resolve())
      
      await sourcesModel.delete(1)
      
      expect(sourcesModel.getById).toHaveBeenCalledWith(1)
      expect(mockDelete).toHaveBeenCalledTimes(1)
      expect(mockWhere).toHaveBeenCalledTimes(1)
    })

    it('should throw error when source not found', async () => {
      jest.spyOn(sourcesModel, 'getById').mockResolvedValue(null)
      
      await expect(sourcesModel.delete(999)).rejects.toThrow('Source not found')
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      jest.spyOn(sourcesModel, 'getById').mockResolvedValue(mockSource)
      mockWhere.mockRejectedValue(new Error('Database error'))
      
      await expect(sourcesModel.delete(1)).rejects.toThrow('Database error')
    })
  })

  describe('existsByName', () => {
    it('should return true when name exists', async () => {
      const mockQuery = {
        where: jest.fn().mockResolvedValue([{ id: 1 }])
      }
      mockFrom.mockReturnValue(mockQuery)
      
      const result = await sourcesModel.existsByName('Test Bank')
      
      expect(result).toBe(true)
      expect(mockSelect).toHaveBeenCalledTimes(1)
    })

    it('should return false when name does not exist', async () => {
      const mockQuery = {
        where: jest.fn().mockResolvedValue([])
      }
      mockFrom.mockReturnValue(mockQuery)
      
      const result = await sourcesModel.existsByName('Non-existent Bank')
      
      expect(result).toBe(false)
    })

    it('should exclude specified ID when checking', async () => {
      const mockQuery = {
        where: jest.fn().mockResolvedValue([])
      }
      mockFrom.mockReturnValue(mockQuery)
      
      const result = await sourcesModel.existsByName('Test Bank', 1)
      
      expect(result).toBe(false)
      expect(mockQuery.where).toHaveBeenCalledTimes(1)
    })

    it('should handle database errors', async () => {
      const mockQuery = {
        where: jest.fn().mockRejectedValue(new Error('Database error'))
      }
      mockFrom.mockReturnValue(mockQuery)
      
      await expect(sourcesModel.existsByName('Test Bank')).rejects.toThrow('Database error')
    })
  })

  describe('getByType', () => {
    it('should return sources of specified type', async () => {
      const bankSources = [mockSource, { ...mockSource, id: 2, name: 'Bank 2' }]
      const mockQuery = {
        where: jest.fn().mockResolvedValue(bankSources)
      }
      mockFrom.mockReturnValue(mockQuery)
      
      const result = await sourcesModel.getByType('bank')
      
      expect(result).toEqual(bankSources)
      expect(mockSelect).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when no sources of type exist', async () => {
      const mockQuery = {
        where: jest.fn().mockResolvedValue([])
      }
      mockFrom.mockReturnValue(mockQuery)
      
      const result = await sourcesModel.getByType('manual')
      
      expect(result).toEqual([])
    })

    it('should handle all valid types', async () => {
      const mockQuery = {
        where: jest.fn().mockResolvedValue([mockSource])
      }
      mockFrom.mockReturnValue(mockQuery)
      
      await sourcesModel.getByType('bank')
      await sourcesModel.getByType('credit_card')  
      await sourcesModel.getByType('manual')
      
      expect(mockQuery.where).toHaveBeenCalledTimes(3)
    })
  })

  describe('getCountByType', () => {
    it('should return count of sources by type', async () => {
      const sources = [
        { ...mockSource, id: 1, type: 'bank' },
        { ...mockSource, id: 2, type: 'bank' },
        { ...mockSource, id: 3, type: 'credit_card' },
        { ...mockSource, id: 4, type: 'manual' }
      ]
      
      jest.spyOn(sourcesModel, 'getAll').mockResolvedValue(sources)
      
      const result = await sourcesModel.getCountByType()
      
      expect(result).toEqual([
        { type: 'bank', count: 2 },
        { type: 'credit_card', count: 1 },
        { type: 'manual', count: 1 }
      ])
      expect(sourcesModel.getAll).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when no sources exist', async () => {
      jest.spyOn(sourcesModel, 'getAll').mockResolvedValue([])
      
      const result = await sourcesModel.getCountByType()
      
      expect(result).toEqual([])
    })

    it('should handle single type', async () => {
      const sources = [
        { ...mockSource, id: 1, type: 'bank' },
        { ...mockSource, id: 2, type: 'bank' }
      ]
      
      jest.spyOn(sourcesModel, 'getAll').mockResolvedValue(sources)
      
      const result = await sourcesModel.getCountByType()
      
      expect(result).toEqual([{ type: 'bank', count: 2 }])
    })

    it('should handle database errors from getAll', async () => {
      jest.spyOn(sourcesModel, 'getAll').mockRejectedValue(new Error('Database error'))
      
      await expect(sourcesModel.getCountByType()).rejects.toThrow('Database error')
    })
  })
})