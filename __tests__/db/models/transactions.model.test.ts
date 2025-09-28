/**
 * @jest-environment node
 */
import { transactionsModel } from '@/db/models/transactions.model'
import { sourcesModel } from '@/db/models/sources.model'
import { transactionHash } from '@/lib/hash'

describe('transactionsModel with hash', () => {
  it('creates transaction with auto-generated hash and fetches by hash', async () => {
    // Create a source to satisfy FK
    const src = await sourcesModel.create({ name: 'Test Source', type: 'bank' })

    const payload = {
      sourceId: src.id,
      date: '2024-02-01',
      description: 'TEST HASH COFFEE',
      amount: -3.25,
      ignore: false,
    }

    const created = await transactionsModel.create(payload as any)
    expect(created.id).toBeDefined()
    expect(created.hash).toBeDefined()

    // Hash should match utility function
    const expected = transactionHash(payload.sourceId, payload.date, payload.description, payload.amount)
    expect(created.hash).toBe(expected)

    // Fetch by hash
    const fetched = await transactionsModel.getByHash(expected)
    expect(fetched).not.toBeNull()
    expect(fetched!.id).toBe(created.id)
  })
})

