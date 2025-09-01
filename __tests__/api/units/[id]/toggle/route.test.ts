/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals'
import { NextRequest } from 'next/server'

// Create mock functions
const mockToggleActive = jest.fn()

// Mock the units model module
jest.doMock('@/db/models/units.model', () => ({
  unitsModel: {
    toggleActive: mockToggleActive,
  }
}))

// Mock the API route handlers dynamically  
let POST: any

beforeAll(async () => {
  const routeHandlers = await import('@/app/api/units/[id]/toggle/route')
  POST = routeHandlers.POST
})

// Mock data
const mockActiveUnit = {
  id: 1,
  name: 'Personal',
  description: 'Personal expenses and income',
  color: '#6B7280',
  icon: '👤',
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

const mockInactiveUnit = {
  ...mockActiveUnit,
  active: false,
  updatedAt: '2024-01-02T00:00:00.000Z'
}

const mockParams = { params: Promise.resolve({ id: '1' }) }
const mockInvalidParams = { params: Promise.resolve({ id: 'invalid' }) }
const mockNotFoundParams = { params: Promise.resolve({ id: '999' }) }

describe('POST /api/units/[id]/toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockToggleActive.mockClear()
  })

  it('should toggle unit from active to inactive', async () => {
    // Setup mock to return inactive unit
    mockToggleActive.mockResolvedValue(mockInactiveUnit)

    // Execute actual handler
    const response = await POST(new NextRequest('http://localhost:3000/api/units/1/toggle'), mockParams)
    const data = await response.json()

    // Verify results
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: mockInactiveUnit,
      message: 'Unit deactivated successfully'
    })
    expect(mockToggleActive).toHaveBeenCalledWith(1)
  })

  it('should toggle unit from inactive to active', async () => {
    // Setup mock to return active unit
    mockToggleActive.mockResolvedValue(mockActiveUnit)

    // Execute actual handler
    const response = await POST(new NextRequest('http://localhost:3000/api/units/1/toggle'), mockParams)
    const data = await response.json()

    // Verify results
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      data: mockActiveUnit,
      message: 'Unit activated successfully'
    })
    expect(mockToggleActive).toHaveBeenCalledWith(1)
  })

  it('should return 400 for invalid ID', async () => {
    // Execute actual handler
    const response = await POST(new NextRequest('http://localhost:3000/api/units/invalid/toggle'), mockInvalidParams)
    const data = await response.json()

    // Verify results
    expect(response.status).toBe(400)
    expect(data).toEqual({
      success: false,
      error: 'Invalid ID',
      message: 'Unit ID must be a positive integer'
    })
    expect(mockToggleActive).not.toHaveBeenCalled()
  })

  it('should handle unit not found error', async () => {
    // Silence expected console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Setup mock to throw "Unit not found" error
    mockToggleActive.mockRejectedValue(new Error('Unit not found'))

    // Execute actual handler
    const response = await POST(new NextRequest('http://localhost:3000/api/units/999/toggle'), mockNotFoundParams)
    const data = await response.json()

    // Verify results
    expect(response.status).toBe(404)
    expect(data).toEqual({
      success: false,
      error: 'Unit not found',
      message: 'Unit with ID 999 does not exist'
    })
    expect(mockToggleActive).toHaveBeenCalledWith(999)
    
    // Restore console.error
    consoleSpy.mockRestore()
  })

  it('should handle database errors', async () => {
    // Silence expected console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Setup mock to throw generic database error
    mockToggleActive.mockRejectedValue(new Error('Database connection failed'))

    // Execute actual handler
    const response = await POST(new NextRequest('http://localhost:3000/api/units/1/toggle'), mockParams)
    const data = await response.json()

    // Verify error response
    expect(response.status).toBe(500)
    expect(data).toEqual({
      success: false,
      error: 'Internal server error',
      message: 'Failed to toggle unit status'
    })
    expect(mockToggleActive).toHaveBeenCalledWith(1)
    
    // Restore console.error
    consoleSpy.mockRestore()
  })

  it('should handle zero ID correctly', async () => {
    const mockZeroParams = { params: Promise.resolve({ id: '0' }) }

    // Execute actual handler
    const response = await POST(new NextRequest('http://localhost:3000/api/units/0/toggle'), mockZeroParams)
    const data = await response.json()

    // Verify results - zero should be invalid
    expect(response.status).toBe(400)
    expect(data).toEqual({
      success: false,
      error: 'Invalid ID',
      message: 'Unit ID must be a positive integer'
    })
    expect(mockToggleActive).not.toHaveBeenCalled()
  })

  it('should handle negative ID correctly', async () => {
    const mockNegativeParams = { params: Promise.resolve({ id: '-1' }) }

    // Execute actual handler
    const response = await POST(new NextRequest('http://localhost:3000/api/units/-1/toggle'), mockNegativeParams)
    const data = await response.json()

    // Verify results - negative should be invalid
    expect(response.status).toBe(400)
    expect(data).toEqual({
      success: false,
      error: 'Invalid ID',
      message: 'Unit ID must be a positive integer'
    })
    expect(mockToggleActive).not.toHaveBeenCalled()
  })
})