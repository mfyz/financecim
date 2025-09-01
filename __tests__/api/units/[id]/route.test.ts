/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals'
import { NextRequest } from 'next/server'

// Create mock functions
const mockGetById = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockExistsByName = jest.fn()

// Mock the units model module
jest.doMock('@/db/models/units.model', () => ({
  unitsModel: {
    getById: mockGetById,
    update: mockUpdate,
    delete: mockDelete,
    existsByName: mockExistsByName,
  }
}))

// Mock the API route handlers dynamically  
let GET: any
let PUT: any
let DELETE: any

beforeAll(async () => {
  const routeHandlers = await import('@/app/api/units/[id]/route')
  GET = routeHandlers.GET
  PUT = routeHandlers.PUT
  DELETE = routeHandlers.DELETE
})

// Mock data
const mockUnit = {
  id: 1,
  name: 'Personal',
  description: 'Personal expenses and income',
  color: '#6B7280',
  icon: '👤',
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

const mockParams = { params: Promise.resolve({ id: '1' }) }
const mockInvalidParams = { params: Promise.resolve({ id: 'invalid' }) }
const mockNotFoundParams = { params: Promise.resolve({ id: '999' }) }

describe('/api/units/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetById.mockClear()
    mockUpdate.mockClear()
    mockDelete.mockClear()
    mockExistsByName.mockClear()
  })

  describe('GET /api/units/[id]', () => {
    it('should return unit when found', async () => {
      // Setup mock
      mockGetById.mockResolvedValue(mockUnit)

      // Execute actual handler
      const response = await GET(new NextRequest('http://localhost:3000/api/units/1'), mockParams)
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: mockUnit
      })
      expect(mockGetById).toHaveBeenCalledWith(1)
    })

    it('should return 404 when unit not found', async () => {
      // Setup mock
      mockGetById.mockResolvedValue(null)

      // Execute actual handler
      const response = await GET(new NextRequest('http://localhost:3000/api/units/999'), mockNotFoundParams)
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(404)
      expect(data).toEqual({
        success: false,
        error: 'Unit not found',
        message: 'Unit with ID 999 does not exist'
      })
      expect(mockGetById).toHaveBeenCalledWith(999)
    })

    it('should return 400 for invalid ID', async () => {
      // Execute actual handler
      const response = await GET(new NextRequest('http://localhost:3000/api/units/invalid'), mockInvalidParams)
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Invalid ID',
        message: 'Unit ID must be a positive integer'
      })
      expect(mockGetById).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mock to throw error
      mockGetById.mockRejectedValue(new Error('Database error'))

      // Execute actual handler
      const response = await GET(new NextRequest('http://localhost:3000/api/units/1'), mockParams)
      const data = await response.json()

      // Verify error response
      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch unit'
      })
      
      // Restore console.error
      consoleSpy.mockRestore()
    })
  })

  describe('PUT /api/units/[id]', () => {
    const validUpdateData = {
      name: 'Updated Personal',
      description: 'Updated description',
      color: '#FF5722',
      icon: '🎯'
    }

    const updatedUnit = { ...mockUnit, ...validUpdateData, updatedAt: '2024-01-02T00:00:00.000Z' }

    it('should update unit successfully', async () => {
      // Setup mocks
      mockExistsByName.mockResolvedValue(false)
      mockUpdate.mockResolvedValue(updatedUnit)

      // Create request
      const request = new NextRequest('http://localhost:3000/api/units/1', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await PUT(request, mockParams)
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: updatedUnit,
        message: 'Unit updated successfully'
      })
      expect(mockExistsByName).toHaveBeenCalledWith('Updated Personal', 1)
      expect(mockUpdate).toHaveBeenCalledWith(1, validUpdateData)
    })

    it('should return 400 for invalid ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/units/invalid', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request, mockInvalidParams)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Invalid ID',
        message: 'Unit ID must be a positive integer'
      })
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('should validate update data', async () => {
      const invalidData = { color: 'invalid-color' }

      const request = new NextRequest('http://localhost:3000/api/units/1', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation failed')
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('should reject empty update data', async () => {
      const request = new NextRequest('http://localhost:3000/api/units/1', {
        method: 'PUT',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation failed')
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('should reject duplicate names', async () => {
      // Setup mock to simulate existing name
      mockExistsByName.mockResolvedValue(true)

      const request = new NextRequest('http://localhost:3000/api/units/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Existing Name' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data).toEqual({
        success: false,
        error: 'Unit name already exists',
        message: 'A unit with the name "Existing Name" already exists'
      })
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('should handle unit not found error', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mock to throw "Unit not found" error
      mockExistsByName.mockResolvedValue(false)
      mockUpdate.mockRejectedValue(new Error('Unit not found'))

      const request = new NextRequest('http://localhost:3000/api/units/999', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request, mockNotFoundParams)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({
        success: false,
        error: 'Unit not found',
        message: 'Unit with ID 999 does not exist'
      })
      
      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should handle database errors', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mocks
      mockExistsByName.mockResolvedValue(false)
      mockUpdate.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/units/1', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update unit'
      })
      
      // Restore console.error
      consoleSpy.mockRestore()
    })
  })

  describe('DELETE /api/units/[id]', () => {
    it('should delete unit successfully', async () => {
      // Setup mock
      mockDelete.mockResolvedValue(undefined)

      // Execute actual handler
      const response = await DELETE(new NextRequest('http://localhost:3000/api/units/1'), mockParams)
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Unit deleted successfully'
      })
      expect(mockDelete).toHaveBeenCalledWith(1)
    })

    it('should return 400 for invalid ID', async () => {
      // Execute actual handler
      const response = await DELETE(new NextRequest('http://localhost:3000/api/units/invalid'), mockInvalidParams)
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Invalid ID',
        message: 'Unit ID must be a positive integer'
      })
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('should handle unit not found error', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mock to throw "Unit not found" error
      mockDelete.mockRejectedValue(new Error('Unit not found'))

      // Execute actual handler
      const response = await DELETE(new NextRequest('http://localhost:3000/api/units/999'), mockNotFoundParams)
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(404)
      expect(data).toEqual({
        success: false,
        error: 'Unit not found',
        message: 'Unit with ID 999 does not exist'
      })
      
      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should handle foreign key constraint errors', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mock to throw foreign key constraint error
      const fkError = new Error('Cannot delete unit: it is referenced by existing transactions. Please delete or reassign the related transactions first.')
      mockDelete.mockRejectedValue(fkError)

      // Execute actual handler
      const response = await DELETE(new NextRequest('http://localhost:3000/api/units/1'), mockParams)
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(409)
      expect(data).toEqual({
        success: false,
        error: 'Cannot delete unit',
        message: 'Cannot delete unit: it is referenced by existing transactions. Please delete or reassign the related transactions first.'
      })
      
      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should handle database errors', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mock to throw generic error
      mockDelete.mockRejectedValue(new Error('Database error'))

      // Execute actual handler
      const response = await DELETE(new NextRequest('http://localhost:3000/api/units/1'), mockParams)
      const data = await response.json()

      // Verify error response
      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete unit'
      })
      
      // Restore console.error
      consoleSpy.mockRestore()
    })
  })
})