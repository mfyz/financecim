import React from 'react'

describe('CSV Auto-Detection Column Priority Bug', () => {
  // Mock the headerMappingConfig from step2/page.tsx
  const headerMappingConfig = {
    date: [
      'date', 'transaction date', 'posted date', 'effective date', 'trans date',
      'time', 'timestamp', 'date posted', 'settlement date', 'booking date'
    ],
    description: [
      'description', 'desc', 'merchant', 'payee', 'transaction description',
      'details', 'memo', 'reference', 'vendor', 'transaction details'
    ],
    amount: [
      'amount', 'debit', 'credit', 'transaction amount', 'net amount',
      'total', 'sum', 'value', 'charge', 'payment', 'amount (usd)'
    ],
    source_category: [
      'category', 'type', 'classification', 'class', 'merchant category',
      'transaction type', 'trans type', 'category code', 'mcc'
    ]
  }

  interface ColumnMapping {
    date: string
    description: string
    amount: string
    source_category: string
  }

  // Old buggy implementation (processes headers first)
  const autoDetectColumns_OLD_BUGGY = (headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {
      date: '',
      description: '',
      amount: '',
      source_category: ''
    }

    // First pass: exact matches (highest priority)
    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase().trim()

      Object.entries(headerMappingConfig).forEach(([fieldType, variations]) => {
        variations.forEach(variation => {
          if (headerLower === variation.toLowerCase()) {
            if (!mapping[fieldType as keyof ColumnMapping]) {
              mapping[fieldType as keyof ColumnMapping] = index.toString()
            }
          }
        })
      })
    })

    return mapping
  }

  // New fixed implementation (processes variations first)
  const autoDetectColumns_FIXED = (headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {
      date: '',
      description: '',
      amount: '',
      source_category: ''
    }

    // First pass: exact matches (highest priority)
    // IMPORTANT: Loop through variations FIRST (not headers) to prioritize by config order
    Object.entries(headerMappingConfig).forEach(([fieldType, variations]) => {
      variations.forEach(variation => {
        if (mapping[fieldType as keyof ColumnMapping]) return // Skip if already mapped

        // Find first header that matches this variation
        const headerIndex = headers.findIndex(header =>
          header.toLowerCase().trim() === variation.toLowerCase()
        )

        if (headerIndex !== -1) {
          mapping[fieldType as keyof ColumnMapping] = headerIndex.toString()
        }
      })
    })

    return mapping
  }

  it('BUG: old implementation picks Type over Category when Type appears first', () => {
    // CSV headers: Date, Description, Amount, Type, Category
    // Type is at index 3, Category is at index 4
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category']

    const mapping = autoDetectColumns_OLD_BUGGY(headers)

    // BUG: This picks "Type" (index 3) because it appears first in the CSV
    expect(mapping.source_category).toBe('3') // Type column
    // Should be '4' (Category column) but the bug causes it to be '3'
  })

  it('FIXED: new implementation picks Category over Type (config priority)', () => {
    // CSV headers: Date, Description, Amount, Type, Category
    // Type is at index 3, Category is at index 4
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category']

    const mapping = autoDetectColumns_FIXED(headers)

    // FIXED: This picks "Category" (index 4) because 'category' comes before 'type' in config
    expect(mapping.source_category).toBe('4') // Category column
  })

  it('FIXED: works correctly when Category appears before Type', () => {
    // CSV headers: Date, Description, Amount, Category, Type
    const headers = ['Date', 'Description', 'Amount', 'Category', 'Type']

    const mapping = autoDetectColumns_FIXED(headers)

    // Should pick Category (index 3)
    expect(mapping.source_category).toBe('3')
  })

  it('FIXED: picks first variation match when multiple variations match', () => {
    // CSV headers: Date, Merchant, Total, Classification, Category
    // Both "classification" and "category" match source_category
    // "category" comes first in config, so should be preferred
    const headers = ['Date', 'Merchant', 'Total', 'Classification', 'Category']

    const mapping = autoDetectColumns_FIXED(headers)

    // Should pick Category (index 4) because 'category' comes before 'classification' in config
    expect(mapping.source_category).toBe('4')
  })

  it('FIXED: handles case-insensitive matching', () => {
    const headers = ['DATE', 'DESCRIPTION', 'AMOUNT', 'CATEGORY']

    const mapping = autoDetectColumns_FIXED(headers)

    expect(mapping.date).toBe('0')
    expect(mapping.description).toBe('1')
    expect(mapping.amount).toBe('2')
    expect(mapping.source_category).toBe('3')
  })

  it('FIXED: handles headers with extra whitespace', () => {
    const headers = ['  Date  ', ' Description ', 'Amount', '  Category  ']

    const mapping = autoDetectColumns_FIXED(headers)

    expect(mapping.date).toBe('0')
    expect(mapping.description).toBe('1')
    expect(mapping.amount).toBe('2')
    expect(mapping.source_category).toBe('3')
  })
})