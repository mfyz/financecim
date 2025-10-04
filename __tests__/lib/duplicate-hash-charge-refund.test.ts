/**
 * Unit tests for duplicate hash generation - Charge vs Refund scenarios
 *
 * This test suite verifies that the duplicate detection logic correctly
 * differentiates between charges and refunds with the same amount.
 *
 * Bug context: Previously, transactions with same date, description, and amount
 * but opposite signs (charge vs refund) were incorrectly flagged as duplicates.
 *
 * Expected behavior:
 * - Charge (debit): same date, description, amount=-100 → unique hash
 * - Refund (credit): same date, description, amount=+100 → different unique hash
 */

import CryptoJS from 'crypto-js'

describe('Duplicate Hash Generation - Charge vs Refund', () => {
  /**
   * Helper function to generate transaction hash (client-side logic from step3)
   * This mirrors the generateRowHash function in app/import/step3/page.tsx
   */
  const generateRowHash = (
    row: string[],
    columnMapping: { date: string; description: string; amount?: string; debit?: string; credit?: string },
    sourceId: number
  ): string => {
    const date = row[parseInt(columnMapping.date)] || ''
    const description = row[parseInt(columnMapping.description)] || ''

    // Read amount from correct column based on mapping mode
    let amountStr = ''
    if (columnMapping.debit && columnMapping.credit) {
      // In debit/credit mode, the consolidated amount is placed in the debit column
      amountStr = row[parseInt(columnMapping.debit)] || ''
    } else {
      // In regular mode, read from amount column
      amountStr = row[parseInt(columnMapping.amount!)] || ''
    }

    const amount = parseFloat(amountStr)

    if (isNaN(amount)) {
      return CryptoJS.SHA256(`${sourceId}|${date}|${description}|0.00`).toString().substring(0, 16)
    }

    const data = `${sourceId}|${date}|${description}|${amount.toFixed(2)}`
    return CryptoJS.SHA256(data).toString().substring(0, 16)
  }

  /**
   * Helper to get amount from row (mirrors getAmountFromRow in step3)
   */
  const getAmountFromRow = (
    row: string[],
    columnMapping: { debit?: string; credit?: string; amount?: string },
    reversePurchases: boolean = false
  ): string => {
    let amount = ''

    if (columnMapping.debit && columnMapping.credit) {
      const debitValue = row[parseInt(columnMapping.debit)] || ''
      const creditValue = row[parseInt(columnMapping.credit)] || ''

      if (debitValue && debitValue.trim()) {
        const numDebit = parseFloat(debitValue)
        if (!isNaN(numDebit)) {
          amount = (-numDebit).toString()
        }
      } else if (creditValue && creditValue.trim()) {
        const numCredit = parseFloat(creditValue)
        if (!isNaN(numCredit)) {
          amount = numCredit.toString()
        }
      }
    } else {
      amount = row[parseInt(columnMapping.amount!)] || ''
      if (reversePurchases && amount) {
        const numAmount = parseFloat(amount)
        if (!isNaN(numAmount)) {
          amount = (-numAmount).toString()
        }
      }
    }

    return amount
  }

  describe('Debit/Credit Mode - Charge vs Refund', () => {
    it('should generate different hashes for charge and refund of same amount', () => {
      const sourceId = 1
      const columnMapping = {
        date: '0',
        description: '1',
        debit: '2',
        credit: '3'
      }

      // Charge: Debit column has 100.00, Credit is empty
      const chargeRow = ['2024-12-15', 'AMAZON.COM', '100.00', '']
      const chargeAmount = getAmountFromRow(chargeRow, columnMapping)
      expect(chargeAmount).toBe('-100') // Debit is negative

      // Create modified row for hash generation (put amount in debit column)
      const chargeModifiedRow = [...chargeRow]
      chargeModifiedRow[parseInt(columnMapping.debit)] = chargeAmount
      const chargeHash = generateRowHash(chargeModifiedRow, columnMapping, sourceId)

      // Refund: Credit column has 100.00, Debit is empty
      const refundRow = ['2024-12-15', 'AMAZON.COM', '', '100.00']
      const refundAmount = getAmountFromRow(refundRow, columnMapping)
      expect(refundAmount).toBe('100') // Credit is positive

      // Create modified row for hash generation (put amount in debit column)
      const refundModifiedRow = [...refundRow]
      refundModifiedRow[parseInt(columnMapping.debit)] = refundAmount
      const refundHash = generateRowHash(refundModifiedRow, columnMapping, sourceId)

      // The hashes MUST be different
      expect(chargeHash).not.toBe(refundHash)

      // Verify the hash data includes the sign
      const chargeData = `${sourceId}|2024-12-15|AMAZON.COM|-100.00`
      const refundData = `${sourceId}|2024-12-15|AMAZON.COM|100.00`

      const expectedChargeHash = CryptoJS.SHA256(chargeData).toString().substring(0, 16)
      const expectedRefundHash = CryptoJS.SHA256(refundData).toString().substring(0, 16)

      expect(chargeHash).toBe(expectedChargeHash)
      expect(refundHash).toBe(expectedRefundHash)
    })

    it('should generate different hashes for multiple charge/refund pairs', () => {
      const sourceId = 1
      const columnMapping = {
        date: '0',
        description: '1',
        debit: '2',
        credit: '3'
      }

      const testCases = [
        { amount: 50.00, description: 'STARBUCKS' },
        { amount: 199.99, description: 'BEST BUY' },
        { amount: 1500.50, description: 'RENT PAYMENT' }
      ]

      testCases.forEach(({ amount, description }) => {
        // Charge
        const chargeRow = ['2024-12-15', description, amount.toFixed(2), '']
        const chargeAmount = getAmountFromRow(chargeRow, columnMapping)
        const chargeModifiedRow = [...chargeRow]
        chargeModifiedRow[parseInt(columnMapping.debit)] = chargeAmount
        const chargeHash = generateRowHash(chargeModifiedRow, columnMapping, sourceId)

        // Refund
        const refundRow = ['2024-12-15', description, '', amount.toFixed(2)]
        const refundAmount = getAmountFromRow(refundRow, columnMapping)
        const refundModifiedRow = [...refundRow]
        refundModifiedRow[parseInt(columnMapping.debit)] = refundAmount
        const refundHash = generateRowHash(refundModifiedRow, columnMapping, sourceId)

        // Verify they're different
        expect(chargeHash).not.toBe(refundHash)
        expect(chargeAmount).toBe(`-${amount}`)
        expect(refundAmount).toBe(amount.toString())
      })
    })

    it('should generate same hash for identical charges', () => {
      const sourceId = 1
      const columnMapping = {
        date: '0',
        description: '1',
        debit: '2',
        credit: '3'
      }

      // Two identical charge transactions
      const charge1 = ['2024-12-15', 'AMAZON.COM', '100.00', '']
      const charge2 = ['2024-12-15', 'AMAZON.COM', '100.00', '']

      const amount1 = getAmountFromRow(charge1, columnMapping)
      const modifiedRow1 = [...charge1]
      modifiedRow1[parseInt(columnMapping.debit)] = amount1
      const hash1 = generateRowHash(modifiedRow1, columnMapping, sourceId)

      const amount2 = getAmountFromRow(charge2, columnMapping)
      const modifiedRow2 = [...charge2]
      modifiedRow2[parseInt(columnMapping.debit)] = amount2
      const hash2 = generateRowHash(modifiedRow2, columnMapping, sourceId)

      // Should be the same (true duplicates)
      expect(hash1).toBe(hash2)
    })

    it('should generate same hash for identical refunds', () => {
      const sourceId = 1
      const columnMapping = {
        date: '0',
        description: '1',
        debit: '2',
        credit: '3'
      }

      // Two identical refund transactions
      const refund1 = ['2024-12-15', 'AMAZON.COM', '', '100.00']
      const refund2 = ['2024-12-15', 'AMAZON.COM', '', '100.00']

      const amount1 = getAmountFromRow(refund1, columnMapping)
      const modifiedRow1 = [...refund1]
      modifiedRow1[parseInt(columnMapping.debit)] = amount1
      const hash1 = generateRowHash(modifiedRow1, columnMapping, sourceId)

      const amount2 = getAmountFromRow(refund2, columnMapping)
      const modifiedRow2 = [...refund2]
      modifiedRow2[parseInt(columnMapping.debit)] = amount2
      const hash2 = generateRowHash(modifiedRow2, columnMapping, sourceId)

      // Should be the same (true duplicates)
      expect(hash1).toBe(hash2)
    })
  })

  describe('Regular Amount Mode - Positive vs Negative', () => {
    it('should generate different hashes for positive and negative amounts', () => {
      const sourceId = 1
      const columnMapping = {
        date: '0',
        description: '1',
        amount: '2'
      }

      // Positive amount
      const positiveRow = ['2024-12-15', 'AMAZON.COM', '100.00']
      const positiveHash = generateRowHash(positiveRow, columnMapping, sourceId)

      // Negative amount
      const negativeRow = ['2024-12-15', 'AMAZON.COM', '-100.00']
      const negativeHash = generateRowHash(negativeRow, columnMapping, sourceId)

      // The hashes MUST be different
      expect(positiveHash).not.toBe(negativeHash)
    })

    it('should preserve sign in hash data', () => {
      const sourceId = 1
      const columnMapping = {
        date: '0',
        description: '1',
        amount: '2'
      }

      const testCases = [
        { amount: '100.00', expected: '100.00' },
        { amount: '-100.00', expected: '-100.00' },
        { amount: '50.50', expected: '50.50' },
        { amount: '-50.50', expected: '-50.50' }
      ]

      testCases.forEach(({ amount, expected }) => {
        const row = ['2024-12-15', 'TEST', amount]
        const hash = generateRowHash(row, columnMapping, sourceId)

        const expectedData = `${sourceId}|2024-12-15|TEST|${expected}`
        const expectedHash = CryptoJS.SHA256(expectedData).toString().substring(0, 16)

        expect(hash).toBe(expectedHash)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero amounts in debit/credit mode', () => {
      const sourceId = 1
      const columnMapping = {
        date: '0',
        description: '1',
        debit: '2',
        credit: '3'
      }

      const zeroDebit = ['2024-12-15', 'TEST', '0.00', '']
      const zeroCredit = ['2024-12-15', 'TEST', '', '0.00']

      const debitAmount = getAmountFromRow(zeroDebit, columnMapping)
      const modifiedDebit = [...zeroDebit]
      modifiedDebit[parseInt(columnMapping.debit)] = debitAmount
      const debitHash = generateRowHash(modifiedDebit, columnMapping, sourceId)

      const creditAmount = getAmountFromRow(zeroCredit, columnMapping)
      const modifiedCredit = [...zeroCredit]
      modifiedCredit[parseInt(columnMapping.debit)] = creditAmount
      const creditHash = generateRowHash(modifiedCredit, columnMapping, sourceId)

      // Both should generate same hash for zero amount
      expect(debitAmount).toBe('0')
      expect(creditAmount).toBe('0')
      expect(debitHash).toBe(creditHash)
    })

    it('should handle decimal precision correctly', () => {
      const sourceId = 1
      const columnMapping = {
        date: '0',
        description: '1',
        debit: '2',
        credit: '3'
      }

      // Charge with decimal
      const charge = ['2024-12-15', 'TEST', '100.99', '']
      const chargeAmount = getAmountFromRow(charge, columnMapping)
      const modifiedCharge = [...charge]
      modifiedCharge[parseInt(columnMapping.debit)] = chargeAmount
      const chargeHash = generateRowHash(modifiedCharge, columnMapping, sourceId)

      // Refund with same decimal
      const refund = ['2024-12-15', 'TEST', '', '100.99']
      const refundAmount = getAmountFromRow(refund, columnMapping)
      const modifiedRefund = [...refund]
      modifiedRefund[parseInt(columnMapping.debit)] = refundAmount
      const refundHash = generateRowHash(modifiedRefund, columnMapping, sourceId)

      expect(chargeAmount).toBe('-100.99')
      expect(refundAmount).toBe('100.99')
      expect(chargeHash).not.toBe(refundHash)
    })
  })
})
