/**
 * @jest-environment node
 */
import { transactionsModel } from '@/db/models/transactions.model'
import { sourcesModel } from '@/db/models/sources.model'
import { POST } from '@/app/api/transactions/import/route'
import { NextRequest } from 'next/server'

// Mock the database models
jest.mock('@/db/models/transactions.model', () => ({
  transactionsModel: {
    normalizePayload: jest.fn(),
    create: jest.fn(),
    getByHash: jest.fn(),
  }
}))

jest.mock('@/db/models/sources.model', () => ({
  sourcesModel: {
    getById: jest.fn(),
  }
}))

const mockTransactionsModel = transactionsModel as jest.Mocked<typeof transactionsModel>
const mockSourcesModel = sourcesModel as jest.Mocked<typeof sourcesModel>

describe('CSV Import Source Category Bug', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    mockSourcesModel.getById.mockResolvedValue({
      id: 1,
      name: 'Test Bank',
      type: 'bank',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })

  it('should preserve source_category value from CSV when importing', async () => {
    // Simulate CSV data with columns:
    // Date,Description,Amount,Category,Notes
    // The user maps "Category" column to "Source Category"

    const csvRow = {
      date: '2024-01-15',
      description: 'Coffee Shop Purchase',
      amount: -4.50,
      source_id: 1,
      source_category: 'Food & Dining', // This is from the "Category" column in CSV
      category_id: null,
      unit_id: null,
      source_data: {
        Date: '2024-01-15',
        Description: 'Coffee Shop Purchase',
        Amount: '-4.50',
        Category: 'Food & Dining', // Original CSV column
        Notes: 'Morning coffee'
      },
      allowDuplicate: false
    }

    // Mock normalizePayload to return properly normalized data
    mockTransactionsModel.normalizePayload.mockImplementation((input: any) => {
      return {
        sourceId: input.source_id || input.sourceId,
        unitId: input.unit_id || input.unitId || null,
        date: input.date,
        description: input.description,
        amount: input.amount,
        sourceCategory: input.source_category || input.sourceCategory || null,
        categoryId: input.category_id || input.categoryId || null,
        ignore: input.ignore || false,
        notes: input.notes || null,
        tags: input.tags || null,
        hash: 'test-hash-12345',
        sourceData: input.source_data || input.sourceData || null,
      } as any
    })

    mockTransactionsModel.getByHash.mockResolvedValue(null) // No duplicate

    mockTransactionsModel.create.mockImplementation(async (data: any) => {
      return {
        id: 1,
        sourceId: data.sourceId || data.source_id,
        unitId: data.unitId || data.unit_id || null,
        date: data.date,
        description: data.description,
        amount: data.amount,
        sourceCategory: data.sourceCategory || data.source_category || null,
        categoryId: data.categoryId || data.category_id || null,
        ignore: false,
        notes: null,
        tags: null,
        hash: 'test-hash-12345',
        sourceData: data.sourceData || data.source_data || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any
    })

    // Create request
    const request = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({
        transactions: [csvRow]
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Execute import
    const response = await POST(request)
    const result = await response.json()

    // Verify response
    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.imported).toBe(1)

    // CRITICAL: Verify that normalizePayload was called with source_category
    expect(mockTransactionsModel.normalizePayload).toHaveBeenCalledWith(
      expect.objectContaining({
        source_category: 'Food & Dining'
      })
    )

    // CRITICAL: Verify that create was called with the transaction data containing source_category
    expect(mockTransactionsModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        source_category: 'Food & Dining'
      })
    )

    // Get the actual data passed to create
    const createCallData = mockTransactionsModel.create.mock.calls[0][0]

    // Verify the created transaction has the correct sourceCategory value
    // This should be 'Food & Dining' from the Category column, NOT from another column
    expect(createCallData.source_category).toBe('Food & Dining')
  })

  it('should correctly map source_category when CSV has multiple similar columns', async () => {
    // Simulate a CSV with confusing column names:
    // Date,Description,Amount,Type,Category
    // Where user maps "Category" to "Source Category", but the bug might pick "Type" instead

    const csvRow = {
      date: '2024-01-15',
      description: 'Grocery Store',
      amount: -85.50,
      source_id: 1,
      source_category: 'Groceries', // Mapped from "Category" column
      category_id: null,
      unit_id: null,
      source_data: {
        Date: '2024-01-15',
        Description: 'Grocery Store',
        Amount: '-85.50',
        Type: 'Debit', // This should NOT be picked as source_category
        Category: 'Groceries' // This should be picked as source_category
      },
      allowDuplicate: false
    }

    mockTransactionsModel.normalizePayload.mockImplementation((input: any) => {
      return {
        sourceId: input.source_id || input.sourceId,
        unitId: input.unit_id || input.unitId || null,
        date: input.date,
        description: input.description,
        amount: input.amount,
        sourceCategory: input.source_category || input.sourceCategory || null,
        categoryId: input.category_id || input.categoryId || null,
        ignore: input.ignore || false,
        notes: input.notes || null,
        tags: input.tags || null,
        hash: 'test-hash-67890',
        sourceData: input.source_data || input.sourceData || null,
      } as any
    })

    mockTransactionsModel.getByHash.mockResolvedValue(null)

    mockTransactionsModel.create.mockImplementation(async (data: any) => {
      return {
        id: 2,
        sourceId: data.sourceId || data.source_id,
        unitId: data.unitId || data.unit_id || null,
        date: data.date,
        description: data.description,
        amount: data.amount,
        sourceCategory: data.sourceCategory || data.source_category || null,
        categoryId: data.categoryId || data.category_id || null,
        ignore: false,
        notes: null,
        tags: null,
        hash: 'test-hash-67890',
        sourceData: data.sourceData || data.source_data || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any
    })

    const request = new NextRequest('http://localhost:3000/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({
        transactions: [csvRow]
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)

    // CRITICAL: The source_category should be "Groceries", NOT "Debit"
    const createCallData = mockTransactionsModel.create.mock.calls[0][0]
    expect(createCallData.source_category).toBe('Groceries')
    expect(createCallData.source_category).not.toBe('Debit')
  })

  it('should verify normalizePayload correctly handles both snake_case and camelCase', async () => {
    // Test that the normalization logic itself is correct
    const testCases = [
      {
        input: { source_category: 'Test1' },
        expected: 'Test1',
        description: 'snake_case input'
      },
      {
        input: { sourceCategory: 'Test2' },
        expected: 'Test2',
        description: 'camelCase input'
      },
      {
        input: { source_category: 'Test3', sourceCategory: 'Ignored' },
        expected: 'Ignored', // sourceCategory takes precedence (camelCase over snake_case)
        description: 'both provided (sourceCategory takes precedence in actual code)'
      }
    ]

    // Use the real normalizePayload logic
    jest.unmock('@/db/models/transactions.model')
    const { transactionsModel: realModel } = await import('@/db/models/transactions.model')

    for (const testCase of testCases) {
      const normalized = realModel.normalizePayload({
        sourceId: 1,
        date: '2024-01-15',
        description: 'Test',
        amount: 10,
        ...testCase.input
      })

      expect(normalized.sourceCategory).toBe(testCase.expected)
    }
  })

  it('REAL BUG: sourceData contamination with sourceCategory key', async () => {
    // This simulates the REAL bug scenario:
    // 1. CSV has columns: Date, Description, Amount, Type, Category
    // 2. User maps "Category" column (index 4) to "source_category"
    // 3. Frontend creates source_data JSON with key "Category" containing the correct value
    // 4. But source_data might ALSO have a "sourceCategory" key from somewhere
    // 5. normalizePayload() prefers sourceCategory over source_category, causing wrong data

    const csvRowData = {
      date: '2024-01-15',
      description: 'Restaurant Bill',
      amount: -45.50,
      source_id: 1,
      source_category: 'Dining',  // This is what user mapped from "Category" column
      category_id: null,
      unit_id: null,
      source_data: {
        Date: '2024-01-15',
        Description: 'Restaurant Bill',
        Amount: '-45.50',
        Type: 'Purchase',      // This column should NOT be used
        Category: 'Dining',    // This is the correct column
        // BUG SCENARIO: What if source_data somehow contains a camelCase key?
        sourceCategory: 'Purchase'  // This might contaminate if spread operator is used
      },
      allowDuplicate: false
    }

    // Mock normalizePayload to use the REAL implementation
    jest.unmock('@/db/models/transactions.model')
    const { transactionsModel: realModel } = await import('@/db/models/transactions.model')

    // Call the real normalize function
    const normalized = realModel.normalizePayload(csvRowData)

    // CRITICAL: The sourceCategory should be 'Dining', NOT 'Purchase'
    // If this fails, it means the camelCase key from source_data is contaminating the value
    expect(normalized.sourceCategory).toBe('Dining')
  })

  it('should handle source_data with conflicting keys correctly', async () => {
    // Unmock to test real implementation
    jest.unmock('@/db/models/transactions.model')
    const { transactionsModel: realModel } = await import('@/db/models/transactions.model')

    // Case 1: source_category explicitly set, source_data has no conflicting keys
    const normalized1 = realModel.normalizePayload({
      sourceId: 1,
      date: '2024-01-15',
      description: 'Test',
      amount: 10,
      source_category: 'CorrectValue',
      source_data: { SomeColumn: 'SomeValue' }
    })
    expect(normalized1.sourceCategory).toBe('CorrectValue')

    // Case 2: source_category explicitly set, but object also has sourceCategory key
    const normalized2 = realModel.normalizePayload({
      sourceId: 1,
      date: '2024-01-15',
      description: 'Test',
      amount: 10,
      source_category: 'CorrectValue',
      sourceCategory: 'WrongValue', // This shouldn't be here but might come from object spread
      source_data: { SomeColumn: 'SomeValue' }
    })
    // The behavior here depends on the order of keys in normalizePayload
    // According to line 41: sourceCategory ?? source_category
    // So sourceCategory (camelCase) takes precedence
    expect(normalized2.sourceCategory).toBe('WrongValue')
  })
})