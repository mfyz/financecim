import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '@/app/page'

// Mock fetch
global.fetch = jest.fn()

describe('HomePage (Dashboard)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Loading State', () => {
    it('should display loading state initially', () => {
      // Mock pending fetch
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<HomePage />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Loading your financial overview...')).toBeInTheDocument()

      // Should show 4 skeleton cards
      const skeletonCards = screen.getAllByTestId((content, element) => {
        return element?.className?.includes('animate-pulse') || false
      })
      expect(skeletonCards).toHaveLength(4)
    })
  })

  describe('Success State', () => {
    const mockMetrics = {
      accountBalance: 5432.10,
      monthlyIncome: 3500.00,
      monthlyExpenses: 2100.50,
      totalTransactions: 156,
      recentTransactions: [
        {
          id: 1,
          description: 'Grocery Store',
          amount: -65.43,
          date: '2024-01-15',
          category: { name: 'Groceries', color: '#10b981' }
        },
        {
          id: 2,
          description: 'Salary Deposit',
          amount: 3500.00,
          date: '2024-01-01',
          category: null
        }
      ],
      categoryBreakdown: [
        { name: 'Groceries', amount: 450.00, color: '#10b981' },
        { name: 'Transportation', amount: 150.75, color: '#3b82f6' },
        { name: 'Utilities', amount: 200.00, color: '#f59e0b' }
      ]
    }

    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics
      })
    })

    it('should display dashboard metrics', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your financial overview...')).not.toBeInTheDocument()
      })

      // Check header
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Overview of your financial activity')).toBeInTheDocument()

      // Check metric cards
      expect(screen.getByText('Account Balance')).toBeInTheDocument()
      expect(screen.getByText('$5,432.10')).toBeInTheDocument()

      expect(screen.getByText('Monthly Income')).toBeInTheDocument()
      expect(screen.getByText('$3,500.00')).toBeInTheDocument()

      expect(screen.getByText('Monthly Spending')).toBeInTheDocument()
      expect(screen.getByText('$2,100.50')).toBeInTheDocument()

      expect(screen.getByText('Transactions')).toBeInTheDocument()
      expect(screen.getByText('156')).toBeInTheDocument()
    })

    it('should display recent transactions', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your financial overview...')).not.toBeInTheDocument()
      })

      // Check recent transactions section
      expect(screen.getByText('Recent Transactions')).toBeInTheDocument()

      expect(screen.getByText('Grocery Store')).toBeInTheDocument()
      expect(screen.getByText('-$65.43')).toBeInTheDocument()
      expect(screen.getByText('Groceries')).toBeInTheDocument()

      expect(screen.getByText('Salary Deposit')).toBeInTheDocument()
      expect(screen.getByText('+$3,500.00')).toBeInTheDocument()
      expect(screen.getByText('Uncategorized')).toBeInTheDocument()
    })

    it('should display category breakdown', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your financial overview...')).not.toBeInTheDocument()
      })

      // Check category breakdown section
      expect(screen.getByText('Top Spending Categories')).toBeInTheDocument()
      expect(screen.getByText('This month')).toBeInTheDocument()

      const categorySection = screen.getByText('Top Spending Categories').closest('div')?.parentElement
      if (categorySection) {
        const withinCategory = within(categorySection)
        expect(withinCategory.getByText('Groceries')).toBeInTheDocument()
        expect(withinCategory.getByText('$450.00')).toBeInTheDocument()

        expect(withinCategory.getByText('Transportation')).toBeInTheDocument()
        expect(withinCategory.getByText('$150.75')).toBeInTheDocument()

        expect(withinCategory.getByText('Utilities')).toBeInTheDocument()
        expect(withinCategory.getByText('$200.00')).toBeInTheDocument()
      }
    })

    it('should handle negative account balance with proper styling', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockMetrics,
          accountBalance: -1000.00
        })
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your financial overview...')).not.toBeInTheDocument()
      })

      const balanceElement = screen.getByText('-$1,000.00')
      expect(balanceElement).toHaveClass('text-red-600')
    })

    it('should handle empty recent transactions', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockMetrics,
          recentTransactions: []
        })
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your financial overview...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('No recent transactions found')).toBeInTheDocument()
    })

    it('should handle empty category breakdown', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockMetrics,
          categoryBreakdown: []
        })
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your financial overview...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('No spending categories this month')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your financial overview...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    it('should display error message when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your financial overview...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Failed to fetch dashboard metrics')).toBeInTheDocument()
    })

    it('should display generic error for non-Error exceptions', async () => {
      (global.fetch as jest.Mock).mockRejectedValue('Unknown error')

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your financial overview...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('An error occurred')).toBeInTheDocument()
    })
  })

  describe('Date and Currency Formatting', () => {
    it('should format dates correctly', async () => {
      const mockData = {
        accountBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        totalTransactions: 0,
        recentTransactions: [
          {
            id: 1,
            description: 'Test',
            amount: 100,
            date: '2024-12-25',
            category: null
          }
        ],
        categoryBreakdown: []
      }

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your financial overview...')).not.toBeInTheDocument()
      })

      // Check date formatting (Dec 25, 2024)
      expect(screen.getByText('Dec 25, 2024')).toBeInTheDocument()
    })

    it('should format currency correctly for different amounts', async () => {
      const mockData = {
        accountBalance: 1234567.89,
        monthlyIncome: 0.50,
        monthlyExpenses: 999.999,
        totalTransactions: 1234,
        recentTransactions: [],
        categoryBreakdown: []
      }

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your financial overview...')).not.toBeInTheDocument()
      })

      // Check currency formatting
      expect(screen.getByText('$1,234,567.89')).toBeInTheDocument()
      expect(screen.getByText('$0.50')).toBeInTheDocument()
      expect(screen.getByText('$1,000.00')).toBeInTheDocument() // 999.999 rounds to 1000.00

      // Check number formatting for transaction count
      expect(screen.getByText('1,234')).toBeInTheDocument()
    })
  })

  describe('API Integration', () => {
    it('should call the correct API endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          accountBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          totalTransactions: 0,
          recentTransactions: [],
          categoryBreakdown: []
        })
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/metrics')
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })
})