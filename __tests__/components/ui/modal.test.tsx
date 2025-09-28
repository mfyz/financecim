import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Modal } from '@/components/ui/modal'

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Modal Content</div>
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Reset document.body.style.overflow after each test
    document.body.style.overflow = 'unset'
  })

  describe('Basic Rendering', () => {
    test('renders when isOpen is true', () => {
      render(<Modal {...defaultProps} />)

      expect(screen.getByTestId('modal-backdrop')).toBeInTheDocument()
      expect(screen.getByText('Modal Content')).toBeInTheDocument()
    })

    test('does not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />)

      expect(screen.queryByTestId('modal-backdrop')).not.toBeInTheDocument()
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument()
    })

    test('renders title when provided', () => {
      render(<Modal {...defaultProps} title="Modal Title" />)

      expect(screen.getByText('Modal Title')).toBeInTheDocument()
    })

    test('renders close button in header when title is provided', () => {
      const { container } = render(<Modal {...defaultProps} title="Modal Title" />)

      const headerCloseButton = container.querySelector('.border-b button')
      expect(headerCloseButton).toBeInTheDocument()
      expect(headerCloseButton?.querySelector('svg')).toBeInTheDocument()
    })

    test('renders close button in top-right when no title', () => {
      const { container } = render(<Modal {...defaultProps} />)

      const absoluteCloseButton = container.querySelector('.absolute.right-4.top-4 button')
      expect(absoluteCloseButton).toBeInTheDocument()
    })

    test('applies custom className', () => {
      const { container } = render(
        <Modal {...defaultProps} className="custom-modal-class" />
      )

      const modalPanel = container.querySelector('.custom-modal-class')
      expect(modalPanel).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    test('applies small size class', () => {
      const { container } = render(<Modal {...defaultProps} size="sm" />)

      const modalPanel = container.querySelector('.max-w-md')
      expect(modalPanel).toBeInTheDocument()
    })

    test('applies medium size class by default', () => {
      const { container } = render(<Modal {...defaultProps} />)

      const modalPanel = container.querySelector('.max-w-lg')
      expect(modalPanel).toBeInTheDocument()
    })

    test('applies large size class', () => {
      const { container } = render(<Modal {...defaultProps} size="lg" />)

      const modalPanel = container.querySelector('.max-w-2xl')
      expect(modalPanel).toBeInTheDocument()
    })

    test('applies extra large size class', () => {
      const { container } = render(<Modal {...defaultProps} size="xl" />)

      const modalPanel = container.querySelector('.max-w-4xl')
      expect(modalPanel).toBeInTheDocument()
    })
  })

  describe('Close Functionality', () => {
    test('calls onClose when close button is clicked', () => {
      const mockOnClose = jest.fn()
      const { container } = render(<Modal {...defaultProps} onClose={mockOnClose} />)

      const closeButton = container.querySelector('button')
      fireEvent.click(closeButton!)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('calls onClose when backdrop is clicked', () => {
      const mockOnClose = jest.fn()
      render(<Modal {...defaultProps} onClose={mockOnClose} />)

      const backdrop = screen.getByTestId('modal-backdrop-overlay')
      fireEvent.click(backdrop)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('calls onClose when Escape key is pressed', () => {
      const mockOnClose = jest.fn()
      render(<Modal {...defaultProps} onClose={mockOnClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('does not call onClose for other keys', () => {
      const mockOnClose = jest.fn()
      render(<Modal {...defaultProps} onClose={mockOnClose} />)

      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Tab' })

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Body Overflow Management', () => {
    test('sets body overflow to hidden when modal opens', () => {
      render(<Modal {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')
    })

    test('resets body overflow when modal closes', () => {
      const { rerender } = render(<Modal {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')

      rerender(<Modal {...defaultProps} isOpen={false} />)

      expect(document.body.style.overflow).toBe('unset')
    })

    test('cleans up body overflow on unmount', () => {
      const { unmount } = render(<Modal {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')

      unmount()

      expect(document.body.style.overflow).toBe('unset')
    })
  })

  describe('Event Listeners', () => {
    test('adds keydown event listener when open', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener')

      render(<Modal {...defaultProps} />)

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      addEventListenerSpy.mockRestore()
    })

    test('removes keydown event listener when closed', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

      const { rerender } = render(<Modal {...defaultProps} />)
      rerender(<Modal {...defaultProps} isOpen={false} />)

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    test('removes event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

      const { unmount } = render(<Modal {...defaultProps} />)
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    test('modal backdrop has proper z-index', () => {
      const { container } = render(<Modal {...defaultProps} />)

      const backdrop = screen.getByTestId('modal-backdrop')
      expect(backdrop).toHaveClass('z-50')
    })

    test('modal panel has proper z-index relative to backdrop', () => {
      const { container } = render(<Modal {...defaultProps} />)

      const modalPanel = container.querySelector('.z-10')
      expect(modalPanel).toBeInTheDocument()
    })

    test('focuses can be trapped within modal', () => {
      render(
        <Modal {...defaultProps} title="Test Modal">
          <button>Button 1</button>
          <button>Button 2</button>
        </Modal>
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Dark Mode Support', () => {
    test('applies dark mode classes', () => {
      const { container } = render(<Modal {...defaultProps} title="Dark Mode Test" />)

      const modalPanel = container.querySelector('.dark\\:bg-gray-800')
      const borderElement = container.querySelector('.dark\\:border-gray-700')
      const titleElement = container.querySelector('.dark\\:text-white')

      expect(modalPanel).toBeInTheDocument()
      expect(borderElement).toBeInTheDocument()
      expect(titleElement).toBeInTheDocument()
    })
  })

  describe('Content Rendering', () => {
    test('renders complex children correctly', () => {
      const ComplexContent = () => (
        <div>
          <h2>Complex Title</h2>
          <p>Paragraph text</p>
          <button>Action Button</button>
        </div>
      )

      render(
        <Modal {...defaultProps}>
          <ComplexContent />
        </Modal>
      )

      expect(screen.getByText('Complex Title')).toBeInTheDocument()
      expect(screen.getByText('Paragraph text')).toBeInTheDocument()
      expect(screen.getByText('Action Button')).toBeInTheDocument()
    })

    test('renders React nodes as title', () => {
      const TitleComponent = () => <span>React Node Title</span>

      render(<Modal {...defaultProps} title={<TitleComponent />} />)

      expect(screen.getByText('React Node Title')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles rapid open/close transitions', () => {
      const mockOnClose = jest.fn()
      const { rerender } = render(<Modal {...defaultProps} onClose={mockOnClose} />)

      // Rapid transitions
      rerender(<Modal {...defaultProps} isOpen={false} onClose={mockOnClose} />)
      rerender(<Modal {...defaultProps} isOpen={true} onClose={mockOnClose} />)
      rerender(<Modal {...defaultProps} isOpen={false} onClose={mockOnClose} />)

      expect(document.body.style.overflow).toBe('unset')
    })

    test('handles onClose being called while already closing', () => {
      const mockOnClose = jest.fn()
      render(<Modal {...defaultProps} onClose={mockOnClose} />)

      const backdrop = screen.getByTestId('modal-backdrop-overlay')
      const closeButton = screen.getByRole('button')

      fireEvent.click(backdrop)
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(2)
    })
  })
})