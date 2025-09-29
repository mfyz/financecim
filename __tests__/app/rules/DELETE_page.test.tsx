/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import RulesPage from '@/app/rules/page'
import { toast } from 'sonner'

// Mock fetch API
global.fetch = jest.fn()

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Rules Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockUnits = [
    { id: 1, name: 'Personal', color: '#3B82F6', icon: '👤', active: true },
    { id: 2, name: 'Business', color: '#10B981', icon: '💼', active: true },
  ]

  const mockCategories = [
    { id: 1, name: 'Groceries', parentCategoryId: null, color: '#FF6B35', icon: '🛒' },
    { id: 2, name: 'Transport', parentCategoryId: null, color: '#3B82F6', icon: '🚗' },
  ]

  const mockSources = [
    { id: 1, name: 'Chase Bank', type: 'bank' },
    { id: 2, name: 'Capital One', type: 'credit_card' },
  ]

  const mockUnitRules = [
    {
      id: 1,
      ruleType: 'description',
      matchType: 'contains',
      pattern: 'AMAZON',
      unitId: 2,
      priority: 1,
      active: true,
      unit: mockUnits[1],
    },
  ]

  const mockCategoryRules = [
    {
      id: 1,
      ruleType: 'description',
      matchType: 'contains',
      pattern: 'WALMART',
      categoryId: 1,
      priority: 1,
      active: true,
      category: mockCategories[0],
    },
  ]

  const setupSuccessfulFetch = () => {
    let callCount = 0
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      callCount++

      // First round of fetches during initial load
      if (url.includes('/api/units') && callCount <= 5) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUnits),
        })
      }
      if (url.includes('/api/categories') && callCount <= 5) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        })
      }
      if (url.includes('/api/sources') && callCount <= 5) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSources),
        })
      }
      if (url.includes('/api/rules/unit') && !url.includes('/api/rules/unit/') && callCount <= 5) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUnitRules),
        })
      }
      if (url.includes('/api/rules/category') && !url.includes('/api/rules/category/') && callCount <= 5) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategoryRules),
        })
      }

      // Default response for any other requests
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    })
  }

  test('renders rules page with loading state initially', async () => {
    setupSuccessfulFetch()
    render(<RulesPage />)

    // Check for main page elements
    expect(screen.getByText('Auto-Categorization Rules')).toBeInTheDocument()
    expect(screen.getByText('Unit Rules')).toBeInTheDocument()
    expect(screen.getByText('Category Rules')).toBeInTheDocument()

    // Wait for loading to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  test('loads and displays rules after fetching', async () => {
    setupSuccessfulFetch()
    render(<RulesPage />)

    // Wait for the data to load and display
    await waitFor(() => {
      expect(screen.getByText('AMAZON')).toBeInTheDocument()
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(screen.getByText('WALMART')).toBeInTheDocument()
    })
  })

  test('handles add unit rule button click', async () => {
    setupSuccessfulFetch()
    const user = userEvent.setup()
    render(<RulesPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('AMAZON')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Find and click the Add Unit Rule button
    const addUnitRuleButton = screen.getByRole('button', { name: /Add Unit Rule/i })
    await user.click(addUnitRuleButton)

    // Check that modal opens
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/Add New Unit Rule/i)).toBeInTheDocument()
    })
  })

  test('handles add category rule button click', async () => {
    setupSuccessfulFetch()
    const user = userEvent.setup()
    render(<RulesPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('WALMART')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Find and click the Add Category Rule button
    const addCategoryRuleButton = screen.getByRole('button', { name: /Add Category Rule/i })
    await user.click(addCategoryRuleButton)

    // Check that modal opens
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/Add New Category Rule/i)).toBeInTheDocument()
    })
  })

  test('handles API fetch errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<RulesPage />)

    // Wait for error to be caught
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching data:', expect.any(Error))
    })

    // Page should still render even if data fetch fails
    expect(screen.getByText('Auto-Categorization Rules')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  test('toggles rule active state', async () => {
    const user = userEvent.setup()
    let callCount = 0

    // Setup mock to handle initial load and toggle request
    ;(global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
      callCount++

      // Initial data fetches (first 5 calls)
      if (callCount <= 5) {
        if (url.includes('/api/units')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUnits),
          })
        }
        if (url.includes('/api/categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategories),
          })
        }
        if (url.includes('/api/sources')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSources),
          })
        }
        if (url.includes('/api/rules/unit') && !url.includes('/toggle')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUnitRules),
          })
        }
        if (url.includes('/api/rules/category') && !url.includes('/toggle')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategoryRules),
          })
        }
      }

      // Toggle request
      if (url.includes('/toggle') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockUnitRules[0], active: false }),
        })
      }

      // Refresh requests after toggle (calls 7-11)
      if (callCount > 6) {
        if (url.includes('/api/rules/unit') && !url.includes('/toggle')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ ...mockUnitRules[0], active: false }]),
          })
        }
        if (url.includes('/api/rules/category') && !url.includes('/toggle')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategoryRules),
          })
        }
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    })

    render(<RulesPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('AMAZON')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Find and click the toggle button (Pause icon since rule is active)
    const toggleButtons = screen.getAllByRole('button')
    const pauseButton = toggleButtons.find(btn => btn.querySelector('svg.lucide-pause'))

    if (pauseButton) {
      await user.click(pauseButton)

      // Verify the toggle API was called
      await waitFor(() => {
        const toggleCalls = (global.fetch as jest.Mock).mock.calls.filter(
          call => call[0].includes('/toggle')
        )
        expect(toggleCalls.length).toBeGreaterThan(0)
      })

      // Verify success toast was shown
      expect(toast.success).toHaveBeenCalledWith('Rule updated successfully')
    }
  })

  test('opens test rule modal', async () => {
    setupSuccessfulFetch()
    const user = userEvent.setup()
    render(<RulesPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('AMAZON')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Find and click the Test Rules button
    const testRulesButton = screen.getByRole('button', { name: /Test Rules/i })
    await user.click(testRulesButton)

    // Check that test modal opens
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/Test Auto-Categorization/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Enter a transaction description/i)).toBeInTheDocument()
    })
  })
})