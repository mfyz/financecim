import { transactionHash } from '@/lib/hash'

describe('transactionHash', () => {
  test('produces stable 16-char hex based on inputs', () => {
    const h1 = transactionHash(1, '2024-01-15', 'Coffee', -4.5)
    const h2 = transactionHash(1, '2024-01-15', 'Coffee', -4.5)
    expect(h1).toBe(h2)
    expect(h1).toMatch(/^[0-9a-f]{16}$/)
  })

  test('changes when any field changes', () => {
    const base = transactionHash(1, '2024-01-15', 'Coffee', -4.5)
    expect(transactionHash(2, '2024-01-15', 'Coffee', -4.5)).not.toBe(base)
    expect(transactionHash(1, '2024-01-16', 'Coffee', -4.5)).not.toBe(base)
    expect(transactionHash(1, '2024-01-15', 'Tea', -4.5)).not.toBe(base)
    expect(transactionHash(1, '2024-01-15', 'Coffee', -4.51)).not.toBe(base)
  })
})

