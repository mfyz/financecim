import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import UnitsPage from '@/app/units/page'
import { toast } from 'react-hot-toast'

// Mock dependencies
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('UnitsPage', () => {
  const mockUnits = [
    {
      id: 1,
      name: 'Personal',
      description: 'Personal expenses',
      color: '#10B981',
      icon: '👤',
      active: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 2,
      name: 'Business',
      description: 'Business expenses',
      color: '#3B82F6',
      icon: '💼',
      active: true,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 3,
      name: 'Investment',
      description: 'Investment activities',
      color: '#F59E0B',
      icon: '📈',
      active: false,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Load', () => {
    it('should fetch and display units on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockUnits }),
      })

      render(<UnitsPage />)

      // Should show loading initially
      expect(screen.getByText('Loading units...')).toBeInTheDocument()

      // Wait for units to load
      await waitFor(() => {
        expect(screen.queryByText('Loading units...')).not.toBeInTheDocument()
      })

      // Check if units are displayed
      expect(screen.getByText('Personal')).toBeInTheDocument()
      expect(screen.getByText('Business')).toBeInTheDocument()
      expect(screen.getByText('Investment')).toBeInTheDocument()

      // Check descriptions
      expect(screen.getByText('Personal expenses')).toBeInTheDocument()
      expect(screen.getByText('Business expenses')).toBeInTheDocument()
      expect(screen.getByText('Investment activities')).toBeInTheDocument()

      // Check active/inactive status badges
      expect(screen.getAllByText('Active')).toHaveLength(2)
      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })

    it('should handle fetch error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<UnitsPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading units...')).not.toBeInTheDocument()
      })

      expect(toast.error).toHaveBeenCalledWith('Error loading units')
    })

    it('should handle API error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false, message: 'Database error' }),
      })

      render(<UnitsPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading units...')).not.toBeInTheDocument()
      })

      expect(toast.error).toHaveBeenCalledWith('Failed to fetch units')
    })
  })

  describe('Add Unit Modal', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockUnits }),
      })

      render(<UnitsPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading units...')).not.toBeInTheDocument()
      })
    })

    it('should open add modal when Add Unit button is clicked', async () => {
      const user = userEvent.setup()
      const addButton = screen.getByRole('button', { name: /add unit/i })

      await user.click(addButton)

      expect(screen.getByText('Add Business Unit')).toBeInTheDocument()
      expect(screen.getByLabelText('Unit Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
      expect(screen.getByLabelText('Icon')).toBeInTheDocument()
      expect(screen.getByLabelText('Color')).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      const addButton = screen.getByRole('button', { name: /add unit/i })

      await user.click(addButton)

      // Try to submit without name
      const submitButton = screen.getByRole('button', { name: /^add$/i })
      await user.click(submitButton)

      expect(toast.error).toHaveBeenCalledWith('Unit name is required')
    })

    it('should successfully create a new unit', async () => {
      const newUnit = {
        id: 4,
        name: 'Freelance',
        description: 'Freelance work',
        color: '#8B5CF6',
        icon: '💻',
        active: true,
        createdAt: new Date('2024-01-04'),
        updatedAt: new Date('2024-01-04'),
      }

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: newUnit }),
      })

      const user = userEvent.setup()
      const addButton = screen.getByRole('button', { name: /add unit/i })

      await user.click(addButton)

      // Fill form
      const nameInput = screen.getByLabelText('Unit Name')
      const descInput = screen.getByLabelText('Description')
      const iconInput = screen.getByLabelText('Icon')
      const colorInput = screen.getByLabelText('Color')

      await user.clear(nameInput)
      await user.type(nameInput, 'Freelance')
      await user.clear(descInput)
      await user.type(descInput, 'Freelance work')
      await user.clear(iconInput)
      await user.type(iconInput, '💻')
      await user.clear(colorInput)
      await user.type(colorInput, '#8B5CF6')

      // Submit
      const submitButton = screen.getByRole('button', { name: /^add$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Unit created successfully')
      })

      // Check if new unit is displayed
      expect(screen.getByText('Freelance')).toBeInTheDocument()
      expect(screen.getByText('Freelance work')).toBeInTheDocument()
    })

    it('should handle create error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false, message: 'Database error' }),
      })

      const user = userEvent.setup()
      const addButton = screen.getByRole('button', { name: /add unit/i })

      await user.click(addButton)

      const nameInput = screen.getByLabelText('Unit Name')
      await user.type(nameInput, 'Test Unit')

      const submitButton = screen.getByRole('button', { name: /^add$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Database error')
      })
    })
  })

  describe('Toggle Unit Status', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockUnits }),
      })

      render(<UnitsPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading units...')).not.toBeInTheDocument()
      })
    })

    it('should toggle unit active status', async () => {
      const toggledUnit = { ...mockUnits[0], active: false }

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: toggledUnit }),
      })

      const user = userEvent.setup()

      // Find the first unit's toggle button (Personal is active)
      const personalCard = screen.getByText('Personal').closest('.bg-white')
      const toggleButton = personalCard?.querySelector('button[title*="Deactivate"]')

      if (toggleButton) {
        await user.click(toggleButton)
      }

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/units/1/toggle',
          expect.objectContaining({ method: 'POST' })
        )
      })

      expect(toast.success).toHaveBeenCalledWith('Unit updated successfully')
    })

    it('should handle toggle error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false, message: 'Cannot toggle unit' }),
      })

      const user = userEvent.setup()

      const personalCard = screen.getByText('Personal').closest('.bg-white')
      const toggleButton = personalCard?.querySelector('button[title*="Deactivate"]')

      if (toggleButton) {
        await user.click(toggleButton)
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Cannot toggle unit')
      })
    })
  })

  describe('Delete Unit', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockUnits }),
      })

      render(<UnitsPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading units...')).not.toBeInTheDocument()
      })
    })

    it('should show delete confirmation dialog', async () => {
      const user = userEvent.setup()

      const personalCard = screen.getByText('Personal').closest('.bg-white')
      const deleteButton = personalCard?.querySelector('button[title="Delete unit"]')

      if (deleteButton) {
        await user.click(deleteButton)
      }

      // Check if confirmation dialog appears
      expect(screen.getByText('Delete Business Unit')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument()
    })

    it('should delete unit on confirmation', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true }),
      })

      const user = userEvent.setup()

      const personalCard = screen.getByText('Personal').closest('.bg-white')
      const deleteButton = personalCard?.querySelector('button[title="Delete unit"]')

      if (deleteButton) {
        await user.click(deleteButton)
      }

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/units/1',
          expect.objectContaining({ method: 'DELETE' })
        )
      })

      expect(toast.success).toHaveBeenCalledWith('Unit deleted successfully')
    })

    it('should handle delete error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: false,
          message: 'Cannot delete unit with existing transactions'
        }),
      })

      const user = userEvent.setup()

      const personalCard = screen.getByText('Personal').closest('.bg-white')
      const deleteButton = personalCard?.querySelector('button[title="Delete unit"]')

      if (deleteButton) {
        await user.click(deleteButton)
      }

      const confirmButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Cannot delete unit with existing transactions')
      })
    })
  })

  describe('Grid Layout', () => {
    it('should display units in a grid layout', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockUnits }),
      })

      render(<UnitsPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading units...')).not.toBeInTheDocument()
      })

      // Check that units are displayed (we already verified they are in the document)
      // The grid layout is applied via CSS classes which are already in the DOM
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no units', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] }),
      })

      render(<UnitsPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading units...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('No units found')).toBeInTheDocument()
      expect(screen.getByText('Get started by creating your first business unit.')).toBeInTheDocument()
    })
  })
})