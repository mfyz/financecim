import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TransactionsTable, type Transaction } from '@/components/tables/transactions-table'

describe('TransactionsTable', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      date: '2025-01-15',
      description: 'Test Purchase 1',
      amount: -50.00,
      category: 'Groceries',
      source: 'Test Bank',
      status: 'completed',
    },
    {
      id: '2',
      date: '2025-01-14',
      description: 'Test Deposit',
      amount: 1000.00,
      category: 'Income',
      source: 'Test Employer',
      status: 'completed',
    },
    {
      id: '3',
      date: '2025-01-13',
      description: 'Test Purchase 2',
      amount: -25.50,
      category: 'Entertainment',
      source: 'Test Card',
      status: 'pending',
    },
    {
      id: '4',
      date: '2025-01-12',
      description: 'Failed Transaction',
      amount: -100.00,
      category: 'Shopping',
      source: 'Test Bank',
      status: 'failed',
    }
  ]

  const mockOnRowClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders transactions table with all columns', () => {
      render(<TransactionsTable transactions={mockTransactions} />)

      // Check headers
      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Amount')).toBeInTheDocument()
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Source')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    test('renders transaction data correctly', () => {
      render(<TransactionsTable transactions={mockTransactions} />)

      // Check first transaction
      expect(screen.getByText('Test Purchase 1')).toBeInTheDocument()
      expect(screen.getByText('$50.00')).toBeInTheDocument()
      expect(screen.getByText('Groceries')).toBeInTheDocument()
      // Use getAllByText since "Test Bank" appears multiple times
      const testBankElements = screen.getAllByText('Test Bank')
      expect(testBankElements.length).toBeGreaterThan(0)
    })

    test('renders empty state when no transactions', () => {
      render(<TransactionsTable transactions={[]} />)

      expect(screen.getByText('No data found')).toBeInTheDocument()
    })

    test('formats dates correctly', () => {
      render(<TransactionsTable transactions={[mockTransactions[0]]} />)

      // Date is formatted by toLocaleDateString()
      // Format may vary by locale, so just check that date is rendered
      expect(screen.getByText(/2025/)).toBeInTheDocument()
    })

    test('formats amounts with correct styling', () => {
      render(<TransactionsTable transactions={mockTransactions} />)

      // Negative amount should have red color class
      const expenseAmount = screen.getByText('$50.00')
      expect(expenseAmount).toHaveClass('text-red-600')

      // Positive amount should have green color class and + prefix
      const incomeAmount = screen.getByText('+$1000.00')
      expect(incomeAmount).toHaveClass('text-green-600')
    })

    test('renders status badges with correct styling', () => {
      render(<TransactionsTable transactions={mockTransactions} />)

      // Completed status (multiple elements with 'completed')
      const completedBadges = screen.getAllByText('completed')
      expect(completedBadges[0]).toHaveClass('bg-green-100', 'text-green-800')

      // Pending status
      const pendingBadge = screen.getByText('pending')
      expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')

      // Failed status
      const failedBadge = screen.getByText('failed')
      expect(failedBadge).toHaveClass('bg-red-100', 'text-red-800')
    })
  })

  describe('Interactions', () => {
    test('calls onRowClick when row is clicked', () => {
      render(
        <TransactionsTable
          transactions={mockTransactions}
          onRowClick={mockOnRowClick}
        />
      )

      // Click on a transaction row
      const firstRow = screen.getByText('Test Purchase 1').closest('tr')
      if (firstRow) {
        fireEvent.click(firstRow)
      }

      expect(mockOnRowClick).toHaveBeenCalledTimes(1)
      expect(mockOnRowClick).toHaveBeenCalledWith(mockTransactions[0])
    })

    test('does not error when onRowClick is not provided', () => {
      render(<TransactionsTable transactions={mockTransactions} />)

      const firstRow = screen.getByText('Test Purchase 1').closest('tr')

      // Should not throw when clicking without handler
      expect(() => {
        if (firstRow) fireEvent.click(firstRow)
      }).not.toThrow()
    })
  })

  describe('Data Table Integration', () => {
    test('passes correct columns configuration to DataTable', () => {
      render(<TransactionsTable transactions={mockTransactions} />)

      // Check that sortable columns have sort indicators (chevrons, not buttons)
      const dateHeader = screen.getByText('Date').closest('th')
      expect(dateHeader).toBeInTheDocument()
      // Sortable columns should have cursor-pointer class
      expect(dateHeader).toHaveClass('cursor-pointer')

      const amountHeader = screen.getByText('Amount').closest('th')
      expect(amountHeader).toBeInTheDocument()
      expect(amountHeader).toHaveClass('cursor-pointer')
    })

    test('search input filters transactions', () => {
      render(<TransactionsTable transactions={mockTransactions} />)

      // Find search input
      const searchInput = screen.getByPlaceholderText('Search...')

      // Type in search
      fireEvent.change(searchInput, { target: { value: 'Deposit' } })

      // Should only show matching transaction
      expect(screen.getByText('Test Deposit')).toBeInTheDocument()
      expect(screen.queryByText('Test Purchase 1')).not.toBeInTheDocument()
      expect(screen.queryByText('Test Purchase 2')).not.toBeInTheDocument()
    })

    test('handles large amounts with proper formatting', () => {
      const largeTransaction: Transaction = {
        id: '5',
        date: '2025-01-01',
        description: 'Large Transaction',
        amount: 1234567.89,
        category: 'Income',
        source: 'Test',
        status: 'completed',
      }

      render(<TransactionsTable transactions={[largeTransaction]} />)

      // No comma formatting in the actual component
      expect(screen.getByText('+$1234567.89')).toBeInTheDocument()
    })

    test('handles negative amounts correctly', () => {
      const negativeTransaction: Transaction = {
        id: '6',
        date: '2025-01-01',
        description: 'Expense',
        amount: -0.01,
        category: 'Test',
        source: 'Test',
        status: 'completed',
      }

      render(<TransactionsTable transactions={[negativeTransaction]} />)

      const amount = screen.getByText('$0.01')
      expect(amount).toHaveClass('text-red-600')
    })
  })

  describe('Accessibility', () => {
    test('has proper table structure for screen readers', () => {
      const { container } = render(<TransactionsTable transactions={mockTransactions} />)

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()

      const thead = table?.querySelector('thead')
      expect(thead).toBeInTheDocument()

      const tbody = table?.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
    })

    test('provides meaningful text for all interactive elements', () => {
      render(<TransactionsTable transactions={mockTransactions} />)

      // Search should have accessible placeholder
      const searchInput = screen.getByPlaceholderText('Search...')
      expect(searchInput).toHaveAttribute('type', 'text')
    })
  })

  describe('Edge Cases', () => {
    test('handles transactions with missing optional fields', () => {
      const minimalTransaction: Transaction = {
        id: '7',
        date: '2025-01-01',
        description: 'Minimal',
        amount: 0,
        category: '',
        source: '',
        status: 'completed',
      }

      expect(() => {
        render(<TransactionsTable transactions={[minimalTransaction]} />)
      }).not.toThrow()
    })

    test('handles invalid date gracefully', () => {
      const invalidDateTransaction: Transaction = {
        id: '8',
        date: 'invalid-date',
        description: 'Invalid Date Test',
        amount: 100,
        category: 'Test',
        source: 'Test',
        status: 'completed',
      }

      render(<TransactionsTable transactions={[invalidDateTransaction]} />)

      // Should render the description even if date is invalid
      expect(screen.getByText('Invalid Date Test')).toBeInTheDocument()
    })
  })
})