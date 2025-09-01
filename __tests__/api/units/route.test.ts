/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals'
import { NextRequest } from 'next/server'

// Create mock functions
const mockGetAll = jest.fn()
const mockCreate = jest.fn()
const mockExistsByName = jest.fn()

// Mock the units model module
jest.doMock('@/db/models/units.model', () => ({
  unitsModel: {
    getAll: mockGetAll,
    create: mockCreate,
    existsByName: mockExistsByName,
  }
}))

// Mock the API route handlers dynamically  
let GET: any
let POST: any

beforeAll(async () => {
  const routeHandlers = await import('@/app/api/units/route')
  GET = routeHandlers.GET
  POST = routeHandlers.POST
})

// Mock data
const mockUnits = [
  { id: 1, name: 'Personal', description: 'Personal expenses', color: '#6B7280', icon: '👤', active: true, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, name: 'Main Business', description: 'Primary business operations', color: '#3B82F6', icon: '💼', active: true, createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' }
]

const validUnitData = {
  name: 'Test Marketing',
  description: 'Marketing campaigns and analytics',
  color: '#FF5722',
  icon: '📢',
  active: true
}

describe('/api/units', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAll.mockClear()
    mockCreate.mockClear()
    mockExistsByName.mockClear()
  })

  describe('GET /api/units', () => {
    it('should return all units successfully', async () => {
      // Setup mock
      mockGetAll.mockResolvedValue(mockUnits)

      // Execute actual handler
      const response = await GET()
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: mockUnits
      })
      expect(mockGetAll).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when no units exist', async () => {
      // Setup mock
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
        message: 'Failed to fetch units'
      })
      expect(mockGetAll).toHaveBeenCalledTimes(1)
      
      // Restore console.error
      consoleSpy.mockRestore()
    })
  })

  describe('POST /api/units', () => {
    const newUnit = { ...mockUnits[0], id: 3, name: 'Test Marketing' }

    it('should create new unit successfully', async () => {
      // Setup mocks
      mockExistsByName.mockResolvedValue(false)
      mockCreate.mockResolvedValue(newUnit)

      // Create request
      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(validUnitData),
        headers: { 'Content-Type': 'application/json' }
      })

      // Execute actual handler
      const response = await POST(request)
      const data = await response.json()

      // Verify results
      expect(response.status).toBe(201)
      expect(data).toEqual({
        success: true,
        data: newUnit,
        message: 'Unit created successfully'
      })
      expect(mockExistsByName).toHaveBeenCalledWith('Test Marketing')
      expect(mockCreate).toHaveBeenCalledWith(validUnitData)
    })

    it('should validate required name field', async () => {
      const invalidData = { ...validUnitData, name: '' }

      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('should validate color format', async () => {
      const invalidData = { ...validUnitData, color: 'invalid-color' }

      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation failed')
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('should reject duplicate unit names', async () => {
      // Setup mock to simulate existing name
      mockExistsByName.mockResolvedValue(true)

      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(validUnitData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data).toEqual({
        success: false,
        error: 'Unit name already exists',
        message: `A unit with the name "${validUnitData.name}" already exists`
      })
      expect(mockExistsByName).toHaveBeenCalledWith(validUnitData.name)
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('should handle invalid JSON', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(mockCreate).not.toHaveBeenCalled()
      
      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should handle database creation errors', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mocks
      mockExistsByName.mockResolvedValue(false)
      mockCreate.mockRejectedValue(new Error('Database insertion failed'))

      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(validUnitData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create unit'
      })
      
      // Restore console.error
      consoleSpy.mockRestore()
    })

    it('should handle name existence check errors', async () => {
      // Silence expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Setup mock to throw error during name check
      mockExistsByName.mockRejectedValue(new Error('Database query failed'))

      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(validUnitData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create unit'
      })
      expect(mockCreate).not.toHaveBeenCalled()
      
      // Restore console.error
      consoleSpy.mockRestore()
    })
  })
})