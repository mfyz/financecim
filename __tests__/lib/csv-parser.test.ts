import { CSVParser, ColumnMapping } from '@/lib/csv-parser'

describe('CSVParser', () => {
  let parser: CSVParser

  beforeEach(() => {
    parser = new CSVParser()
  })

  describe('parseHeaders', () => {
    it('should parse simple headers', () => {
      const csv = 'Date,Description,Amount'
      const headers = parser.parseHeaders(csv)
      expect(headers).toEqual(['Date', 'Description', 'Amount'])
    })

    it('should handle quoted headers', () => {
      const csv = '"Date","Transaction Description","Amount (USD)"'
      const headers = parser.parseHeaders(csv)
      expect(headers).toEqual(['Date', 'Transaction Description', 'Amount (USD)'])
    })

    it('should handle headers with commas inside quotes', () => {
      const csv = 'Date,"Description, Details",Amount'
      const headers = parser.parseHeaders(csv)
      expect(headers).toEqual(['Date', 'Description, Details', 'Amount'])
    })

    it('should return empty array for empty content', () => {
      const headers = parser.parseHeaders('')
      expect(headers).toEqual([])
    })
  })

  describe('autoDetectMapping', () => {
    it('should detect common column names', () => {
      const headers = ['Transaction Date', 'Merchant Description', 'Amount']
      const mapping = parser.autoDetectMapping(headers)

      expect(mapping.date).toBe(0)
      expect(mapping.description).toBe(1)
      expect(mapping.amount).toBe(2)
    })

    it('should detect case-insensitive matches', () => {
      const headers = ['DATE', 'DESCRIPTION', 'AMOUNT', 'CATEGORY', 'NOTES']
      const mapping = parser.autoDetectMapping(headers)

      expect(mapping.date).toBe(0)
      expect(mapping.description).toBe(1)
      expect(mapping.amount).toBe(2)
      expect(mapping.sourceCategory).toBe(3)
      expect(mapping.notes).toBe(4)
    })

    it('should detect German column names', () => {
      const headers = ['Datum', 'Beschreibung', 'Betrag']
      const mapping = parser.autoDetectMapping(headers)

      expect(mapping.date).toBe(0)
      expect(mapping.description).toBe(1)
      expect(mapping.amount).toBe(2)
    })

    it('should return -1 for undetected columns', () => {
      const headers = ['Column1', 'Column2', 'Column3']
      const mapping = parser.autoDetectMapping(headers)

      expect(mapping.date).toBe(-1)
      expect(mapping.description).toBe(-1)
      expect(mapping.amount).toBe(-1)
    })
  })

  describe('parseTransactions', () => {
    const mapping: ColumnMapping = {
      date: 0,
      description: 1,
      amount: 2
    }

    it('should parse valid transactions', () => {
      const csv = `Date,Description,Amount
2024-01-15,Grocery Store,-45.50
2024-01-16,Salary Deposit,2500.00
2024-01-17,Gas Station,-30.00`

      const { transactions, errors } = parser.parseTransactions(csv, mapping, 1)

      expect(transactions).toHaveLength(3)
      expect(errors).toHaveLength(0)

      expect(transactions[0]).toMatchObject({
        date: '2024-01-15',
        description: 'Grocery Store',
        amount: -45.50
      })
      expect(transactions[0].hash).toBeDefined()
    })

    it('should handle quoted fields', () => {
      const csv = `Date,Description,Amount
"2024-01-15","Store, Inc.",-45.50
"2024-01-16","John's Shop",30.00`

      const { transactions, errors } = parser.parseTransactions(csv, mapping, 1)

      expect(transactions).toHaveLength(2)
      expect(transactions[0].description).toBe('Store, Inc.')
      expect(transactions[1].description).toBe("John's Shop")
    })

    it('should parse amounts with currency symbols', () => {
      const csv = `Date,Description,Amount
2024-01-15,Store 1,$45.50
2024-01-16,Store 2,"€1,234.56"
2024-01-17,Store 3,£30.00`

      const { transactions, errors } = parser.parseTransactions(csv, mapping, 1)

      expect(transactions[0].amount).toBe(45.50)
      expect(transactions[1].amount).toBe(1234.56)
      expect(transactions[2].amount).toBe(30.00)
    })

    it('should handle negative amounts in parentheses', () => {
      const csv = `Date,Description,Amount
2024-01-15,Expense,(100.00)
2024-01-16,Income,50.00`

      const { transactions, errors } = parser.parseTransactions(csv, mapping, 1)

      expect(transactions[0].amount).toBe(-100.00)
      expect(transactions[1].amount).toBe(50.00)
    })

    it('should parse European number format', () => {
      const csv = `Date,Description,Amount
2024-01-15,Store,"1.234,56"
2024-01-16,Shop,"999,99"`

      const { transactions, errors } = parser.parseTransactions(csv, mapping, 1)

      expect(transactions[0].amount).toBe(1234.56)
      expect(transactions[1].amount).toBe(999.99)
    })

    it('should parse various date formats', () => {
      const csv = `Date,Description,Amount
2024-01-15,ISO format,10
01/16/2024,US format,20
15.01.2024,EU format,30`

      const { transactions, errors } = parser.parseTransactions(csv, mapping, 1)

      expect(transactions[0].date).toBe('2024-01-15')
      expect(transactions[1].date).toBe('2024-01-16')
      expect(transactions[2].date).toBe('2024-01-15')
    })

    it('should parse 2-digit year formats (MM/DD/YY)', () => {
      const csv = `Date,Description,Amount
12/20/24,Test Transaction,100.00
01/15/25,Another Transaction,50.50`

      const { transactions, errors } = parser.parseTransactions(csv, mapping, 1)

      expect(errors).toHaveLength(0)
      expect(transactions).toHaveLength(2)
      expect(transactions[0].date).toBe('2024-12-20')
      expect(transactions[1].date).toBe('2025-01-15')
    })

    it('should parse 2-digit year formats (DD/MM/YY) when day > 12', () => {
      const csv = `Date,Description,Amount
20/12/24,Test Transaction,100.00
15/01/25,Another Transaction,50.50`

      const { transactions, errors } = parser.parseTransactions(csv, mapping, 1)

      expect(errors).toHaveLength(0)
      expect(transactions).toHaveLength(2)
      expect(transactions[0].date).toBe('2024-12-20')
      expect(transactions[1].date).toBe('2025-01-15')
    })

    it('should handle 2-digit year century cutoff (00-30 = 2000s, 31-99 = 1900s)', () => {
      const csv = `Date,Description,Amount
12/20/24,Year 2024,100.00
12/20/30,Year 2030,100.00
12/20/31,Year 1931,100.00
12/20/99,Year 1999,100.00
12/20/00,Year 2000,100.00`

      const { transactions, errors } = parser.parseTransactions(csv, mapping, 1)

      expect(errors).toHaveLength(0)
      expect(transactions).toHaveLength(5)
      expect(transactions[0].date).toBe('2024-12-20')
      expect(transactions[1].date).toBe('2030-12-20')
      expect(transactions[2].date).toBe('1931-12-20')
      expect(transactions[3].date).toBe('1999-12-20')
      expect(transactions[4].date).toBe('2000-12-20')
    })

    it('should default to US format (MM/DD/YY) for ambiguous 2-digit year dates', () => {
      const csv = `Date,Description,Amount
05/03/24,Ambiguous Date,100.00`

      const { transactions, errors } = parser.parseTransactions(csv, mapping, 1)

      expect(errors).toHaveLength(0)
      expect(transactions).toHaveLength(1)
      // Should interpret as May 3rd (US format MM/DD/YY)
      expect(transactions[0].date).toBe('2024-05-03')
    })

    it('should handle single-digit months and days with 2-digit years', () => {
      const csv = `Date,Description,Amount
1/5/24,Single Digits,100.00
3/9/25,More Singles,50.50`

      const { transactions, errors } = parser.parseTransactions(csv, mapping, 1)

      expect(errors).toHaveLength(0)
      expect(transactions).toHaveLength(2)
      expect(transactions[0].date).toBe('2024-01-05')
      expect(transactions[1].date).toBe('2025-03-09')
    })

    it('should produce consistent hashes for same date in different formats', () => {
      const csv1 = `Date,Description,Amount
2024-12-20,Test Transaction,100.00`
      const csv2 = `Date,Description,Amount
12/20/2024,Test Transaction,100.00`
      const csv3 = `Date,Description,Amount
12/20/24,Test Transaction,100.00`

      const { transactions: trans1 } = parser.parseTransactions(csv1, mapping, 1)
      const { transactions: trans2 } = parser.parseTransactions(csv2, mapping, 1)
      const { transactions: trans3 } = parser.parseTransactions(csv3, mapping, 1)

      // All three should have the same hash (same date, description, amount, source)
      expect(trans1[0].hash).toBe(trans2[0].hash)
      expect(trans2[0].hash).toBe(trans3[0].hash)
    })

    it('should include optional fields', () => {
      const mappingWithOptional: ColumnMapping = {
        date: 0,
        description: 1,
        amount: 2,
        sourceCategory: 3,
        notes: 4
      }

      const csv = `Date,Description,Amount,Category,Notes
2024-01-15,Store,45.50,Groceries,Weekly shopping
2024-01-16,Restaurant,30.00,Dining,`

      const { transactions, errors } = parser.parseTransactions(csv, mappingWithOptional, 1)

      expect(transactions[0].source_category).toBe('Groceries')
      expect(transactions[0].notes).toBe('Weekly shopping')
      expect(transactions[1].source_category).toBe('Dining')
      expect(transactions[1].notes).toBeUndefined()
    })

    it('should report errors for invalid rows', () => {
      const csv = `Date,Description,Amount
2024-01-15,Store,invalid
,Missing date,50
2024-01-17,,30`

      const { transactions, errors } = parser.parseTransactions(csv, mapping, 1)

      expect(transactions).toHaveLength(0)
      expect(errors).toHaveLength(3)
      expect(errors[0]).toContain('Line 2')
      expect(errors[0]).toContain('Invalid amount')
    })

    it('should skip empty lines', () => {
      const csv = `Date,Description,Amount
2024-01-15,Store,45.50

2024-01-16,Restaurant,30.00
`

      const { transactions, errors } = parser.parseTransactions(csv, mapping, 1)

      expect(transactions).toHaveLength(2)
      expect(errors).toHaveLength(0)
    })

    it('should generate unique hashes for different transactions', () => {
      const csv = `Date,Description,Amount
2024-01-15,Store,45.50
2024-01-15,Store,45.50
2024-01-15,Store,45.51`

      const { transactions } = parser.parseTransactions(csv, mapping, 1)

      // Same transaction should have same hash
      expect(transactions[0].hash).toBe(transactions[1].hash)
      // Different amount should have different hash
      expect(transactions[0].hash).not.toBe(transactions[2].hash)
    })

    it('should generate different hashes for different source IDs', () => {
      const csv = `Date,Description,Amount
2024-01-15,Store,45.50`

      const { transactions: trans1 } = parser.parseTransactions(csv, mapping, 1)
      const { transactions: trans2 } = parser.parseTransactions(csv, mapping, 2)

      expect(trans1[0].hash).not.toBe(trans2[0].hash)
    })
  })

  describe('custom delimiter support', () => {
    it('should parse semicolon-delimited CSV', () => {
      const parser = new CSVParser({ delimiter: ';' })
      const csv = `Date;Description;Amount
2024-01-15;Store;45.50
2024-01-16;Restaurant;30.00`

      const headers = parser.parseHeaders(csv)
      expect(headers).toEqual(['Date', 'Description', 'Amount'])

      const mapping = parser.autoDetectMapping(headers)
      const { transactions } = parser.parseTransactions(csv, mapping, 1)

      expect(transactions).toHaveLength(2)
      expect(transactions[0].description).toBe('Store')
    })

    it('should parse tab-delimited CSV', () => {
      const parser = new CSVParser({ delimiter: '\t' })
      const csv = `Date\tDescription\tAmount
2024-01-15\tStore\t45.50`

      const headers = parser.parseHeaders(csv)
      expect(headers).toEqual(['Date', 'Description', 'Amount'])

      const mapping = parser.autoDetectMapping(headers)
      const { transactions } = parser.parseTransactions(csv, mapping, 1)

      expect(transactions).toHaveLength(1)
      expect(transactions[0].description).toBe('Store')
    })
  })

  describe('no header support', () => {
    it('should parse CSV without headers', () => {
      const parser = new CSVParser({ hasHeader: false })
      const csv = `2024-01-15,Store,45.50
2024-01-16,Restaurant,30.00`

      const mapping: ColumnMapping = {
        date: 0,
        description: 1,
        amount: 2
      }

      const { transactions } = parser.parseTransactions(csv, mapping, 1)

      expect(transactions).toHaveLength(2)
      expect(transactions[0].description).toBe('Store')
      expect(transactions[1].description).toBe('Restaurant')
    })
  })
})