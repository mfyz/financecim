/**
 * @jest-environment node
 */

import { GET } from '@/app/api/reports/route'
import { transactionsModel } from '@/db/models/transactions.model'
import { categoriesModel } from '@/db/models/categories.model'
import { NextRequest } from 'next/server'

// Mock the models
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    getTrends: jest.fn(),
  }
}))

jest.mock('@/db/models/categories.model', () => ({
  categoriesModel: {
    getSpending: jest.fn(),
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>
const mockCategoriesModel = categoriesModel as jest.Mocked<typeof categoriesModel>

describe('/api/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/reports', () => {
    it('should return monthly trends and category spending data', async () => {
      const mockTrends = {
        period: 'monthly',
        data: [
          { period: '2024-01', income: 5000, expenses: 3500, net: 1500, transactionCount: 45 },
          { period: '2024-02', income: 5200, expenses: 3200, net: 2000, transactionCount: 42 }
        ],
        summary: {
          totalIncome: 10200,
          totalExpenses: 6700,
          totalNet: 3500,
          bestPeriod: { period: '2024-02', value: 2000 },
          worstPeriod: { period: '2024-01', value: 1500 }
        }
      }

      const mockSpending = {
        period: 'current_month',
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
        categories: [
          {
            id: 1,
            name: 'Groceries',
            color: '#10B981',
            monthlyBudget: 500,
            totalSpent: 450,
            transactionCount: 15,
            averageTransaction: 30,
            percentageOfTotal: 25.7,
            budgetUtilization: 90,
            parentCategory: null
          },
          {
            id: 2,
            name: 'Transportation',
            color: '#3B82F6',
            monthlyBudget: 200,
            totalSpent: 180,
            transactionCount: 8,
            averageTransaction: 22.5,
            percentageOfTotal: 10.3,
            budgetUtilization: 90,
            parentCategory: null
          }
        ],
        summary: {
          totalSpent: 1750,
          totalBudget: 2000,
          budgetUtilization: 87.5,
          overBudgetCategories: 0,
          savingsRate: 12.5
        }
      }

      mockTransactionsModel.getTrends.mockResolvedValue(mockTrends)
      mockCategoriesModel.getSpending.mockResolvedValue(mockSpending)

      const request = new NextRequest('http://localhost:3000/api/reports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        trends: mockTrends,
        spending: mockSpending
      })
      expect(mockTransactionsModel.getTrends).toHaveBeenCalledWith('monthly', undefined, undefined)
      expect(mockCategoriesModel.getSpending).toHaveBeenCalledWith('current_month', undefined)
    })

    it('should handle query parameters for filtering', async () => {
      const mockTrends = {
        period: 'yearly',
        data: [],
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          totalNet: 0,
          bestPeriod: null,
          worstPeriod: null
        }
      }

      const mockSpending = {
        period: 'last_6_months',
        dateRange: { start: '2023-08-01', end: '2024-01-31' },
        categories: [],
        summary: {
          totalSpent: 0,
          totalBudget: 0,
          budgetUtilization: 0,
          overBudgetCategories: 0,
          savingsRate: 0
        }
      }

      mockTransactionsModel.getTrends.mockResolvedValue(mockTrends)
      mockCategoriesModel.getSpending.mockResolvedValue(mockSpending)

      const request = new NextRequest('http://localhost:3000/api/reports?period=yearly&timePeriod=last_6_months&unitId=1&categoryId=2')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockTransactionsModel.getTrends).toHaveBeenCalledWith('yearly', 1, 2)
      expect(mockCategoriesModel.getSpending).toHaveBeenCalledWith('last_6_months', 1)
    })

    it('should handle empty data gracefully', async () => {
      const mockTrends = {
        period: 'monthly',
        data: [],
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          totalNet: 0,
          bestPeriod: null,
          worstPeriod: null
        }
      }

      const mockSpending = {
        period: 'current_month',
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
        categories: [],
        summary: {
          totalSpent: 0,
          totalBudget: 0,
          budgetUtilization: 0,
          overBudgetCategories: 0,
          savingsRate: 0
        }
      }

      mockTransactionsModel.getTrends.mockResolvedValue(mockTrends)
      mockCategoriesModel.getSpending.mockResolvedValue(mockSpending)

      const request = new NextRequest('http://localhost:3000/api/reports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trends.data).toEqual([])
      expect(data.spending.categories).toEqual([])
    })

    it('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockTransactionsModel.getTrends.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/reports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch reports data' })

      consoleSpy.mockRestore()
    })
  })
})