import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ImportStep2Page from '@/app/import/step2/page'

// Mock Next.js modules
jest.mock('next/link', () => {
  return function MockLink({ children, href, className, onClick }: any) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    )
  }
})

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock sessionStorage
const mockSessionStorage: { [key: string]: string } = {}

beforeAll(() => {
  global.Storage.prototype.getItem = jest.fn((key: string) => mockSessionStorage[key] || null)
  global.Storage.prototype.setItem = jest.fn((key: string, value: string) => {
    mockSessionStorage[key] = value
  })
  global.Storage.prototype.removeItem = jest.fn((key: string) => {
    delete mockSessionStorage[key]
  })
})

describe('Transaction Type Detection and Consolidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.keys(mockSessionStorage).forEach(key => delete mockSessionStorage[key])
  })

  describe('Auto-detection of Transaction Type column', () => {
    test('should detect column with only Credit and Debit values', async () => {
      // Setup CSV data with transaction type column
      const csvData = [
        ['Account Number', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Deposit', '12/30/24', 'Credit', '100.00'],
        ['5706', 'Withdrawal', '12/29/24', 'Debit', '50.00'],
        ['5706', 'Payment', '12/28/24', 'Credit', '200.00'],
        ['5706', 'Purchase', '12/27/24', 'Debit', '75.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)

      render(<ImportStep2Page />)

      await waitFor(() => {
        // Check if the transaction type banner is displayed
        expect(screen.getByText('Transaction Type column detected')).toBeInTheDocument()
      })

      // Check banner message
      expect(screen.getByText(/We detected a column with only "Credit" and "Debit" values/)).toBeInTheDocument()
    })

    test('should not detect column with mixed values beyond Credit/Debit', async () => {
      const csvData = [
        ['Account Number', 'Description', 'Date', 'Type', 'Amount'],
        ['5706', 'Deposit', '12/30/24', 'Credit', '100.00'],
        ['5706', 'Withdrawal', '12/29/24', 'Debit', '50.00'],
        ['5706', 'Payment', '12/28/24', 'Transfer', '200.00'], // Mixed value
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)

      render(<ImportStep2Page />)

      await waitFor(() => {
        expect(screen.queryByText('Transaction Type column detected')).not.toBeInTheDocument()
      })
    })

    test('should handle case-insensitive Credit/Debit detection', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Type', 'Amount'],
        ['5706', 'Deposit', '12/30/24', 'CREDIT', '100.00'],
        ['5706', 'Withdrawal', '12/29/24', 'debit', '50.00'],
        ['5706', 'Payment', '12/28/24', 'Credit', '200.00'],
        ['5706', 'Purchase', '12/27/24', 'Debit', '75.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)

      render(<ImportStep2Page />)

      await waitFor(() => {
        expect(screen.getByText('Transaction Type column detected')).toBeInTheDocument()
      })
    })
  })

  describe('Transaction Type Banner Interaction', () => {
    test('should show enable button in banner', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Deposit', '12/30/24', 'Credit', '100.00'],
        ['5706', 'Withdrawal', '12/29/24', 'Debit', '50.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)

      render(<ImportStep2Page />)

      await waitFor(() => {
        expect(screen.getByText('Enable Transaction Type Consolidation')).toBeInTheDocument()
      })
    })

    test('should enable consolidation when button is clicked', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Deposit', '12/30/24', 'Credit', '100.00'],
        ['5706', 'Withdrawal', '12/29/24', 'Debit', '50.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)

      render(<ImportStep2Page />)

      await waitFor(() => {
        const enableButton = screen.getByText('Enable Transaction Type Consolidation')
        fireEvent.click(enableButton)
      })

      // Banner should disappear after enabling
      await waitFor(() => {
        expect(screen.queryByText('Enable Transaction Type Consolidation')).not.toBeInTheDocument()
      })

      // Checkbox should appear and be checked
      await waitFor(() => {
        const checkbox = screen.getByLabelText(/Consolidate amounts based on Transaction Type/)
        expect(checkbox).toBeChecked()
      })
    })

    test('should allow dismissing the banner', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Deposit', '12/30/24', 'Credit', '100.00'],
        ['5706', 'Withdrawal', '12/29/24', 'Debit', '50.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)

      render(<ImportStep2Page />)

      await waitFor(() => {
        expect(screen.getByText('Transaction Type column detected')).toBeInTheDocument()
      })

      // Find and click the X button
      const dismissButtons = screen.getAllByRole('button')
      const xButton = dismissButtons.find(btn => btn.querySelector('svg'))

      if (xButton) {
        fireEvent.click(xButton)
      }

      await waitFor(() => {
        expect(screen.queryByText('Transaction Type column detected')).not.toBeInTheDocument()
      })
    })
  })

  describe('Transaction Type Checkbox', () => {
    test('should show checkbox when transaction type column is mapped', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Deposit', '12/30/24', 'Credit', '100.00'],
        ['5706', 'Withdrawal', '12/29/24', 'Debit', '50.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)

      render(<ImportStep2Page />)

      await waitFor(() => {
        const checkbox = screen.getByLabelText(/Consolidate amounts based on Transaction Type/)
        expect(checkbox).toBeInTheDocument()
      })
    })

    test('should toggle checkbox state', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Deposit', '12/30/24', 'Credit', '100.00'],
        ['5706', 'Withdrawal', '12/29/24', 'Debit', '50.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)

      render(<ImportStep2Page />)

      await waitFor(() => {
        const checkbox = screen.getByLabelText(/Consolidate amounts based on Transaction Type/) as HTMLInputElement
        expect(checkbox.checked).toBe(false)
      })

      const checkbox = screen.getByLabelText(/Consolidate amounts based on Transaction Type/) as HTMLInputElement
      fireEvent.click(checkbox)

      await waitFor(() => {
        expect(checkbox.checked).toBe(true)
      })
    })
  })

  describe('Amount Consolidation Logic', () => {
    test('should consolidate debit transactions as negative amounts', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Purchase', '12/30/24', 'Debit', '1427.36'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)
      mockSessionStorage['columnMapping'] = JSON.stringify({
        date: '2',
        description: '1',
        amount: '4',
        transaction_type: '3',
        source_category: ''
      })
      mockSessionStorage['useTransactionType'] = 'true'
      mockSessionStorage['selectedSourceId'] = '1'

      render(<ImportStep2Page />)

      await waitFor(() => {
        // Look for the consolidated amount in preview table
        // Debit should be negative
        const amountCell = screen.getByText(/1,427\.36/)
        expect(amountCell).toBeInTheDocument()
        // Check if it has red color class (negative amount)
        expect(amountCell.className).toContain('text-red-600')
      })
    })

    test('should consolidate credit transactions as positive amounts', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Deposit', '12/30/24', 'Credit', '450.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)
      mockSessionStorage['columnMapping'] = JSON.stringify({
        date: '2',
        description: '1',
        amount: '4',
        transaction_type: '3',
        source_category: ''
      })
      mockSessionStorage['useTransactionType'] = 'true'
      mockSessionStorage['selectedSourceId'] = '1'

      render(<ImportStep2Page />)

      await waitFor(() => {
        // Look for the formatted amount with $ sign
        // Credit should be positive
        const amountCell = screen.getByText('$450.00')
        expect(amountCell).toBeInTheDocument()
        // Check if it has green color class (positive amount)
        expect(amountCell.className).toContain('text-green-600')
      })
    })

    test('should handle mixed credit and debit transactions', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Purchase', '12/30/24', 'Debit', '100.00'],
        ['5706', 'Deposit', '12/29/24', 'Credit', '200.00'],
        ['5706', 'Withdrawal', '12/28/24', 'Debit', '50.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)
      mockSessionStorage['columnMapping'] = JSON.stringify({
        date: '2',
        description: '1',
        amount: '4',
        transaction_type: '3',
        source_category: ''
      })
      mockSessionStorage['useTransactionType'] = 'true'
      mockSessionStorage['selectedSourceId'] = '1'

      render(<ImportStep2Page />)

      await waitFor(() => {
        // Should have both red (negative) and green (positive) amounts
        const redAmounts = screen.getAllByText(/100\.00|50\.00/).filter(el =>
          el.className.includes('text-red-600')
        )
        const greenAmounts = screen.getAllByText(/200\.00/).filter(el =>
          el.className.includes('text-green-600')
        )

        expect(redAmounts.length).toBeGreaterThan(0)
        expect(greenAmounts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Validation with Transaction Type', () => {
    test('should allow proceeding when transaction type + amount are mapped and enabled', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Purchase', '12/30/24', 'Debit', '100.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)
      mockSessionStorage['columnMapping'] = JSON.stringify({
        date: '2',
        description: '1',
        amount: '4',
        transaction_type: '3',
        source_category: ''
      })
      mockSessionStorage['useTransactionType'] = 'true'
      mockSessionStorage['selectedSourceId'] = '1'

      render(<ImportStep2Page />)

      await waitFor(() => {
        const nextButton = screen.getByText('Next: Preview Data')
        expect(nextButton).not.toHaveClass('pointer-events-none')
      })
    })

    test('should require amount column when transaction type is enabled', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Balance'],
        ['5706', 'Purchase', '12/30/24', 'Debit', '1000.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)
      mockSessionStorage['columnMapping'] = JSON.stringify({
        date: '2',
        description: '1',
        amount: '', // No amount mapped
        transaction_type: '3',
        source_category: ''
      })
      mockSessionStorage['useTransactionType'] = 'true'
      mockSessionStorage['selectedSourceId'] = '1'

      render(<ImportStep2Page />)

      await waitFor(() => {
        // Should show validation error
        expect(screen.getByText('Missing required mappings')).toBeInTheDocument()
      })
    })
  })

  describe('State Persistence', () => {
    test('should save transaction type setting to sessionStorage', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Purchase', '12/30/24', 'Debit', '100.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)

      render(<ImportStep2Page />)

      await waitFor(() => {
        const checkbox = screen.getByLabelText(/Consolidate amounts based on Transaction Type/)
        fireEvent.click(checkbox)
      })

      await waitFor(() => {
        expect(mockSessionStorage['useTransactionType']).toBe('true')
      })
    })

    test('should load saved transaction type setting from sessionStorage', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Purchase', '12/30/24', 'Debit', '100.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)
      mockSessionStorage['useTransactionType'] = 'true'
      mockSessionStorage['columnMapping'] = JSON.stringify({
        date: '2',
        description: '1',
        amount: '4',
        transaction_type: '3',
        source_category: ''
      })

      render(<ImportStep2Page />)

      await waitFor(() => {
        const checkbox = screen.getByLabelText(/Consolidate amounts based on Transaction Type/) as HTMLInputElement
        expect(checkbox.checked).toBe(true)
      })
    })
  })

  describe('Conflict Prevention', () => {
    test('should disable reverse purchases checkbox when transaction type is enabled', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Purchase', '12/30/24', 'Debit', '100.00'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)
      mockSessionStorage['useTransactionType'] = 'true'
      mockSessionStorage['columnMapping'] = JSON.stringify({
        date: '2',
        description: '1',
        amount: '4',
        transaction_type: '3',
        source_category: ''
      })

      render(<ImportStep2Page />)

      await waitFor(() => {
        const reversePurchasesCheckbox = screen.getByLabelText(/Purchases are noted with positive amounts/) as HTMLInputElement
        expect(reversePurchasesCheckbox.disabled).toBe(true)
      })
    })

    test('should disable transaction type checkbox when debit/credit columns are mapped', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Debit', 'Credit', 'Transaction Type'],
        ['5706', 'Purchase', '12/30/24', '100.00', '', 'Debit'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)
      mockSessionStorage['columnMapping'] = JSON.stringify({
        date: '2',
        description: '1',
        amount: '',
        debit: '3',
        credit: '4',
        transaction_type: '5',
        source_category: ''
      })

      render(<ImportStep2Page />)

      await waitFor(() => {
        const transactionTypeCheckbox = screen.getByLabelText(/Consolidate amounts based on Transaction Type/) as HTMLInputElement
        expect(transactionTypeCheckbox.disabled).toBe(true)
      })
    })
  })

  describe('Number Formatting', () => {
    test('should format amounts with thousand separators', async () => {
      const csvData = [
        ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
        ['5706', 'Purchase', '12/30/24', 'Debit', '1427.36'],
        ['5706', 'Deposit', '12/29/24', 'Credit', '10000.50'],
      ]

      mockSessionStorage['csvData'] = JSON.stringify(csvData)
      mockSessionStorage['columnMapping'] = JSON.stringify({
        date: '2',
        description: '1',
        amount: '4',
        transaction_type: '3',
        source_category: ''
      })
      mockSessionStorage['useTransactionType'] = 'true'
      mockSessionStorage['selectedSourceId'] = '1'

      render(<ImportStep2Page />)

      await waitFor(() => {
        // Should display with commas
        expect(screen.getByText('$1,427.36')).toBeInTheDocument()
        expect(screen.getByText('$10,000.50')).toBeInTheDocument()
      })
    })
  })
})
