/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals'
import { NextRequest } from 'next/server'

// Create mock functions
const mockGetAll = jest.fn()
const mockCreate = jest.fn()
const mockExistsByName = jest.fn()

// Mock the sources model module
jest.doMock('@/db/models/sources.model', () => ({
  sourcesModel: {
    getAll: mockGetAll,
    create: mockCreate,
    existsByName: mockExistsByName,
  }
}))

// Mock the API route handlers dynamically  
let GET: any
let POST: any

beforeAll(async () => {
  const routeHandlers = await import('@/app/api/sources/route')
  GET = routeHandlers.GET
  POST = routeHandlers.POST
})

// Mock data
const mockSources = [
  { id: 1, name: 'Test Chase Bank', type: 'bank', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, name: 'Test Capital One', type: 'credit_card', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' }
]

describe('/api/sources', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAll.mockClear()
    mockCreate.mockClear()
    mockExistsByName.mockClear()
  })

  describe('GET /api/sources', () => {
    it('should return all sources successfully', async () => {
      // Setup mock
      mockGetAll.mockResolvedValue(mockSources)

      // Execute actual handler
      const response = await GET()
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: mockSources
      })
      expect(mockGetAll).toHaveBeenCalledTimes(1)
    })

    it('should handle database errors', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mock to throw error
      mockGetAll.mockRejectedValue(new Error('Database connection failed'))

      // Execute actual handler
      const response = await GET()
      const data = await response.json()

      // Verify error response
      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch sources'
      })
      expect(mockGetAll).toHaveBeenCalledTimes(1)
      
      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should return empty array when no sources exist', async () => {
      // Setup mock to return empty array
      mockGetAll.mockResolvedValue([])

      // Execute actual handler
      const response = await GET()
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: []
      })
    })
  })

  describe('POST /api/sources', () => {
    const validSourceData = { name: 'New Bank', type: 'bank' as const }
    const createdSource = { id: 3, ...validSourceData, createdAt: '2024-01-03T00:00:00.000Z', updatedAt: '2024-01-03T00:00:00.000Z' }

    it('should create a new source successfully', async () => {
      // Setup mocks
      mockExistsByName.mockResolvedValue(false)
      mockCreate.mockResolvedValue(createdSource)

      // Create request
      const request = new NextRequest('http://localhost:3000/api/sources', {
        method: 'POST',
        body: JSON.stringify(validSourceData),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await POST(request)
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(201)
      expect(data).toEqual({
        success: true,
        data: createdSource,
        message: 'Source created successfully'
      })
      expect(mockExistsByName).toHaveBeenCalledWith('New Bank')
      expect(mockCreate).toHaveBeenCalledWith(validSourceData)
    })

    it('should validate required name field', async () => {
      // Create request with missing name
      const request = new NextRequest('http://localhost:3000/api/sources', {
        method: 'POST',
        body: JSON.stringify({ type: 'bank' }),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await POST(request)
      const data = await response.json()

      // Verify validation error
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
      expect(mockExistsByName).not.toHaveBeenCalled()
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('should validate required type field', async () => {
      // Create request with missing type
      const request = new NextRequest('http://localhost:3000/api/sources', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Bank' }),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await POST(request)
      const data = await response.json()

      // Verify validation error
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })

    it('should validate type enum values', async () => {
      // Create request with invalid type
      const request = new NextRequest('http://localhost:3000/api/sources', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Bank', type: 'invalid_type' }),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await POST(request)
      const data = await response.json()

      // Verify validation error
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })

    it('should handle duplicate source names', async () => {
      // Setup mock to indicate name exists
      mockExistsByName.mockResolvedValue(true)

      // Create request
      const request = new NextRequest('http://localhost:3000/api/sources', {
        method: 'POST',
        body: JSON.stringify(validSourceData),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await POST(request)
      const data = await response.json()

      // Verify conflict response
      expect(response.status).toBe(409)
      expect(data).toEqual({
        success: false,
        error: 'Source name already exists',
        message: 'A source with the name "New Bank" already exists'
      })
      expect(mockExistsByName).toHaveBeenCalledWith('New Bank')
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('should handle invalid JSON', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Create request with invalid JSON
      const request = new NextRequest('http://localhost:3000/api/sources', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await POST(request)
      const data = await response.json()

      // Verify error response
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
      
      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should handle database errors during creation', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mocks
      mockExistsByName.mockResolvedValue(false)
      mockCreate.mockRejectedValue(new Error('Database error'))

      // Create request
      const request = new NextRequest('http://localhost:3000/api/sources', {
        method: 'POST',
        body: JSON.stringify(validSourceData),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await POST(request)
      const data = await response.json()

      // Verify error response
      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create source'
      })
      
      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should handle database errors during name check', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mock to throw error
      mockExistsByName.mockRejectedValue(new Error('Database error'))

      // Create request
      const request = new NextRequest('http://localhost:3000/api/sources', {
        method: 'POST',
        body: JSON.stringify(validSourceData),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await POST(request)
      const data = await response.json()

      // Verify error response
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
      
      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should validate name length limits', async () => {
      // Create request with name too long
      const longName = 'a'.repeat(256) // Over 255 character limit
      const request = new NextRequest('http://localhost:3000/api/sources', {
        method: 'POST',
        body: JSON.stringify({ name: longName, type: 'bank' }),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await POST(request)
      const data = await response.json()

      // Verify validation error
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation failed')
    })
  })
})