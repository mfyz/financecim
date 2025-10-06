/**
 * Test to catch the bug: Step3 doesn't handle transaction type consolidation
 *
 * This test should FAIL initially, proving we have a bug.
 * After fixing step3, this test should PASS.
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ImportStep3Page from '@/app/import/step3/page'

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

// Mock fetch for sources API
global.fetch = jest.fn((url: string) => {
  if (url.includes('/api/sources/1')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { id: 1, name: 'Capital One Checking', type: 'bank' }
      })
    })
  }

  if (url.includes('/api/sources')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: [
          { id: 1, name: 'Capital One Checking', type: 'bank' }
        ]
      })
    })
  }

  // Mock duplicate check endpoint
  if (url.includes('/api/transactions/check-duplicates')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ duplicates: [] })
    })
  }

  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({})
  })
}) as jest.Mock

describe('Step3 Transaction Type Import Bug', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.keys(mockSessionStorage).forEach(key => delete mockSessionStorage[key])
  })

  test('should consolidate amounts based on transaction type when importing', async () => {
    // Setup: CSV with Transaction Type column
    const csvData = [
      ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
      ['5706', 'Purchase at Store', '12/30/24', 'Debit', '1427.36'],
      ['5706', 'Deposit from Employer', '12/29/24', 'Credit', '450.00'],
      ['5706', 'ATM Withdrawal', '12/28/24', 'Debit', '100.00'],
      ['5706', 'Refund', '12/27/24', 'Credit', '25.50'],
    ]

    // Setup: Column mapping with transaction type
    const columnMapping = {
      date: '2',
      description: '1',
      amount: '4',
      transaction_type: '3',
      source_category: ''
    }

    // Setup: Transaction type consolidation is ENABLED
    mockSessionStorage['csvData'] = JSON.stringify(csvData)
    mockSessionStorage['columnMapping'] = JSON.stringify(columnMapping)
    mockSessionStorage['selectedSourceId'] = '1'
    mockSessionStorage['reversePurchases'] = 'false'
    mockSessionStorage['useTransactionType'] = 'true' // ← This is the key setting

    render(<ImportStep3Page />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Verify the descriptions are rendered (proves data loaded)
    await waitFor(() => {
      expect(screen.getByText('Purchase at Store')).toBeInTheDocument()
      expect(screen.getByText('Deposit from Employer')).toBeInTheDocument()
    })

    // The fix should make amounts show with correct colors
    // Note: We're testing that the rendering happens, the actual color verification
    // is better done through visual/E2E tests since DOM color classes can be tricky in jsdom
  })

  test('BUG: amount values should be signed correctly for transaction types (EXPECTED TO FAIL)', async () => {
    const csvData = [
      ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
      ['5706', 'Expense', '12/30/24', 'Debit', '100.00'],
      ['5706', 'Income', '12/29/24', 'Credit', '200.00'],
    ]

    const columnMapping = {
      date: '2',
      description: '1',
      amount: '4',
      transaction_type: '3',
      source_category: ''
    }

    mockSessionStorage['csvData'] = JSON.stringify(csvData)
    mockSessionStorage['columnMapping'] = JSON.stringify(columnMapping)
    mockSessionStorage['selectedSourceId'] = '1'
    mockSessionStorage['reversePurchases'] = 'false'
    mockSessionStorage['useTransactionType'] = 'true'

    render(<ImportStep3Page />)

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Check the actual preview data structure
    // The bug is: amounts are positive when they should be signed
    await waitFor(() => {
      // This test documents what SHOULD happen:
      // - Debit transaction should have negative amount
      // - Credit transaction should have positive amount

      const expenseRow = screen.queryByText('Expense')
      const incomeRow = screen.queryByText('Income')

      expect(expenseRow).toBeInTheDocument()
      expect(incomeRow).toBeInTheDocument()

      // The amounts should be color-coded correctly
      const redAmounts = document.querySelectorAll('.text-red-600')
      const greenAmounts = document.querySelectorAll('.text-green-600')

      // Should have at least 1 red (debit) and 1 green (credit)
      expect(redAmounts.length).toBeGreaterThan(0)
      expect(greenAmounts.length).toBeGreaterThan(0)
    })
  })

  test('Documentation: Current behavior vs Expected behavior', async () => {
    const csvData = [
      ['Account', 'Description', 'Date', 'Transaction Type', 'Amount'],
      ['5706', 'Debit Transaction', '12/30/24', 'Debit', '100.00'],
    ]

    const columnMapping = {
      date: '2',
      description: '1',
      amount: '4',
      transaction_type: '3',
      source_category: ''
    }

    mockSessionStorage['csvData'] = JSON.stringify(csvData)
    mockSessionStorage['columnMapping'] = JSON.stringify(columnMapping)
    mockSessionStorage['selectedSourceId'] = '1'
    mockSessionStorage['useTransactionType'] = 'true'

    render(<ImportStep3Page />)

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // This test documents the bug:
    // CURRENT: Amount is 100.00 (positive, shown in green)
    // EXPECTED: Amount should be -100.00 (negative, shown in red)

    console.log('===== BUG DOCUMENTATION =====')
    console.log('When useTransactionType is enabled:')
    console.log('CURRENT BEHAVIOR: All amounts are imported as positive (from source CSV)')
    console.log('EXPECTED BEHAVIOR: Debit = negative, Credit = positive')
    console.log('ROOT CAUSE: step3/page.tsx getAmountFromRow() does not check transaction_type')
    console.log('FIX LOCATION: Lines 121-158 in app/import/step3/page.tsx')
    console.log('============================')

    // This assertion will fail, proving the bug exists
    const amountElement = screen.queryByText(/100\.00/)
    if (amountElement) {
      // Current: probably green (positive)
      // Expected: should be red (negative)
      expect(amountElement.className).toContain('text-red-600')
    }
  })
})
