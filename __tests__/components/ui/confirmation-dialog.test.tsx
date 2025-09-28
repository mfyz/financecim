import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ConfirmationDialog, ConfirmationType } from '@/components/ui/confirmation-dialog'

// Mock the Modal component
jest.mock('@/components/ui/modal', () => ({
  Modal: ({ isOpen, onClose, children, size }: any) =>
    isOpen ? (
      <div data-testid="modal" data-size={size}>
        <button onClick={onClose} data-testid="modal-close">Close</button>
        {children}
      </div>
    ) : null
}))

describe('ConfirmationDialog Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    test('renders when isOpen is true', () => {
      render(<ConfirmationDialog {...defaultProps} />)

      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByText('Confirm Action')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
    })

    test('does not render when isOpen is false', () => {
      render(<ConfirmationDialog {...defaultProps} isOpen={false} />)

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
    })

    test('renders default confirm and cancel text', () => {
      render(<ConfirmationDialog {...defaultProps} />)

      expect(screen.getByText('Confirm')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    test('renders custom confirm and cancel text', () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          confirmText="Delete"
          cancelText="Keep"
        />
      )

      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('Keep')).toBeInTheDocument()
    })
  })

  describe('Type Variants', () => {
    const types: ConfirmationType[] = ['info', 'warning', 'error', 'success']

    types.forEach((type) => {
      test(`renders ${type} variant with appropriate styling`, () => {
        const { container } = render(
          <ConfirmationDialog {...defaultProps} type={type} />
        )

        // Check for type-specific icon
        const icon = container.querySelector('svg')
        expect(icon).toBeInTheDocument()

        // Check for type-specific color classes
        const expectedColors = {
          info: 'text-blue-600',
          warning: 'text-yellow-600',
          error: 'text-red-600',
          success: 'text-green-600'
        }

        const iconContainer = container.querySelector(`.${expectedColors[type]}`)
        expect(iconContainer).toBeInTheDocument()
      })
    })

    test('defaults to warning type', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />)

      const warningIcon = container.querySelector('.text-yellow-600')
      expect(warningIcon).toBeInTheDocument()
    })
  })

  describe('Button Actions', () => {
    test('calls onClose when cancel button is clicked', () => {
      const mockOnClose = jest.fn()
      render(<ConfirmationDialog {...defaultProps} onClose={mockOnClose} />)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('calls onConfirm when confirm button is clicked', async () => {
      const mockOnConfirm = jest.fn()
      render(<ConfirmationDialog {...defaultProps} onConfirm={mockOnConfirm} />)

      const confirmButton = screen.getByText('Confirm')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1)
      })
    })

    test('handles async onConfirm function', async () => {
      const mockAsyncOnConfirm = jest.fn().mockResolvedValue(undefined)
      render(<ConfirmationDialog {...defaultProps} onConfirm={mockAsyncOnConfirm} />)

      const confirmButton = screen.getByText('Confirm')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockAsyncOnConfirm).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Loading State', () => {
    test('shows loading text when isLoading is true', () => {
      render(<ConfirmationDialog {...defaultProps} isLoading={true} />)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument()
    })

    test('disables buttons when isLoading is true', () => {
      render(<ConfirmationDialog {...defaultProps} isLoading={true} />)

      const cancelButton = screen.getByText('Cancel')
      const confirmButton = screen.getByText('Processing...')

      expect(cancelButton).toBeDisabled()
      expect(confirmButton).toBeDisabled()
    })

    test('does not call onConfirm when clicked during loading', async () => {
      const mockOnConfirm = jest.fn()
      render(
        <ConfirmationDialog
          {...defaultProps}
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      )

      const confirmButton = screen.getByText('Processing...')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockOnConfirm).not.toHaveBeenCalled()
      })
    })
  })

  describe('Visual Elements', () => {
    test('renders icon container with proper classes', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} type="error" />)

      const iconContainer = container.querySelector('.flex-shrink-0')
      expect(iconContainer).toBeInTheDocument()
      expect(iconContainer).toHaveClass('text-red-600')
    })

    test('renders message box with type-specific background', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} type="success" />)

      const messageBox = container.querySelector('.bg-green-50')
      expect(messageBox).toBeInTheDocument()
      expect(messageBox).toHaveClass('border')
    })

    test('renders action buttons with proper spacing', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />)

      const buttonContainer = container.querySelector('.flex.justify-end.space-x-3')
      expect(buttonContainer).toBeInTheDocument()
      expect(buttonContainer).toHaveClass('pt-4', 'border-t')
    })
  })

  describe('Accessibility', () => {
    test('buttons have proper type attributes', () => {
      render(<ConfirmationDialog {...defaultProps} />)

      // Get only the actual dialog buttons (Cancel and Confirm), not the mocked modal close button
      const cancelButton = screen.getByText('Cancel')
      const confirmButton = screen.getByText('Confirm')

      expect(cancelButton).toHaveAttribute('type', 'button')
      expect(confirmButton).toHaveAttribute('type', 'button')
    })

    test('disabled buttons have proper styling', () => {
      render(<ConfirmationDialog {...defaultProps} isLoading={true} />)

      const cancelButton = screen.getByText('Cancel')
      const confirmButton = screen.getByText('Processing...')

      expect(cancelButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
      expect(confirmButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })
  })

  describe('Dark Mode Support', () => {
    test('applies dark mode classes throughout', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />)

      // Check title
      const title = screen.getByText('Confirm Action')
      expect(title.closest('h3')).toHaveClass('dark:text-white')

      // Check message
      const message = screen.getByText('Are you sure you want to proceed?')
      expect(message).toHaveClass('dark:text-gray-300')

      // Check cancel button
      const cancelButton = screen.getByText('Cancel')
      expect(cancelButton).toHaveClass('dark:text-gray-300', 'dark:bg-gray-700')
    })
  })

  describe('Modal Integration', () => {
    test('passes correct props to Modal component', () => {
      render(<ConfirmationDialog {...defaultProps} />)

      const modal = screen.getByTestId('modal')
      expect(modal).toHaveAttribute('data-size', 'sm')
    })

    test('Modal close button triggers onClose', () => {
      const mockOnClose = jest.fn()
      render(<ConfirmationDialog {...defaultProps} onClose={mockOnClose} />)

      const modalCloseButton = screen.getByTestId('modal-close')
      fireEvent.click(modalCloseButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge Cases', () => {
    test('handles empty message gracefully', () => {
      render(<ConfirmationDialog {...defaultProps} message="" />)

      const messageBox = document.querySelector('.text-sm.text-gray-700')
      expect(messageBox).toBeInTheDocument()
      expect(messageBox).toHaveTextContent('')
    })

    test('handles very long title and message', () => {
      const longTitle = 'A'.repeat(100)
      const longMessage = 'B'.repeat(500)

      render(
        <ConfirmationDialog
          {...defaultProps}
          title={longTitle}
          message={longMessage}
        />
      )

      expect(screen.getByText(longTitle)).toBeInTheDocument()
      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    test('handles rapid confirm clicks', async () => {
      const mockOnConfirm = jest.fn()
      render(<ConfirmationDialog {...defaultProps} onConfirm={mockOnConfirm} />)

      const confirmButton = screen.getByText('Confirm')

      // Click multiple times rapidly
      fireEvent.click(confirmButton)
      fireEvent.click(confirmButton)
      fireEvent.click(confirmButton)

      await waitFor(() => {
        // Should still only be called 3 times (not prevented in the component)
        expect(mockOnConfirm).toHaveBeenCalledTimes(3)
      })
    })
  })
})