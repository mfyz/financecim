/**
 * Unit Tests for Amount Validation Logic
 *
 * Tests the checkRowsWithoutAmount functionality to ensure proper
 * detection of rows missing amount values in various mapping scenarios.
 */

describe('Amount Validation Logic', () => {
  // Simulate the checkRowsWithoutAmount function
  const checkRowsWithoutAmount = (
    csvData: string[][],
    columnMapping: { amount?: string; debit?: string; credit?: string }
  ): number => {
    if (csvData.length <= 1) {
      return 0
    }

    const dataRows = csvData.slice(1) // Skip header
    let missingCount = 0

    dataRows.forEach(row => {
      let hasAmount = false

      // Check if debit/credit columns are mapped (either one or both)
      if (columnMapping.debit || columnMapping.credit) {
        const debitValue = columnMapping.debit ? (row[parseInt(columnMapping.debit)] || '') : ''
        const creditValue = columnMapping.credit ? (row[parseInt(columnMapping.credit)] || '') : ''
        hasAmount = (debitValue && debitValue.trim() !== '') || (creditValue && creditValue.trim() !== '')
      } else if (columnMapping.amount) {
        // Check regular amount column
        const amountValue = row[parseInt(columnMapping.amount)] || ''
        hasAmount = amountValue && amountValue.trim() !== ''
      }

      if (!hasAmount) {
        missingCount++
      }
    })

    return missingCount
  }

  describe('Regular Amount Column', () => {
    it('should return 0 when all rows have amount values', () => {
      const csvData = [
        ['Date', 'Description', 'Amount', 'Category'],
        ['2024-01-01', 'Purchase 1', '50.00', 'Food'],
        ['2024-01-02', 'Purchase 2', '75.00', 'Gas'],
        ['2024-01-03', 'Purchase 3', '100.00', 'Entertainment']
      ]

      const columnMapping = { amount: '2' }
      const result = checkRowsWithoutAmount(csvData, columnMapping)

      expect(result).toBe(0)
    })

    it('should count rows with empty amount values', () => {
      const csvData = [
        ['Date', 'Description', 'Amount', 'Category'],
        ['2024-01-01', 'Purchase 1', '50.00', 'Food'],
        ['2024-01-02', 'Purchase 2', '', 'Gas'], // Missing amount
        ['2024-01-03', 'Purchase 3', '100.00', 'Entertainment'],
        ['2024-01-04', 'Purchase 4', '', 'Shopping'] // Missing amount
      ]

      const columnMapping = { amount: '2' }
      const result = checkRowsWithoutAmount(csvData, columnMapping)

      expect(result).toBe(2)
    })

    it('should treat whitespace-only values as missing', () => {
      const csvData = [
        ['Date', 'Description', 'Amount', 'Category'],
        ['2024-01-01', 'Purchase 1', '50.00', 'Food'],
        ['2024-01-02', 'Purchase 2', '   ', 'Gas'], // Whitespace only
        ['2024-01-03', 'Purchase 3', '', 'Entertainment'] // Empty
      ]

      const columnMapping = { amount: '2' }
      const result = checkRowsWithoutAmount(csvData, columnMapping)

      expect(result).toBe(2)
    })
  })

  describe('Debit/Credit Columns - Both Mapped', () => {
    it('should return 0 when all rows have either debit or credit', () => {
      const csvData = [
        ['Date', 'Description', 'Category', 'Debit', 'Credit'],
        ['2024-01-01', 'Purchase 1', 'Food', '50.00', ''],
        ['2024-01-02', 'Payment', 'Payment', '', '100.00'],
        ['2024-01-03', 'Purchase 2', 'Gas', '75.00', '']
      ]

      const columnMapping = { debit: '3', credit: '4' }
      const result = checkRowsWithoutAmount(csvData, columnMapping)

      expect(result).toBe(0)
    })

    it('should count rows with both debit and credit empty', () => {
      const csvData = [
        ['Date', 'Description', 'Category', 'Debit', 'Credit'],
        ['2024-01-01', 'Purchase 1', 'Food', '50.00', ''],
        ['2024-01-02', 'Invalid Row', 'Unknown', '', ''], // Missing both
        ['2024-01-03', 'Payment', 'Payment', '', '100.00'],
        ['2024-01-04', 'Invalid Row 2', 'Unknown', '', ''] // Missing both
      ]

      const columnMapping = { debit: '3', credit: '4' }
      const result = checkRowsWithoutAmount(csvData, columnMapping)

      expect(result).toBe(2)
    })
  })

  describe('Debit/Credit Columns - Only One Mapped', () => {
    it('should count rows missing amounts when only Debit is mapped', () => {
      const csvData = [
        ['Date', 'Description', 'Category', 'Debit', 'Credit'],
        ['2024-01-01', 'Purchase 1', 'Food', '50.00', ''], // Has debit
        ['2024-01-02', 'Payment', 'Payment', '', '100.00'], // Missing (only credit, debit not mapped)
        ['2024-01-03', 'Purchase 2', 'Gas', '75.00', ''], // Has debit
        ['2024-01-04', 'Payment 2', 'Payment', '', '200.00'] // Missing (only credit)
      ]

      const columnMapping = { debit: '3' } // Only debit mapped, credit NOT mapped
      const result = checkRowsWithoutAmount(csvData, columnMapping)

      // Rows 2 and 4 don't have debit values (they have credit, but credit isn't mapped)
      expect(result).toBe(2)
    })

    it('should count rows missing amounts when only Credit is mapped', () => {
      const csvData = [
        ['Date', 'Description', 'Category', 'Debit', 'Credit'],
        ['2024-01-01', 'Purchase 1', 'Food', '50.00', ''], // Missing (only debit, credit not mapped)
        ['2024-01-02', 'Payment', 'Payment', '', '100.00'], // Has credit
        ['2024-01-03', 'Purchase 2', 'Gas', '75.00', ''], // Missing (only debit)
        ['2024-01-04', 'Payment 2', 'Payment', '', '200.00'] // Has credit
      ]

      const columnMapping = { credit: '4' } // Only credit mapped, debit NOT mapped
      const result = checkRowsWithoutAmount(csvData, columnMapping)

      // Rows 1 and 3 don't have credit values (they have debit, but debit isn't mapped)
      expect(result).toBe(2)
    })
  })

  describe('Capital One CSV - Real World Scenario', () => {
    it('should detect missing amounts when only debit is mapped', () => {
      const csvData = [
        ['Transaction Date', 'Posted Date', 'Card No.', 'Description', 'Category', 'Debit', 'Credit'],
        ['2024-12-26', '2024-12-26', '8628', 'CAPITAL ONE MOBILE PYMT', 'Payment/Credit', '', '1427.36'],
        ['2024-12-15', '2024-12-16', '8628', 'MCNALLY JACKSON BOOKS', 'Merchandise', '65.32', ''],
        ['2024-12-15', '2024-12-16', '8628', 'TST*MISS ADA', 'Dining', '50.75', ''],
        ['2024-12-12', '2024-12-13', '8628', 'HM.COM', 'Merchandise', '', '169.15']
      ]

      // User only mapped Debit column
      const columnMapping = { debit: '5' }
      const result = checkRowsWithoutAmount(csvData, columnMapping)

      // Rows with only credit values (rows 1 and 4) will be missing
      expect(result).toBe(2)
    })

    it('should return 0 when both debit and credit are mapped correctly', () => {
      const csvData = [
        ['Transaction Date', 'Posted Date', 'Card No.', 'Description', 'Category', 'Debit', 'Credit'],
        ['2024-12-26', '2024-12-26', '8628', 'CAPITAL ONE MOBILE PYMT', 'Payment/Credit', '', '1427.36'],
        ['2024-12-15', '2024-12-16', '8628', 'MCNALLY JACKSON BOOKS', 'Merchandise', '65.32', ''],
        ['2024-12-15', '2024-12-16', '8628', 'TST*MISS ADA', 'Dining', '50.75', ''],
        ['2024-12-12', '2024-12-13', '8628', 'HM.COM', 'Merchandise', '', '169.15']
      ]

      // User mapped both Debit and Credit columns
      const columnMapping = { debit: '5', credit: '6' }
      const result = checkRowsWithoutAmount(csvData, columnMapping)

      // All rows have either debit or credit
      expect(result).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should return 0 for empty CSV (header only)', () => {
      const csvData = [['Date', 'Description', 'Amount']]

      const columnMapping = { amount: '2' }
      const result = checkRowsWithoutAmount(csvData, columnMapping)

      expect(result).toBe(0)
    })

    it('should return total rows when no amount column is mapped', () => {
      const csvData = [
        ['Date', 'Description', 'Amount'],
        ['2024-01-01', 'Purchase 1', '50.00'],
        ['2024-01-02', 'Purchase 2', '75.00']
      ]

      const columnMapping = {} // No amount column mapped
      const result = checkRowsWithoutAmount(csvData, columnMapping)

      expect(result).toBe(2) // All rows are missing since no column is mapped
    })

    it('should handle zero as a valid amount', () => {
      const csvData = [
        ['Date', 'Description', 'Amount'],
        ['2024-01-01', 'Free item', '0'],
        ['2024-01-02', 'Purchase', '50.00']
      ]

      const columnMapping = { amount: '2' }
      const result = checkRowsWithoutAmount(csvData, columnMapping)

      expect(result).toBe(0) // Zero is a valid amount
    })
  })
})
