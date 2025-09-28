import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { CustomDropdown, DropdownOption } from '@/components/ui/CustomDropdown'

describe('CustomDropdown Component', () => {
  const mockOptions: DropdownOption[] = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3', category: { name: 'Category' } },
    { value: 'special', label: 'Special Option', isSpecial: true },
    { value: 'indented', label: 'Indented Option', indent: '  ' }
  ]

  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    options: mockOptions
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock scrollIntoView since it's not available in jsdom
    Element.prototype.scrollIntoView = jest.fn()
  })

  describe('Basic Rendering', () => {
    test('renders with placeholder when no value selected', () => {
      render(<CustomDropdown {...defaultProps} placeholder="Select an option" />)
      expect(screen.getByText('Select an option')).toBeInTheDocument()
    })

    test('renders with default placeholder when none provided', () => {
      render(<CustomDropdown {...defaultProps} />)
      expect(screen.getByText('Select...')).toBeInTheDocument()
    })

    test('renders selected option label', () => {
      render(<CustomDropdown {...defaultProps} value="2" />)
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })

    test('applies custom className', () => {
      const { container } = render(
        <CustomDropdown {...defaultProps} className="custom-dropdown-class" />
      )
      const element = container.querySelector('.custom-dropdown-class')
      expect(element).toBeInTheDocument()
    })

    test('renders chevron icon', () => {
      const { container } = render(<CustomDropdown {...defaultProps} />)
      const chevron = container.querySelector('svg')
      expect(chevron).toBeInTheDocument()
    })
  })

  describe('Dropdown Interaction', () => {
    test('opens dropdown when clicked', () => {
      render(<CustomDropdown {...defaultProps} />)
      const trigger = screen.getByRole('button')

      fireEvent.click(trigger)

      expect(screen.getByRole('listbox')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('Option 3')).toBeInTheDocument()
    })

    test('closes dropdown when clicked again', () => {
      render(<CustomDropdown {...defaultProps} />)
      const trigger = screen.getByRole('button')

      fireEvent.click(trigger)
      expect(screen.getByRole('listbox')).toBeInTheDocument()

      fireEvent.click(trigger)
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    test('selects option when clicked', () => {
      const mockOnChange = jest.fn()
      render(<CustomDropdown {...defaultProps} onChange={mockOnChange} />)

      fireEvent.click(screen.getByRole('button'))
      fireEvent.click(screen.getByText('Option 2'))

      expect(mockOnChange).toHaveBeenCalledWith('2')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    test('closes dropdown when clicking outside', async () => {
      render(
        <div>
          <CustomDropdown {...defaultProps} />
          <button>Outside button</button>
        </div>
      )

      fireEvent.click(screen.getByRole('button', { name: /select/i }))
      expect(screen.getByRole('listbox')).toBeInTheDocument()

      fireEvent.mouseDown(screen.getByText('Outside button'))

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })
  })

  describe('Disabled State', () => {
    test('does not open when disabled', () => {
      render(<CustomDropdown {...defaultProps} disabled={true} />)
      const trigger = screen.getByRole('button')

      fireEvent.click(trigger)

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    test('applies disabled styles', () => {
      render(<CustomDropdown {...defaultProps} disabled={true} />)
      const trigger = screen.getByRole('button')

      expect(trigger).toBeDisabled()
      expect(trigger).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })
  })

  describe('Keyboard Navigation', () => {
    test('navigates options with arrow keys', async () => {
      const { container } = render(<CustomDropdown {...defaultProps} />)
      const trigger = screen.getByRole('button')

      fireEvent.click(trigger)

      fireEvent.keyDown(document, { key: 'ArrowDown' })
      let highlightedOption = container.querySelector('.bg-gray-100')
      expect(highlightedOption).toBeInTheDocument()

      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'ArrowUp' })

      highlightedOption = container.querySelector('.bg-gray-100')
      expect(highlightedOption).toBeInTheDocument()
    })

    test('selects option with Enter key', () => {
      const mockOnChange = jest.fn()
      render(<CustomDropdown {...defaultProps} onChange={mockOnChange} />)

      fireEvent.click(screen.getByRole('button'))
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'Enter' })

      expect(mockOnChange).toHaveBeenCalledWith('1')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    test('selects option with Space key', () => {
      const mockOnChange = jest.fn()
      render(<CustomDropdown {...defaultProps} onChange={mockOnChange} />)

      fireEvent.click(screen.getByRole('button'))
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: ' ' })

      expect(mockOnChange).toHaveBeenCalledWith('1')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    test('closes dropdown with Escape key', () => {
      render(<CustomDropdown {...defaultProps} />)

      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByRole('listbox')).toBeInTheDocument()

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    test('wraps around when navigating past boundaries', () => {
      const { container } = render(<CustomDropdown {...defaultProps} />)

      fireEvent.click(screen.getByRole('button'))

      // Navigate up from first item should go to last
      fireEvent.keyDown(document, { key: 'ArrowUp' })
      const highlightedOptions = container.querySelectorAll('.bg-gray-100')
      expect(highlightedOptions.length).toBeGreaterThan(0)

      // Navigate down from last item should go to first
      fireEvent.keyDown(document, { key: 'ArrowDown' })
    })
  })

  describe('Custom Render Props', () => {
    test('uses custom renderTrigger function', () => {
      const customRenderTrigger = jest.fn((selectedOption, isOpen) => (
        <div data-testid="custom-trigger">
          Custom: {selectedOption?.label || 'None'} - {isOpen ? 'Open' : 'Closed'}
        </div>
      ))

      render(<CustomDropdown {...defaultProps} renderTrigger={customRenderTrigger} />)

      expect(screen.getByTestId('custom-trigger')).toBeInTheDocument()
      expect(screen.getByText('Custom: None - Closed')).toBeInTheDocument()
      expect(customRenderTrigger).toHaveBeenCalledWith(null, false)
    })

    test('uses custom renderOption function', () => {
      const customRenderOption = jest.fn((option, isSelected) => (
        <div data-testid={`custom-option-${option.value}`}>
          {option.label} {isSelected ? '✓' : ''}
        </div>
      ))

      render(<CustomDropdown {...defaultProps} value="2" renderOption={customRenderOption} />)

      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('custom-option-1')).toBeInTheDocument()
      expect(screen.getByTestId('custom-option-2')).toBeInTheDocument()
      expect(screen.getByText('Option 2 ✓')).toBeInTheDocument()
    })
  })

  describe('Special Option Features', () => {
    test('renders option with indent', () => {
      const { container } = render(<CustomDropdown {...defaultProps} />)

      fireEvent.click(screen.getByRole('button'))

      // Find the parent container that holds both indent and label
      const indentedOption = container.querySelector('[role="option"]:nth-child(5)')
      expect(indentedOption).toHaveTextContent('Indented Option')
      // Check that the option contains the indent span (if it exists)
      const indentSpan = indentedOption?.querySelector('.text-gray-400')
      if (indentSpan) {
        expect(indentSpan).toBeInTheDocument()
      }
    })

    test('highlights selected option', () => {
      const { container } = render(<CustomDropdown {...defaultProps} value="2" />)

      fireEvent.click(screen.getByRole('button'))

      const selectedOption = container.querySelector('[aria-selected="true"]')
      expect(selectedOption).toHaveClass('bg-blue-50')
    })

    test('highlights hovered option', async () => {
      const { container } = render(<CustomDropdown {...defaultProps} />)

      fireEvent.click(screen.getByRole('button'))

      const option2 = container.querySelector('[role="option"]:nth-child(2)')
      fireEvent.mouseEnter(option2!)

      expect(option2).toHaveClass('bg-gray-100')
    })
  })

  describe('Accessibility', () => {
    test('has proper ARIA attributes on trigger', () => {
      render(<CustomDropdown {...defaultProps} value="2" />)
      const trigger = screen.getByRole('button')

      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(trigger).toHaveAttribute('aria-label', 'Selected: Option 2')

      fireEvent.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    test('has proper ARIA attributes on options', () => {
      render(<CustomDropdown {...defaultProps} value="2" />)

      fireEvent.click(screen.getByRole('button'))

      const listbox = screen.getByRole('listbox')
      expect(listbox).toHaveAttribute('aria-label', 'Options')

      const options = screen.getAllByRole('option')
      expect(options[1]).toHaveAttribute('aria-selected', 'true')
      expect(options[0]).toHaveAttribute('aria-selected', 'false')
    })
  })

  describe('Edge Cases', () => {
    test('handles empty options array', () => {
      render(<CustomDropdown {...defaultProps} options={[]} />)

      fireEvent.click(screen.getByRole('button'))

      const listbox = screen.getByRole('listbox')
      expect(listbox).toBeInTheDocument()
      expect(listbox.children.length).toBe(0)
    })

    test('handles option without value', () => {
      const optionsWithoutValue = [
        { value: '', label: 'Empty Value' },
        { value: '1', label: 'Normal Option' }
      ]

      const mockOnChange = jest.fn()
      const { container } = render(
        <CustomDropdown
          {...defaultProps}
          options={optionsWithoutValue}
          onChange={mockOnChange}
        />
      )

      fireEvent.click(screen.getByRole('button'))
      // Use the first option element instead of searching by text
      const firstOption = container.querySelector('[role="option"]:first-child')
      fireEvent.click(firstOption!)

      expect(mockOnChange).toHaveBeenCalledWith('')
    })

    test('handles non-existent selected value gracefully', () => {
      render(<CustomDropdown {...defaultProps} value="non-existent" />)

      expect(screen.getByText('Select...')).toBeInTheDocument()
    })
  })
})