/**
 * @jest-environment node
 */

import { seed as seedDatabase } from '@/db/seed'
import { getDatabase } from '@/db/connection'
import { units, sources, categories, transactions, unitRules, categoryRules, importLog } from '@/db/schema'

// Mock the database connection
jest.mock('@/db/connection', () => ({
  __esModule: true,
  getDatabase: jest.fn(),
  db: jest.fn()
}))

describe('Seed Database', () => {
  let mockDb: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock database object
    mockDb = {
      delete: jest.fn(() => Promise.resolve()),
      insert: jest.fn(() => ({
        values: jest.fn(() => Promise.resolve())
      }))
    }

    // Mock the getDatabase function to return our mock database
    ;(getDatabase as jest.Mock).mockReturnValue(mockDb)
  })

  it('should clear existing data before seeding', async () => {
    await seedDatabase()

    // Verify delete was called for each table
    expect(mockDb.delete).toHaveBeenCalledWith(importLog)
    expect(mockDb.delete).toHaveBeenCalledWith(categoryRules)
    expect(mockDb.delete).toHaveBeenCalledWith(unitRules)
    expect(mockDb.delete).toHaveBeenCalledWith(transactions)
    expect(mockDb.delete).toHaveBeenCalledWith(categories)
    expect(mockDb.delete).toHaveBeenCalledWith(sources)
    expect(mockDb.delete).toHaveBeenCalledWith(units)

    // Verify the delete operations were executed
    expect(mockDb.delete).toHaveBeenCalledTimes(7)
  })

  it('should seed units table', async () => {
    await seedDatabase()

    // Find the insert call for units
    const insertCalls = mockDb.insert.mock.calls
    const unitsInsertCall = insertCalls.find((call: any) => call[0] === units)

    expect(unitsInsertCall).toBeDefined()

    // Get the values method after insert(units)
    const insertResult = mockDb.insert.mock.results.find(
      (result: any, index: number) => mockDb.insert.mock.calls[index][0] === units
    )

    expect(insertResult).toBeDefined()
  })

  it('should seed sources table', async () => {
    await seedDatabase()

    // Find the insert call for sources
    const insertCalls = mockDb.insert.mock.calls
    const sourcesInsertCall = insertCalls.find((call: any) => call[0] === sources)

    expect(sourcesInsertCall).toBeDefined()
  })

  it('should seed categories with hierarchical structure', async () => {
    await seedDatabase()

    // Find the insert call for categories
    const insertCalls = mockDb.insert.mock.calls
    const categoriesInsertCall = insertCalls.find((call: any) => call[0] === categories)

    expect(categoriesInsertCall).toBeDefined()
  })

  it('should seed transactions table', async () => {
    await seedDatabase()

    // Find the insert call for transactions
    const insertCalls = mockDb.insert.mock.calls
    const transactionsInsertCall = insertCalls.find((call: any) => call[0] === transactions)

    expect(transactionsInsertCall).toBeDefined()
  })

  it('should seed unit rules', async () => {
    await seedDatabase()

    // Find the insert call for unitRules
    const insertCalls = mockDb.insert.mock.calls
    const unitRulesInsertCall = insertCalls.find((call: any) => call[0] === unitRules)

    expect(unitRulesInsertCall).toBeDefined()
  })

  it('should seed category rules', async () => {
    await seedDatabase()

    // Find the insert call for categoryRules
    const insertCalls = mockDb.insert.mock.calls
    const categoryRulesInsertCall = insertCalls.find((call: any) => call[0] === categoryRules)

    expect(categoryRulesInsertCall).toBeDefined()
  })

  it('should complete successfully', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

    await seedDatabase()

    expect(consoleLogSpy).toHaveBeenCalledWith('✅ Database seeded successfully!')

    consoleLogSpy.mockRestore()
  })

  it('should maintain referential integrity', async () => {
    await seedDatabase()

    // Verify that inserts are called in the correct order
    const insertCalls = mockDb.insert.mock.calls

    // Get indices of each table's insert
    const unitsIndex = insertCalls.findIndex((call: any) => call[0] === units)
    const sourcesIndex = insertCalls.findIndex((call: any) => call[0] === sources)
    const categoriesIndex = insertCalls.findIndex((call: any) => call[0] === categories)
    const transactionsIndex = insertCalls.findIndex((call: any) => call[0] === transactions)
    const unitRulesIndex = insertCalls.findIndex((call: any) => call[0] === unitRules)
    const categoryRulesIndex = insertCalls.findIndex((call: any) => call[0] === categoryRules)

    // Verify order: units and sources before transactions
    expect(unitsIndex).toBeLessThan(transactionsIndex)
    expect(sourcesIndex).toBeLessThan(transactionsIndex)
    expect(categoriesIndex).toBeLessThan(transactionsIndex)

    // Verify rules are inserted after their referenced entities
    expect(unitsIndex).toBeLessThan(unitRulesIndex)
    expect(categoriesIndex).toBeLessThan(categoryRulesIndex)
  })

  it('should handle errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    // Make the delete operation throw an error
    mockDb.delete.mockImplementation(() => {
      throw new Error('Database connection failed')
    })

    await expect(seedDatabase()).rejects.toThrow('Database connection failed')

    consoleErrorSpy.mockRestore()
  })
})