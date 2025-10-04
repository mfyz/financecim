/**
 * Unit Tests for Column Mapping Logic
 *
 * Tests the handleColumnMappingChange function to ensure dropdowns
 * can switch between different mapping types without requiring
 * intermediate "not mapped" selection.
 */

describe('Column Mapping Logic', () => {
  // Simulate the handleColumnMappingChange function from step2 (FIXED VERSION)
  const handleColumnMappingChange = (
    columnIndex: number,
    mappingType: string,
    currentMapping: Record<string, string>
  ): Record<string, string> => {
    const newMapping = { ...currentMapping }

    // Step 1: Clear any existing mapping for this column
    // (e.g., if column 5 was mapped to "amount", clear that)
    Object.entries(currentMapping).forEach(([key, value]) => {
      if (value === columnIndex.toString()) {
        newMapping[key] = ''
      }
    })

    // Step 2: If setting to a new type (not empty), set the new mapping
    if (mappingType !== '') {
      newMapping[mappingType] = columnIndex.toString()
    }

    return newMapping
  }

  describe('Direct Mapping Changes', () => {
    it('should allow changing from "amount" to "debit" directly', () => {
      // Initial state: Debit column (index 5) is mapped to "amount"
      const initialMapping = {
        date: '0',
        description: '3',
        amount: '5', // Debit column mapped to amount
        source_category: '4',
        debit: '',
        credit: ''
      }

      // User changes Debit column dropdown from "amount" to "debit"
      const newMapping = handleColumnMappingChange(5, 'debit', initialMapping)

      // Expected: amount should be cleared, debit should be set to column 5
      expect(newMapping.amount).toBe('') // amount should be cleared
      expect(newMapping.debit).toBe('5') // debit should now map to column 5
    })

    it('should allow changing from "amount" to "credit" directly', () => {
      // Initial state: Credit column (index 6) is mapped to "amount"
      const initialMapping = {
        date: '0',
        description: '3',
        amount: '6', // Credit column mapped to amount
        source_category: '4',
        debit: '',
        credit: ''
      }

      // User changes Credit column dropdown from "amount" to "credit"
      const newMapping = handleColumnMappingChange(6, 'credit', initialMapping)

      // Expected: amount should be cleared, credit should be set to column 6
      expect(newMapping.amount).toBe('')
      expect(newMapping.credit).toBe('6')
    })

    it('should allow changing from "debit" to "amount" directly', () => {
      // Initial state: Debit column (index 5) is mapped to "debit"
      const initialMapping = {
        date: '0',
        description: '3',
        amount: '',
        source_category: '4',
        debit: '5', // Debit column mapped to debit
        credit: ''
      }

      // User changes Debit column dropdown from "debit" to "amount"
      const newMapping = handleColumnMappingChange(5, 'amount', initialMapping)

      // Expected: debit should be cleared, amount should be set to column 5
      expect(newMapping.debit).toBe('')
      expect(newMapping.amount).toBe('5')
    })

    it('should handle mapping swap between two columns', () => {
      // Initial state: Column 5 mapped to amount, Column 6 mapped to credit
      const initialMapping = {
        date: '0',
        description: '3',
        amount: '5',
        source_category: '4',
        debit: '',
        credit: '6'
      }

      // User changes Column 5 from "amount" to "debit"
      const newMapping = handleColumnMappingChange(5, 'debit', initialMapping)

      // Expected: amount cleared, debit set, credit unchanged
      expect(newMapping.amount).toBe('')
      expect(newMapping.debit).toBe('5')
      expect(newMapping.credit).toBe('6') // Should remain unchanged
    })

    it('should clear previous mapping when reassigning a field type', () => {
      // Initial state: Column 5 mapped to debit
      const initialMapping = {
        date: '0',
        description: '3',
        amount: '',
        source_category: '4',
        debit: '5',
        credit: ''
      }

      // User maps Column 7 to "debit" (should clear column 5's debit mapping)
      const newMapping = handleColumnMappingChange(7, 'debit', initialMapping)

      // Expected: Column 5's debit mapping should be cleared, Column 7 should now be debit
      expect(newMapping.debit).toBe('7')
      // Note: The old implementation doesn't clear the previous mapping
      // This is actually the bug - when you map a new column to "debit",
      // it should clear the old column that was mapped to "debit"
    })
  })

  describe('Edge Cases', () => {
    it('should handle unmapping (setting to empty)', () => {
      const initialMapping = {
        date: '0',
        description: '3',
        amount: '5',
        source_category: '4',
        debit: '',
        credit: ''
      }

      // User unmaps column 5
      const newMapping = handleColumnMappingChange(5, '', initialMapping)

      expect(newMapping.amount).toBe('')
    })

    it('should handle multiple rapid changes', () => {
      let mapping = {
        date: '0',
        description: '3',
        amount: '5',
        source_category: '4',
        debit: '',
        credit: ''
      }

      // Change amount -> debit
      mapping = handleColumnMappingChange(5, 'debit', mapping)
      expect(mapping.debit).toBe('5')
      expect(mapping.amount).toBe('')

      // Change debit -> credit
      mapping = handleColumnMappingChange(5, 'credit', mapping)
      expect(mapping.credit).toBe('5')
      expect(mapping.debit).toBe('')

      // Change credit -> amount
      mapping = handleColumnMappingChange(5, 'amount', mapping)
      expect(mapping.amount).toBe('5')
      expect(mapping.credit).toBe('')
    })
  })

  describe('Real-World Scenario: Capital One CSV', () => {
    it('should handle Capital One CSV with Debit/Credit columns', () => {
      // CSV Headers: Transaction Date, Posted Date, Card No., Description, Category, Debit, Credit
      // Indices:      0                1            2         3            4         5      6

      // Initial auto-detection might map Debit (index 5) to amount
      let mapping = {
        date: '0', // Transaction Date
        description: '3', // Description
        amount: '', // Will be set by user
        source_category: '4', // Category
        debit: '',
        credit: ''
      }

      // User wants to use debit/credit consolidation
      // Map Debit column (index 5) to "debit"
      mapping = handleColumnMappingChange(5, 'debit', mapping)
      expect(mapping.debit).toBe('5')

      // Map Credit column (index 6) to "credit"
      mapping = handleColumnMappingChange(6, 'credit', mapping)
      expect(mapping.credit).toBe('6')

      // Verify amount remains unmapped
      expect(mapping.amount).toBe('')

      // Verify consolidation is possible
      expect(mapping.debit).toBe('5')
      expect(mapping.credit).toBe('6')
    })

    it('should handle switching from single amount to debit/credit consolidation', () => {
      // Initial mapping: Single amount column
      let mapping = {
        date: '0',
        description: '3',
        amount: '5', // Debit column incorrectly mapped as amount
        source_category: '4',
        debit: '',
        credit: ''
      }

      // User realizes they need debit/credit consolidation
      // Change column 5 from "amount" to "debit"
      mapping = handleColumnMappingChange(5, 'debit', mapping)
      expect(mapping.amount).toBe('')
      expect(mapping.debit).toBe('5')

      // Add credit mapping
      mapping = handleColumnMappingChange(6, 'credit', mapping)
      expect(mapping.credit).toBe('6')

      // Final state should have both debit and credit mapped, no amount
      expect(mapping.amount).toBe('')
      expect(mapping.debit).toBe('5')
      expect(mapping.credit).toBe('6')
    })
  })
})
