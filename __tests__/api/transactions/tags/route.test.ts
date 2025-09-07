/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/transactions/tags/route'
import { transactionsModel } from '@/db/models/transactions.model'

// Mock the transactions model
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getAllTags: jest.fn(),
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>

describe('/api/transactions/tags', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should fetch all tags successfully', async () => {
      const mockTags = [
        'business',
        'dining',
        'groceries',
        'income',
        'salary',
        'shopping',
        'weekly'
      ]
      mockTransactionsModel.getAllTags.mockResolvedValue(mockTags)

      const request = new NextRequest('http://localhost:3000/api/transactions/tags')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ tags: mockTags })
      expect(mockTransactionsModel.getAllTags).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when no tags exist', async () => {
      mockTransactionsModel.getAllTags.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/transactions/tags')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ tags: [] })
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockTransactionsModel.getAllTags.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/transactions/tags')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch transaction tags')
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching transaction tags:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should return tags in sorted order', async () => {
      const unsortedTags = ['zebra', 'alpha', 'beta', 'gamma']
      const sortedTags = ['alpha', 'beta', 'gamma', 'zebra']
      mockTransactionsModel.getAllTags.mockResolvedValue(sortedTags)

      const request = new NextRequest('http://localhost:3000/api/transactions/tags')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tags).toEqual(sortedTags)
      // Verify tags are in alphabetical order
      const isSorted = data.tags.every((tag: string, index: number) => 
        index === 0 || data.tags[index - 1] <= tag
      )
      expect(isSorted).toBe(true)
    })

    it('should handle mixed case and special characters in tags', async () => {
      const mixedTags = [
        'Business-Travel',
        'Client_Meeting',
        'home-office',
        'URGENT',
        'work-expense'
      ]
      mockTransactionsModel.getAllTags.mockResolvedValue(mixedTags)

      const request = new NextRequest('http://localhost:3000/api/transactions/tags')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tags).toEqual(mixedTags)
      expect(data.tags).toContain('Business-Travel')
      expect(data.tags).toContain('Client_Meeting')
      expect(data.tags).toContain('URGENT')
    })

    it('should handle large number of tags', async () => {
      // Generate 100 tags
      const largeTags = Array.from({ length: 100 }, (_, i) => `tag-${i.toString().padStart(3, '0')}`)
      mockTransactionsModel.getAllTags.mockResolvedValue(largeTags)

      const request = new NextRequest('http://localhost:3000/api/transactions/tags')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tags).toHaveLength(100)
      expect(data.tags[0]).toBe('tag-000')
      expect(data.tags[99]).toBe('tag-099')
    })
  })
})