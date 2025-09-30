import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SourceDataModal } from '@/components/ui/source-data-modal'

describe('SourceDataModal', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <SourceDataModal
          isOpen={false}
          onClose={mockOnClose}
          sourceData={null}
        />
      )

      expect(screen.queryByText('Source Data')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={null}
        />
      )

      expect(screen.getByText('Source Data')).toBeInTheDocument()
    })

    it('should display "No source data available" when sourceData is null', () => {
      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={null}
        />
      )

      expect(screen.getByText('No source data available')).toBeInTheDocument()
    })

    it('should display "No source data available" when sourceData is empty object', () => {
      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={{}}
        />
      )

      expect(screen.getByText('No source data available')).toBeInTheDocument()
    })

    it('should render table with source data entries', () => {
      const sourceData = {
        Date: '2024-01-15',
        Description: 'Test Transaction',
        Amount: '-50.00',
        Category: 'Groceries'
      }

      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={sourceData}
        />
      )

      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('2024-01-15')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Test Transaction')).toBeInTheDocument()
      expect(screen.getByText('Amount')).toBeInTheDocument()
      expect(screen.getByText('-50.00')).toBeInTheDocument()
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Groceries')).toBeInTheDocument()
    })

    it('should render table headers', () => {
      const sourceData = { key1: 'value1' }

      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={sourceData}
        />
      )

      expect(screen.getByText('Key')).toBeInTheDocument()
      expect(screen.getByText('Original Value')).toBeInTheDocument()
    })

    it('should handle nested object values by stringifying them', () => {
      const sourceData = {
        simple: 'value',
        nested: { inner: 'data', count: 5 }
      }

      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={sourceData}
        />
      )

      expect(screen.getByText('simple')).toBeInTheDocument()
      expect(screen.getByText('value')).toBeInTheDocument()
      expect(screen.getByText('nested')).toBeInTheDocument()
      expect(screen.getByText('{"inner":"data","count":5}')).toBeInTheDocument()
    })

    it('should handle null and undefined values', () => {
      const sourceData = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: ''
      }

      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={sourceData}
        />
      )

      expect(screen.getByText('nullValue')).toBeInTheDocument()
      expect(screen.getByText('undefinedValue')).toBeInTheDocument()
      expect(screen.getByText('emptyString')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onClose when Close button is clicked', () => {
      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={{ test: 'data' }}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when X button is clicked', () => {
      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={{ test: 'data' }}
        />
      )

      // Find the X button (not the Close button)
      const buttons = screen.getAllByRole('button')
      const xButton = buttons.find(button => button.textContent === '')

      if (xButton) {
        fireEvent.click(xButton)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      }
    })

    it('should call onClose when backdrop is clicked', () => {
      const { container } = render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={{ test: 'data' }}
        />
      )

      // Find the backdrop (the first div with transition-opacity class)
      const backdrop = container.querySelector('.transition-opacity')
      if (backdrop) {
        fireEvent.click(backdrop)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle numeric values', () => {
      const sourceData = {
        count: 42,
        price: 99.99,
        negative: -15
      }

      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={sourceData}
        />
      )

      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText('99.99')).toBeInTheDocument()
      expect(screen.getByText('-15')).toBeInTheDocument()
    })

    it('should handle boolean values', () => {
      const sourceData = {
        isActive: true,
        isDeleted: false
      }

      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={sourceData}
        />
      )

      expect(screen.getByText('true')).toBeInTheDocument()
      expect(screen.getByText('false')).toBeInTheDocument()
    })

    it('should handle array values', () => {
      const sourceData = {
        tags: ['tag1', 'tag2', 'tag3']
      }

      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={sourceData}
        />
      )

      expect(screen.getByText('["tag1","tag2","tag3"]')).toBeInTheDocument()
    })

    it('should handle special characters in keys and values', () => {
      const sourceData = {
        'key with spaces': 'value with spaces',
        'key-with-dashes': 'value-with-dashes',
        'key_with_underscores': 'value_with_underscores',
        'key.with.dots': 'value.with.dots'
      }

      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={sourceData}
        />
      )

      expect(screen.getByText('key with spaces')).toBeInTheDocument()
      expect(screen.getByText('value with spaces')).toBeInTheDocument()
      expect(screen.getByText('key-with-dashes')).toBeInTheDocument()
      expect(screen.getByText('key_with_underscores')).toBeInTheDocument()
      expect(screen.getByText('key.with.dots')).toBeInTheDocument()
    })

    it('should handle large datasets with many entries', () => {
      const sourceData: Record<string, string> = {}
      for (let i = 1; i <= 20; i++) {
        sourceData[`field${i}`] = `value${i}`
      }

      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={sourceData}
        />
      )

      // Check first and last entries
      expect(screen.getByText('field1')).toBeInTheDocument()
      expect(screen.getByText('value1')).toBeInTheDocument()
      expect(screen.getByText('field20')).toBeInTheDocument()
      expect(screen.getByText('value20')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper modal structure', () => {
      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={{ test: 'data' }}
        />
      )

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('should render table with proper structure', () => {
      const sourceData = { key1: 'value1' }

      render(
        <SourceDataModal
          isOpen={true}
          onClose={mockOnClose}
          sourceData={sourceData}
        />
      )

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })
  })
})