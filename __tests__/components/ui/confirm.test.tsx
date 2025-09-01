import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { Confirm, ConfirmVariant } from '@/components/ui/confirm'

describe('Confirm', () => {
  const mockOnClose = jest.fn()
  const mockOnConfirm = jest.fn()
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    title: 'Are you sure?',
    message: 'This action cannot be undone.',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'warning' as ConfirmVariant,
    isLoading: false,
  }

  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnConfirm.mockClear()
  })

  describe('Rendering', () => {
    test('does not render when isOpen is false', () => {
      render(<Confirm {...defaultProps} isOpen={false} />)

      const modal = screen.queryByTestId('modal-backdrop')
      expect(modal).not.toBeInTheDocument()
    })

    test('renders modal when isOpen is true', () => {
      render(<Confirm {...defaultProps} />)

      const modal = screen.getByTestId('modal-backdrop')
      expect(modal).toBeInTheDocument()

      const content = screen.getByTestId('confirm-modal-content')
      expect(content).toBeInTheDocument()
    })

    test('displays custom title', () => {
      const customTitle = 'Delete Item'
      render(<Confirm {...defaultProps} title={customTitle} />)

      const title = screen.getByTestId('confirm-title')
      expect(title).toHaveTextContent(customTitle)
    })

    test('displays custom message', () => {
      const customMessage = 'Are you sure you want to delete this item? This action cannot be undone.'
      render(<Confirm {...defaultProps} message={customMessage} />)

      const message = screen.getByTestId('confirm-message')
      expect(message).toHaveTextContent(customMessage)
    })

    test('displays custom button texts', () => {
      render(<Confirm {...defaultProps} confirmText="Delete" cancelText="Keep" />)

      const confirmButton = screen.getByTestId('confirm-confirm-button')
      const cancelButton = screen.getByTestId('confirm-cancel-button')

      expect(confirmButton).toHaveTextContent('Delete')
      expect(cancelButton).toHaveTextContent('Keep')
    })
  })

  describe('Variant Styles', () => {
    test('renders danger variant with correct styling', () => {
      render(<Confirm {...defaultProps} variant="danger" />)

      const confirmButton = screen.getByTestId('confirm-confirm-button')
      const icon = screen.getByTestId('confirm-icon')

      expect(confirmButton).toHaveClass('bg-red-600')
      expect(icon).toHaveClass('bg-red-100')
    })

    test('renders warning variant with correct styling', () => {
      render(<Confirm {...defaultProps} variant="warning" />)

      const confirmButton = screen.getByTestId('confirm-confirm-button')
      const icon = screen.getByTestId('confirm-icon')

      expect(confirmButton).toHaveClass('bg-yellow-600')
      expect(icon).toHaveClass('bg-yellow-100')
    })

    test('renders success variant with correct styling', () => {
      render(<Confirm {...defaultProps} variant="success" />)

      const confirmButton = screen.getByTestId('confirm-confirm-button')
      const icon = screen.getByTestId('confirm-icon')

      expect(confirmButton).toHaveClass('bg-green-600')
      expect(icon).toHaveClass('bg-green-100')
    })

    test('renders info variant with correct styling', () => {
      render(<Confirm {...defaultProps} variant="info" />)

      const confirmButton = screen.getByTestId('confirm-confirm-button')
      const icon = screen.getByTestId('confirm-icon')

      expect(confirmButton).toHaveClass('bg-blue-600')
      expect(icon).toHaveClass('bg-blue-100')
    })
  })

  describe('User Interactions', () => {
    test('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup()
      render(<Confirm {...defaultProps} />)

      const confirmButton = screen.getByTestId('confirm-confirm-button')
      await user.click(confirmButton)

      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })

    test('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<Confirm {...defaultProps} />)

      const cancelButton = screen.getByTestId('confirm-cancel-button')
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup()
      render(<Confirm {...defaultProps} />)

      const backdrop = screen.getByTestId('modal-backdrop-overlay')
      await user.click(backdrop)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('does not close when clicking modal content', async () => {
      const user = userEvent.setup()
      render(<Confirm {...defaultProps} />)

      const modalContent = screen.getByTestId('confirm-modal-content')
      await user.click(modalContent)

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    test('calls onClose when pressing Escape key', async () => {
      render(<Confirm {...defaultProps} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Loading State', () => {
    test('shows loading state when isLoading is true', () => {
      render(<Confirm {...defaultProps} isLoading={true} />)

      const confirmButton = screen.getByTestId('confirm-confirm-button')
      const cancelButton = screen.getByTestId('confirm-cancel-button')
      const loadingSpinner = screen.getByTestId('confirm-loading-spinner')

      expect(confirmButton).toHaveTextContent('Loading...')
      expect(confirmButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
      expect(loadingSpinner).toBeInTheDocument()
    })

    test('shows normal state when isLoading is false', () => {
      render(<Confirm {...defaultProps} isLoading={false} />)

      const confirmButton = screen.getByTestId('confirm-confirm-button')
      const cancelButton = screen.getByTestId('confirm-cancel-button')
      const loadingSpinner = screen.queryByTestId('confirm-loading-spinner')

      expect(confirmButton).toHaveTextContent('Confirm')
      expect(confirmButton).not.toBeDisabled()
      expect(cancelButton).not.toBeDisabled()
      expect(loadingSpinner).not.toBeInTheDocument()
    })

    test('prevents interactions when loading', async () => {
      const user = userEvent.setup()
      render(<Confirm {...defaultProps} isLoading={true} />)

      const confirmButton = screen.getByTestId('confirm-confirm-button')
      const cancelButton = screen.getByTestId('confirm-cancel-button')

      // Try to click disabled buttons
      await user.click(confirmButton)
      await user.click(cancelButton)

      expect(mockOnConfirm).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Button Styling', () => {
    test('cancel button has correct styling', () => {
      render(<Confirm {...defaultProps} />)

      const cancelButton = screen.getByTestId('confirm-cancel-button')

      expect(cancelButton).toHaveClass('bg-gray-100')
      expect(cancelButton).toHaveClass('text-gray-700')
      expect(cancelButton).toHaveClass('cursor-pointer')
    })

    test('confirm button has cursor pointer', () => {
      render(<Confirm {...defaultProps} />)

      const confirmButton = screen.getByTestId('confirm-confirm-button')
      expect(confirmButton).toHaveClass('cursor-pointer')
    })
  })

  describe('Edge Cases', () => {
    test('handles empty title gracefully', () => {
      render(<Confirm {...defaultProps} title="" />)

      const title = screen.getByTestId('confirm-title')
      expect(title).toHaveTextContent('')
    })

    test('handles empty message gracefully', () => {
      render(<Confirm {...defaultProps} message="" />)

      const message = screen.getByTestId('confirm-message')
      expect(message).toHaveTextContent('')
    })

    test('handles long title and message', () => {
      const longTitle = 'This is a very long title that should still display properly in the modal without breaking the layout or causing any issues'
      const longMessage = 'This is a very long message that explains in great detail what action is about to be performed and why the user should carefully consider their choice before proceeding with this irreversible action'
      
      render(<Confirm {...defaultProps} title={longTitle} message={longMessage} />)

      const title = screen.getByTestId('confirm-title')
      const message = screen.getByTestId('confirm-message')

      expect(title).toHaveTextContent(longTitle)
      expect(message).toHaveTextContent(longMessage)
    })

    test('escapes HTML content to prevent XSS', () => {
      const maliciousTitle = '<script>alert("xss-title")</script>'
      const maliciousMessage = '<script>alert("xss-message")</script>'
      
      render(<Confirm {...defaultProps} title={maliciousTitle} message={maliciousMessage} />)

      // The content should be displayed as text, not executed as HTML
      const title = screen.getByTestId('confirm-title')
      const message = screen.getByTestId('confirm-message')
      
      expect(title).toHaveTextContent(maliciousTitle)
      expect(message).toHaveTextContent(maliciousMessage)

      // Ensure no script tags are in the DOM
      const scriptTags = document.querySelectorAll('script')
      const alertScripts = Array.from(scriptTags).filter((script) =>
        script.textContent?.includes('alert("xss-title")') || script.textContent?.includes('alert("xss-message")')
      )
      expect(alertScripts).toHaveLength(0)
    })
  })

  describe('Accessibility', () => {
    test('has proper button roles and text', () => {
      render(<Confirm {...defaultProps} />)

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })

      expect(confirmButton).toBeInTheDocument()
      expect(cancelButton).toBeInTheDocument()
    })

    test('focuses are manageable with keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<Confirm {...defaultProps} />)

      const cancelButton = screen.getByTestId('confirm-cancel-button')
      const confirmButton = screen.getByTestId('confirm-confirm-button')

      // Focus the first button programmatically
      cancelButton.focus()
      expect(cancelButton).toHaveFocus()

      // Tab to next button
      await user.tab()
      expect(confirmButton).toHaveFocus()

      // Tab cycles back to close button (which is fine for accessibility)
      await user.tab()
      // The modal's close button should get focus, which is expected behavior
    })
  })

  describe('Props Validation', () => {
    test('uses default props when not provided', () => {
      render(<Confirm isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />)

      const title = screen.getByTestId('confirm-title')
      const message = screen.getByTestId('confirm-message')
      const confirmButton = screen.getByTestId('confirm-confirm-button')
      const cancelButton = screen.getByTestId('confirm-cancel-button')

      expect(title).toHaveTextContent('Are you sure?')
      expect(message).toHaveTextContent('This action cannot be undone.')
      expect(confirmButton).toHaveTextContent('Confirm')
      expect(cancelButton).toHaveTextContent('Cancel')

      // Default variant should be warning
      expect(confirmButton).toHaveClass('bg-yellow-600')
    })

    test('accepts all variant types', () => {
      const variants: ConfirmVariant[] = ['danger', 'warning', 'success', 'info']
      
      variants.forEach(variant => {
        const { unmount } = render(<Confirm {...defaultProps} variant={variant} />)
        
        const confirmButton = screen.getByTestId('confirm-confirm-button')
        
        // Each variant should have different button colors
        switch (variant) {
          case 'danger':
            expect(confirmButton).toHaveClass('bg-red-600')
            break
          case 'warning':
            expect(confirmButton).toHaveClass('bg-yellow-600')
            break
          case 'success':
            expect(confirmButton).toHaveClass('bg-green-600')
            break
          case 'info':
            expect(confirmButton).toHaveClass('bg-blue-600')
            break
        }
        
        unmount()
      })
    })
  })
})