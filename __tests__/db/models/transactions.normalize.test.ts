/**
 * @jest-environment node
 */
import { transactionsModel } from '@/db/models/transactions.model'
import { transactionHash } from '@/lib/hash'

describe('transactionsModel.normalizePayload', () => {
  it('maps snake_case to camelCase and normalizes date + hash', () => {
    const input = {
      source_id: 42,
      unit_id: null,
      category_id: undefined,
      source_category: 'Groceries',
      date: new Date('2024-07-08T10:11:12Z'),
      description: 'TEST NORMALIZE',
      amount: -9.99,
      ignore: false,
      notes: undefined,
      tags: undefined,
    }

    const normalized = (transactionsModel as any).normalizePayload(input)

    expect(normalized.sourceId).toBe(42)
    expect(normalized.unitId).toBeNull()
    expect(normalized.categoryId).toBeNull()
    expect(normalized.sourceCategory).toBe('Groceries')
    expect(normalized.date).toBe('2024-07-08')
    expect(normalized.description).toBe('TEST NORMALIZE')
    expect(normalized.amount).toBe(-9.99)
    expect(normalized.ignore).toBe(false)
    expect(normalized.notes).toBeNull()
    expect(normalized.tags).toBeNull()

    const expectedHash = transactionHash(42, '2024-07-08', 'TEST NORMALIZE', -9.99)
    expect(normalized.hash).toBe(expectedHash)
  })
})

