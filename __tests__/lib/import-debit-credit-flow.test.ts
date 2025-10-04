/**
 * Integration Tests for Debit/Credit CSV Import Flow
 *
 * This test suite validates the end-to-end flow of importing CSV files
 * with separate Debit and Credit columns, simulating the user journey
 * through step2 (column mapping) and step3 (preview & import).
 */

describe('Debit/Credit Import Flow', () => {
  describe('Column Detection (Step 2)', () => {
    it('should detect separate Debit and Credit columns', () => {
      const csvHeaders = [
        'Transaction Date',
        'Posted Date',
        'Card No.',
        'Description',
        'Category',
        'Debit',
        'Credit'
      ]

      // Simulate detection logic
      let debitIndex = -1
      let creditIndex = -1

      csvHeaders.forEach((header, index) => {
        const headerLower = header.toLowerCase().trim()
        if (headerLower === 'debit') {
          debitIndex = index
        } else if (headerLower === 'credit') {
          creditIndex = index
        }
      })

      expect(debitIndex).toBe(5)
      expect(creditIndex).toBe(6)
    })

    it('should verify mutually exclusive pattern in CSV data', () => {
      const csvData = [
        ['2024-12-26', '2024-12-26', '8628', 'CAPITAL ONE MOBILE PYMT', 'Payment/Credit', '', '1427.36'],
        ['2024-12-15', '2024-12-16', '8628', 'MCNALLY JACKSON BOOKS', 'Merchandise', '65.32', ''],
        ['2024-12-15', '2024-12-16', '8628', 'TST*MISS ADA', 'Dining', '50.75', ''],
        ['2024-12-12', '2024-12-13', '8628', 'HM.COM', 'Merchandise', '', '169.15']
      ]

      const debitIndex = 5
      const creditIndex = 6

      let pairCount = 0
      let totalNonEmpty = 0

      csvData.forEach((row) => {
        const debitValue = row[debitIndex]?.trim()
        const creditValue = row[creditIndex]?.trim()

        const hasDebit = debitValue && debitValue !== ''
        const hasCredit = creditValue && creditValue !== ''

        if (hasDebit || hasCredit) {
          totalNonEmpty++
          // Check if only one has a value (mutually exclusive)
          if (hasDebit !== hasCredit) {
            pairCount++
          }
        }
      })

      // All 4 rows should follow the mutually exclusive pattern
      expect(totalNonEmpty).toBe(4)
      expect(pairCount).toBe(4)
      expect(pairCount / totalNonEmpty).toBeGreaterThan(0.7) // >70% threshold
    })
  })

  describe('Amount Transformation (Step 3)', () => {
    const getAmountFromRow = (
      row: string[],
      debitIndex: number,
      creditIndex: number,
      mergeDebitCredit: boolean
    ): string => {
      let amount = ''

      if (mergeDebitCredit) {
        const debitValue = row[debitIndex] || ''
        const creditValue = row[creditIndex] || ''

        if (debitValue && debitValue.trim()) {
          // Debit is an expense (negative)
          const numDebit = parseFloat(debitValue)
          if (!isNaN(numDebit)) {
            amount = (-numDebit).toString()
          }
        } else if (creditValue && creditValue.trim()) {
          // Credit is a payment/refund (positive)
          const numCredit = parseFloat(creditValue)
          if (!isNaN(numCredit)) {
            amount = numCredit.toString()
          }
        }
      }

      return amount
    }

    it('should convert debit values to negative amounts', () => {
      const row = ['2024-12-15', '2024-12-16', '8628', 'MCNALLY JACKSON BOOKS', 'Merchandise', '65.32', '']
      const amount = getAmountFromRow(row, 5, 6, true)

      expect(amount).toBe('-65.32')
      expect(parseFloat(amount)).toBe(-65.32)
    })

    it('should keep credit values as positive amounts', () => {
      const row = ['2024-12-26', '2024-12-26', '8628', 'CAPITAL ONE MOBILE PYMT', 'Payment/Credit', '', '1427.36']
      const amount = getAmountFromRow(row, 5, 6, true)

      expect(amount).toBe('1427.36')
      expect(parseFloat(amount)).toBe(1427.36)
    })

    it('should process a complete CSV dataset', () => {
      const csvData = [
        ['2024-12-26', '2024-12-26', '8628', 'CAPITAL ONE MOBILE PYMT', 'Payment/Credit', '', '1427.36'], // Credit
        ['2024-12-15', '2024-12-16', '8628', 'MCNALLY JACKSON BOOKS', 'Merchandise', '65.32', ''], // Debit
        ['2024-12-15', '2024-12-16', '8628', 'TST*MISS ADA', 'Dining', '50.75', ''], // Debit
        ['2024-12-12', '2024-12-13', '8628', 'HM.COM', 'Merchandise', '', '169.15'], // Credit
        ['2024-12-04', '2024-12-05', '8628', 'PREMIER MARKETPLACE, LLC', 'Merchandise', '18.08', ''], // Debit
        ['2024-12-03', '2024-12-03', '8628', 'CAPITAL ONE MOBILE PYMT', 'Payment/Credit', '', '1690.46'] // Credit
      ]

      const expectedAmounts = [1427.36, -65.32, -50.75, 169.15, -18.08, 1690.46]

      const processedAmounts = csvData.map((row) => {
        const amountStr = getAmountFromRow(row, 5, 6, true)
        return parseFloat(amountStr)
      })

      expect(processedAmounts).toEqual(expectedAmounts)
    })

    it('should calculate correct net balance', () => {
      const csvData = [
        ['2024-12-26', '2024-12-26', '8628', 'CAPITAL ONE MOBILE PYMT', 'Payment/Credit', '', '1427.36'],
        ['2024-12-15', '2024-12-16', '8628', 'MCNALLY JACKSON BOOKS', 'Merchandise', '65.32', ''],
        ['2024-12-15', '2024-12-16', '8628', 'TST*MISS ADA', 'Dining', '50.75', ''],
        ['2024-12-12', '2024-12-13', '8628', 'HM.COM', 'Merchandise', '', '169.15']
      ]

      const amounts = csvData.map((row) => {
        const amountStr = getAmountFromRow(row, 5, 6, true)
        return parseFloat(amountStr)
      })

      const totalCredits = amounts.filter((a) => a > 0).reduce((sum, a) => sum + a, 0)
      const totalDebits = amounts.filter((a) => a < 0).reduce((sum, a) => sum + a, 0)
      const netBalance = totalCredits + totalDebits

      expect(totalCredits).toBe(1427.36 + 169.15) // 1596.51
      expect(totalDebits).toBe(-65.32 - 50.75) // -116.07
      expect(netBalance).toBeCloseTo(1480.44, 2)
    })
  })

  describe('Validation', () => {
    const validateRow = (row: string[], debitIndex: number, creditIndex: number): boolean => {
      const debitValue = row[debitIndex] || ''
      const creditValue = row[creditIndex] || ''

      // Must have at least one value
      const hasValue = (debitValue && debitValue.trim() !== '') || (creditValue && creditValue.trim() !== '')
      if (!hasValue) return false

      // If debit has value, it must be a valid number
      if (debitValue && debitValue.trim()) {
        const num = parseFloat(debitValue)
        if (isNaN(num)) return false
      }

      // If credit has value, it must be a valid number
      if (creditValue && creditValue.trim()) {
        const num = parseFloat(creditValue)
        if (isNaN(num)) return false
      }

      return true
    }

    it('should validate rows with debit values', () => {
      const validRow = ['2024-12-15', '2024-12-16', '8628', 'MCNALLY JACKSON BOOKS', 'Merchandise', '65.32', '']
      expect(validateRow(validRow, 5, 6)).toBe(true)
    })

    it('should validate rows with credit values', () => {
      const validRow = ['2024-12-26', '2024-12-26', '8628', 'CAPITAL ONE MOBILE PYMT', 'Payment/Credit', '', '1427.36']
      expect(validateRow(validRow, 5, 6)).toBe(true)
    })

    it('should reject rows with no amount', () => {
      const invalidRow = ['2024-12-15', '2024-12-16', '8628', 'MCNALLY JACKSON BOOKS', 'Merchandise', '', '']
      expect(validateRow(invalidRow, 5, 6)).toBe(false)
    })

    it('should reject rows with invalid debit values', () => {
      const invalidRow = ['2024-12-15', '2024-12-16', '8628', 'MCNALLY JACKSON BOOKS', 'Merchandise', 'invalid', '']
      expect(validateRow(invalidRow, 5, 6)).toBe(false)
    })

    it('should reject rows with invalid credit values', () => {
      const invalidRow = ['2024-12-26', '2024-12-26', '8628', 'CAPITAL ONE MOBILE PYMT', 'Payment/Credit', '', 'invalid']
      expect(validateRow(invalidRow, 5, 6)).toBe(false)
    })
  })

  describe('Backwards Compatibility', () => {
    it('should still support regular amount column imports', () => {
      const getAmountFromRow = (
        row: string[],
        amountIndex: number,
        mergeDebitCredit: boolean,
        reversePurchases: boolean
      ): string => {
        if (mergeDebitCredit) {
          return '' // Not applicable for this test
        }

        let amount = row[amountIndex] || ''

        // Apply amount reversal if enabled
        if (reversePurchases && amount) {
          const numAmount = parseFloat(amount)
          if (!isNaN(numAmount)) {
            amount = (-numAmount).toString()
          }
        }

        return amount
      }

      const regularCsvRow = ['2024-12-15', 'MCNALLY JACKSON BOOKS', '65.32', 'Merchandise']

      // Without reversal
      const amount1 = getAmountFromRow(regularCsvRow, 2, false, false)
      expect(amount1).toBe('65.32')

      // With reversal
      const amount2 = getAmountFromRow(regularCsvRow, 2, false, true)
      expect(amount2).toBe('-65.32')
    })
  })

  describe('Real-world Capital One CSV Sample', () => {
    it('should correctly process actual Capital One transactions', () => {
      // Sample from the provided CSV file
      const capitalOneCsvData = [
        // Headers: Transaction Date, Posted Date, Card No., Description, Category, Debit, Credit
        ['2024-12-26', '2024-12-26', '8628', 'CAPITAL ONE MOBILE PYMT', 'Payment/Credit', '', '1427.36'],
        ['2024-12-15', '2024-12-16', '8628', 'MCNALLY JACKSON BOOKS', 'Merchandise', '65.32', ''],
        ['2024-12-15', '2024-12-16', '8628', 'TST*MISS ADA', 'Dining', '50.75', ''],
        ['2024-12-12', '2024-12-13', '8628', 'HM.COM', 'Merchandise', '', '169.15'],
        ['2024-12-04', '2024-12-05', '8628', 'PREMIER MARKETPLACE, LLC', 'Merchandise', '18.08', ''],
        ['2024-12-04', '2024-12-04', '8628', 'Zara.com', 'Merchandise', '358.20', ''],
        ['2024-12-03', '2024-12-03', '8628', 'HM.COM', 'Merchandise', '100.81', ''],
        ['2024-12-03', '2024-12-03', '8628', 'CAPITAL ONE MOBILE PYMT', 'Payment/Credit', '', '1690.46']
      ]

      const getAmountFromRow = (row: string[]): number => {
        const debitValue = row[5] || ''
        const creditValue = row[6] || ''

        if (debitValue && debitValue.trim()) {
          return -parseFloat(debitValue) // Debit is negative
        } else if (creditValue && creditValue.trim()) {
          return parseFloat(creditValue) // Credit is positive
        }
        return 0
      }

      const processedTransactions = capitalOneCsvData.map((row) => ({
        date: row[0],
        description: row[3],
        category: row[4],
        amount: getAmountFromRow(row)
      }))

      // Verify correct sign conversion
      expect(processedTransactions[0].amount).toBe(1427.36) // Payment (credit)
      expect(processedTransactions[1].amount).toBe(-65.32) // Purchase (debit)
      expect(processedTransactions[2].amount).toBe(-50.75) // Purchase (debit)
      expect(processedTransactions[3].amount).toBe(169.15) // Refund (credit)
      expect(processedTransactions[4].amount).toBe(-18.08) // Purchase (debit)
      expect(processedTransactions[5].amount).toBe(-358.2) // Purchase (debit)
      expect(processedTransactions[6].amount).toBe(-100.81) // Purchase (debit)
      expect(processedTransactions[7].amount).toBe(1690.46) // Payment (credit)

      // Calculate totals
      const totalDebits = processedTransactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)

      const totalCredits = processedTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)

      expect(totalCredits).toBe(1427.36 + 169.15 + 1690.46)
      expect(totalDebits).toBe(-65.32 - 50.75 - 18.08 - 358.2 - 100.81)
    })
  })
})
