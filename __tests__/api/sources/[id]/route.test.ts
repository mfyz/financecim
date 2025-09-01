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

// Mock the entire sources model module
jest.doMock('@/db/models/sources.model', () => ({
  sourcesModel: {
    getById: mockGetById,
    update: mockUpdate,
    delete: mockDelete,
    existsByName: mockExistsByName,
  }
}))

// Import the handlers dynamically
let GET: any
let PUT: any
let DELETE: any

beforeAll(async () => {
  const routeHandlers = await import('@/app/api/sources/[id]/route')
  GET = routeHandlers.GET
  PUT = routeHandlers.PUT  
  DELETE = routeHandlers.DELETE
})

// Mock data
const mockSource = { 
  id: 1, 
  name: 'Test Chase Bank', 
  type: 'bank' as const, 
  createdAt: '2024-01-01T00:00:00.000Z', 
  updatedAt: '2024-01-01T00:00:00.000Z' 
}

describe('/api/sources/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/sources/[id]', () => {
    it('should return source by ID successfully', async () => {
      // Setup mock
      mockGetById.mockResolvedValue(mockSource)

      // Execute actual handler
      const response = await GET(
        new NextRequest('http://localhost:3000/api/sources/1'),
        { params: { id: '1' } }
      )
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: mockSource
      })
      expect(mockGetById).toHaveBeenCalledWith(1)
    })

    it('should return 404 when source not found', async () => {
      // Setup mock to return null
      mockGetById.mockResolvedValue(null)

      // Execute actual handler
      const response = await GET(
        new NextRequest('http://localhost:3000/api/sources/999'),
        { params: { id: '999' } }
      )
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(404)
      expect(data).toEqual({
        success: false,
        error: 'Source not found',
        message: 'Source with ID 999 does not exist'
      })
      expect(mockGetById).toHaveBeenCalledWith(999)
    })

    it('should validate ID parameter - invalid ID', async () => {
      // Execute actual handler with invalid ID
      const response = await GET(
        new NextRequest('http://localhost:3000/api/sources/invalid'),
        { params: { id: 'invalid' } }
      )
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Invalid ID',
        message: 'Source ID must be a positive integer'
      })
      expect(mockGetById).not.toHaveBeenCalled()
    })

    it('should validate ID parameter - negative ID', async () => {
      // Execute actual handler with negative ID
      const response = await GET(
        new NextRequest('http://localhost:3000/api/sources/-1'),
        { params: { id: '-1' } }
      )
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid ID')
    })

    it('should handle database errors', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mock to throw error
      mockGetById.mockRejectedValue(new Error('Database error'))

      // Execute actual handler
      const response = await GET(
        new NextRequest('http://localhost:3000/api/sources/1'),
        { params: { id: '1' } }
      )
      const data = await response.json()

      // Verify error response
      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch source'
      })
      
      // Restore console.error
      consoleSpy.mockRestore()
    })
  })

  describe('PUT /api/sources/[id]', () => {
    const updateData = { name: 'Updated Bank Name', type: 'credit_card' as const }
    const updatedSource = { ...mockSource, ...updateData, updatedAt: '2024-01-02T00:00:00.000Z' }

    it('should update source successfully', async () => {
      // Setup mocks
      mockExistsByName.mockResolvedValue(false)
      mockUpdate.mockResolvedValue(updatedSource)

      // Create request
      const request = new NextRequest('http://localhost:3000/api/sources/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: updatedSource,
        message: 'Source updated successfully'
      })
      expect(mockExistsByName).toHaveBeenCalledWith('Updated Bank Name', 1)
      expect(mockUpdate).toHaveBeenCalledWith(1, updateData)
    })

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'New Name Only' }
      const partiallyUpdated = { ...mockSource, name: 'New Name Only', updatedAt: '2024-01-02T00:00:00.000Z' }

      // Setup mocks
      mockExistsByName.mockResolvedValue(false)
      mockUpdate.mockResolvedValue(partiallyUpdated)

      // Create request
      const request = new NextRequest('http://localhost:3000/api/sources/1', {
        method: 'PUT',
        body: JSON.stringify(partialUpdate),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith(1, partialUpdate)
    })

    it('should validate empty update data', async () => {
      // Create request with empty body
      const request = new NextRequest('http://localhost:3000/api/sources/1', {
        method: 'PUT',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      // Verify validation error
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation failed')
    })

    it('should validate invalid type values', async () => {
      // Create request with invalid type
      const request = new NextRequest('http://localhost:3000/api/sources/1', {
        method: 'PUT',
        body: JSON.stringify({ type: 'invalid_type' }),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      // Verify validation error
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation failed')
    })

    it('should handle duplicate name conflicts', async () => {
      // Setup mock to indicate name exists
      mockExistsByName.mockResolvedValue(true)

      // Create request
      const request = new NextRequest('http://localhost:3000/api/sources/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Existing Bank' }),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      // Verify conflict response
      expect(response.status).toBe(409)
      expect(data).toEqual({
        success: false,
        error: 'Source name already exists',
        message: 'A source with the name "Existing Bank" already exists'
      })
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('should handle source not found during update', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mocks
      mockExistsByName.mockResolvedValue(false)
      mockUpdate.mockRejectedValue(new Error('Source not found'))

      // Create request
      const request = new NextRequest('http://localhost:3000/api/sources/999', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await PUT(request, { params: { id: '999' } })
      const data = await response.json()

      // Verify 404 response
      expect(response.status).toBe(404)
      expect(data).toEqual({
        success: false,
        error: 'Source not found',
        message: 'Source with ID 999 does not exist'
      })
      
      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should validate ID parameter for updates', async () => {
      // Create request with invalid ID
      const request = new NextRequest('http://localhost:3000/api/sources/invalid', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await PUT(request, { params: { id: 'invalid' } })
      const data = await response.json()

      // Verify validation error
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid ID')
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /api/sources/[id]', () => {
    it('should delete source successfully', async () => {
      // Setup mock
      mockDelete.mockResolvedValue(undefined)

      // Execute actual handler
      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/sources/1'),
        { params: { id: '1' } }
      )
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Source deleted successfully'
      })
      expect(mockDelete).toHaveBeenCalledWith(1)
    })

    it('should handle source not found during deletion', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mock to throw not found error
      mockDelete.mockRejectedValue(new Error('Source not found'))

      // Execute actual handler
      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/sources/999'),
        { params: { id: '999' } }
      )
      const data = await response.json()

      // Verify 404 response
      expect(response.status).toBe(404)
      expect(data).toEqual({
        success: false,
        error: 'Source not found',
        message: 'Source with ID 999 does not exist'
      })
      
      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should validate ID parameter for deletion', async () => {
      // Execute actual handler with invalid ID
      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/sources/invalid'),
        { params: { id: 'invalid' } }
      )
      const data = await response.json()

      // Verify validation error
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid ID')
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('should handle database errors during deletion', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mock to throw error
      mockDelete.mockRejectedValue(new Error('Database error'))

      // Execute actual handler
      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/sources/1'),
        { params: { id: '1' } }
      )
      const data = await response.json()

      // Verify error response
      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete source'
      })
      
      // Restore console.error
      consoleSpy.mockRestore()
    })
  })
})