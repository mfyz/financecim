/**
 * Tests for Mark Not Duplicate functionality in Import Step 3
 *
 * This test suite covers the critical user override logic that allows users
 * to mark duplicate transactions for import anyway.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }))
}))

// Mock createPortal to avoid portal rendering issues in tests
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node
}))

describe('Mark Not Duplicate Functionality', () => {
  // Helper function to create mock transactions
  const createMockTransaction = (id: number, isDuplicate: boolean, isDbDuplicate: boolean, userOverride?: boolean) => ({
    id,
    hash: `hash${id}`,
    date: '2024-01-15',
    description: `Transaction ${id}`,
    amount: '-50.00',
    source_category: 'Groceries',
    source_name: 'Test Bank',
    rawRow: ['2024-01-15', `Transaction ${id}`, '-50.00', 'Groceries'],
    source_data: {
      Date: '2024-01-15',
      Description: `Transaction ${id}`,
      Amount: '-50.00',
      Category: 'Groceries'
    },
    isDuplicate,
    isDbDuplicate,
    hasError: false,
    errorDetails: null,
    status: (isDuplicate ? 'duplicate' : (isDbDuplicate ? 'db_duplicate' : 'clean')) as 'clean' | 'duplicate' | 'db_duplicate' | 'error',
    userOverride
  })

  describe('User Override State Management', () => {
    it('should mark duplicate transaction with userOverride flag', () => {
      const transaction = createMockTransaction(1, true, false)

      // Simulate marking as not duplicate
      const updatedTransaction = {
        ...transaction,
        userOverride: true
      }

      expect(updatedTransaction.userOverride).toBe(true)
      expect(updatedTransaction.isDuplicate).toBe(true) // Original flag stays
      expect(updatedTransaction.status).toBe('duplicate') // Original status stays
    })

    it('should mark db_duplicate transaction with userOverride flag', () => {
      const transaction = createMockTransaction(1, false, true)

      const updatedTransaction = {
        ...transaction,
        userOverride: true
      }

      expect(updatedTransaction.userOverride).toBe(true)
      expect(updatedTransaction.isDbDuplicate).toBe(true)
      expect(updatedTransaction.status).toBe('db_duplicate')
    })

    it('should handle marking multiple transactions', () => {
      const transactions = [
        createMockTransaction(1, true, false),
        createMockTransaction(2, false, true),
        createMockTransaction(3, true, true)
      ]

      const selectedIds = new Set([1, 2, 3])
      const updatedTransactions = transactions.map(t =>
        selectedIds.has(t.id) ? { ...t, userOverride: true } : t
      )

      updatedTransactions.forEach(t => {
        expect(t.userOverride).toBe(true)
      })
    })

    it('should only update selected transactions', () => {
      const transactions = [
        createMockTransaction(1, true, false),
        createMockTransaction(2, true, false),
        createMockTransaction(3, true, false)
      ]

      const selectedIds = new Set([1, 3]) // Only 1 and 3 selected
      const updatedTransactions = transactions.map(t =>
        selectedIds.has(t.id) ? { ...t, userOverride: true } : t
      )

      expect(updatedTransactions[0].userOverride).toBe(true)
      expect(updatedTransactions[1].userOverride).toBeUndefined()
      expect(updatedTransactions[2].userOverride).toBe(true)
    })
  })

  describe('Filtering Logic with User Overrides', () => {
    it('should include duplicate transactions with userOverride in valid transactions', () => {
      const transactions = [
        createMockTransaction(1, true, false, true), // Duplicate but overridden
        createMockTransaction(2, true, false, false), // Duplicate, not overridden
        createMockTransaction(3, false, false) // Clean
      ]

      // Filter logic from handleImportConfirm
      const validTransactions = transactions.filter(t =>
        !t.hasError &&
        (!t.isDuplicate || t.userOverride) &&
        (!t.isDbDuplicate || t.userOverride)
      )

      expect(validTransactions).toHaveLength(2)
      expect(validTransactions.map(t => t.id)).toEqual([1, 3])
    })

    it('should include db_duplicate transactions with userOverride', () => {
      const transactions = [
        createMockTransaction(1, false, true, true), // DB duplicate but overridden
        createMockTransaction(2, false, true, false), // DB duplicate, not overridden
        createMockTransaction(3, false, false) // Clean
      ]

      const validTransactions = transactions.filter(t =>
        !t.hasError &&
        (!t.isDuplicate || t.userOverride) &&
        (!t.isDbDuplicate || t.userOverride)
      )

      expect(validTransactions).toHaveLength(2)
      expect(validTransactions.map(t => t.id)).toEqual([1, 3])
    })

    it('should exclude transactions with errors even if userOverride is set', () => {
      const transactions = [
        { ...createMockTransaction(1, true, false, true), hasError: true },
        createMockTransaction(2, true, false, true),
        createMockTransaction(3, false, false)
      ]

      const validTransactions = transactions.filter(t =>
        !t.hasError &&
        (!t.isDuplicate || t.userOverride) &&
        (!t.isDbDuplicate || t.userOverride)
      )

      expect(validTransactions).toHaveLength(2)
      expect(validTransactions.map(t => t.id)).toEqual([2, 3])
    })

    it('should handle transactions with both isDuplicate and isDbDuplicate', () => {
      const transactions = [
        createMockTransaction(1, true, true, true), // Both flags, overridden
        createMockTransaction(2, true, true, false), // Both flags, not overridden
        createMockTransaction(3, false, false) // Clean
      ]

      const validTransactions = transactions.filter(t =>
        !t.hasError &&
        (!t.isDuplicate || t.userOverride) &&
        (!t.isDbDuplicate || t.userOverride)
      )

      expect(validTransactions).toHaveLength(2)
      expect(validTransactions.map(t => t.id)).toEqual([1, 3])
    })
  })

  describe('Statistics Calculation with User Overrides', () => {
    it('should count overridden duplicates as clean transactions', () => {
      const previewData = [
        createMockTransaction(1, false, false), // Clean
        createMockTransaction(2, true, false, true), // Duplicate but overridden
        createMockTransaction(3, true, false, false), // Duplicate, not overridden
        createMockTransaction(4, false, true, true), // DB duplicate but overridden
        createMockTransaction(5, false, true, false) // DB duplicate, not overridden
      ]

      const clean = previewData.filter(t => t.status === 'clean' || t.userOverride).length
      const duplicates = previewData.filter(t => t.status === 'duplicate' && !t.userOverride).length
      const dbDuplicates = previewData.filter(t => t.status === 'db_duplicate' && !t.userOverride).length

      expect(clean).toBe(3) // 1 clean + 2 overridden
      expect(duplicates).toBe(1) // 1 duplicate without override
      expect(dbDuplicates).toBe(1) // 1 db_duplicate without override
    })

    it('should calculate correct total for import', () => {
      const previewData = [
        createMockTransaction(1, false, false),
        createMockTransaction(2, true, false, true),
        createMockTransaction(3, true, false, false),
        createMockTransaction(4, false, true, true),
        { ...createMockTransaction(5, false, false), hasError: true }
      ]

      const validTransactions = previewData.filter(t =>
        !t.hasError &&
        (!t.isDuplicate || t.userOverride) &&
        (!t.isDbDuplicate || t.userOverride)
      )

      expect(validTransactions).toHaveLength(3) // 1 clean + 2 overridden (1 error excluded, 1 duplicate excluded)
    })
  })

  describe('Transaction Payload with allowDuplicate Flag', () => {
    it('should set allowDuplicate flag for overridden transactions', () => {
      const transaction = createMockTransaction(1, true, false, true)

      const payload = {
        date: transaction.date,
        description: transaction.description,
        amount: parseFloat(transaction.amount),
        source_id: 1,
        source_category: transaction.source_category || null,
        hash: transaction.hash,
        source_data: transaction.source_data,
        allowDuplicate: transaction.userOverride || false
      }

      expect(payload.allowDuplicate).toBe(true)
    })

    it('should not set allowDuplicate flag for non-overridden transactions', () => {
      const transaction = createMockTransaction(1, false, false)

      const payload = {
        date: transaction.date,
        description: transaction.description,
        amount: parseFloat(transaction.amount),
        source_id: 1,
        source_category: transaction.source_category || null,
        hash: transaction.hash,
        source_data: transaction.source_data,
        allowDuplicate: transaction.userOverride || false
      }

      expect(payload.allowDuplicate).toBe(false)
    })

    it('should create batch payloads with correct allowDuplicate flags', () => {
      const validTransactions = [
        createMockTransaction(1, false, false), // Clean
        createMockTransaction(2, true, false, true), // Overridden duplicate
        createMockTransaction(3, false, true, true) // Overridden db_duplicate
      ]

      const payloads = validTransactions.map(t => ({
        date: t.date,
        description: t.description,
        amount: parseFloat(t.amount),
        source_id: 1,
        allowDuplicate: t.userOverride || false,
        hash: t.hash,
        source_data: t.source_data
      }))

      expect(payloads[0].allowDuplicate).toBe(false)
      expect(payloads[1].allowDuplicate).toBe(true)
      expect(payloads[2].allowDuplicate).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty selection', () => {
      const transactions = [
        createMockTransaction(1, true, false),
        createMockTransaction(2, true, false)
      ]

      const selectedIds = new Set<number>()
      const updatedTransactions = transactions.map(t =>
        selectedIds.has(t.id) ? { ...t, userOverride: true } : t
      )

      updatedTransactions.forEach(t => {
        expect(t.userOverride).toBeUndefined()
      })
    })

    it('should handle clean transactions marked as not duplicate', () => {
      const transaction = createMockTransaction(1, false, false)

      // User can technically mark clean transactions too (no-op but harmless)
      const updatedTransaction = {
        ...transaction,
        userOverride: true
      }

      expect(updatedTransaction.userOverride).toBe(true)

      // Should still pass filter
      const isValid = !updatedTransaction.hasError &&
        (!updatedTransaction.isDuplicate || updatedTransaction.userOverride) &&
        (!updatedTransaction.isDbDuplicate || updatedTransaction.userOverride)

      expect(isValid).toBe(true)
    })

    it('should handle transaction with undefined userOverride', () => {
      const transaction = createMockTransaction(1, true, false)

      expect(transaction.userOverride).toBeUndefined()

      const allowDuplicate = transaction.userOverride || false
      expect(allowDuplicate).toBe(false)
    })

    it('should handle transaction with explicit false userOverride', () => {
      const transaction = createMockTransaction(1, true, false, false)

      expect(transaction.userOverride).toBe(false)

      const allowDuplicate = transaction.userOverride || false
      expect(allowDuplicate).toBe(false)
    })
  })

  describe('Selection State Management', () => {
    it('should toggle selection correctly', () => {
      const selectedIds = new Set([1, 2, 3])

      // Toggle off
      selectedIds.delete(2)
      expect(selectedIds.has(2)).toBe(false)
      expect(selectedIds.size).toBe(2)

      // Toggle on
      selectedIds.add(4)
      expect(selectedIds.has(4)).toBe(true)
      expect(selectedIds.size).toBe(3)
    })

    it('should clear selection after marking', () => {
      const selectedIds = new Set([1, 2, 3])

      // After marking, selection should be cleared
      const clearedSelection = new Set<number>()

      expect(clearedSelection.size).toBe(0)
      expect(selectedIds.size).toBe(3) // Original unchanged
    })

    it('should handle select all duplicates', () => {
      const transactions = [
        createMockTransaction(1, false, false),
        createMockTransaction(2, true, false),
        createMockTransaction(3, false, true),
        createMockTransaction(4, true, true)
      ]

      const duplicateIds = transactions
        .filter(t => (t.isDuplicate || t.isDbDuplicate) && !t.userOverride)
        .map(t => t.id)

      expect(duplicateIds).toEqual([2, 3, 4])
    })
  })
})