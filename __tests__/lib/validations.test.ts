import { TransactionSchema, TagSchema, validateTransaction } from '@/lib/validations'

describe('validations (zod)', () => {
  describe('TransactionSchema', () => {
    const base = {
      source_id: 1,
      date: '2024-01-15',
      description: 'Coffee',
      amount: -4.5,
    }

    it('accepts minimal valid payload', () => {
      const result = TransactionSchema.safeParse(base)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.ignore).toBe(false)
      }
    })

    it('rejects empty description and non-number amount', () => {
      const bad = { ...base, description: '', amount: 'x' as unknown as number }
      const result = TransactionSchema.safeParse(bad)
      expect(result.success).toBe(false)
      if (!result.success) {
        // Expect one issue for description too small and one for amount type
        const codes = result.error.issues.map((i) => i.code)
        expect(codes).toEqual(expect.arrayContaining(['too_small', 'invalid_type']))
        const paths = result.error.issues.map((i) => i.path.join('.'))
        expect(paths).toEqual(expect.arrayContaining(['description', 'amount']))
      }
    })

    it('validates tags string with non-empty parts', () => {
      const ok = { ...base, tags: 'work,coffee' }
      expect(TransactionSchema.safeParse(ok).success).toBe(true)

      const bad = { ...base, tags: 'work, ,coffee' }
      const res = TransactionSchema.safeParse(bad)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('All tags must be non-empty')
      }
    })

    it('accepts date as Date and normalizes with validateTransaction()', () => {
      const input = { ...base, date: new Date('2024-03-02T12:00:00Z') }
      const parsed = validateTransaction(input)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.date).toBe('2024-03-02')
      }
    })
  })

  describe('TagSchema', () => {
    it('accepts valid tag names', () => {
      const ok = ['dev', 'dev-123', 'FEATURE_X', 'a_b']
      for (const name of ok) {
        expect(TagSchema.safeParse({ name }).success).toBe(true)
      }
    })

    it('rejects invalid tag names', () => {
      const bad = [' with space', 'has.dot', 'has@sign', '', 'a'.repeat(51)]
      for (const name of bad) {
        const res = TagSchema.safeParse({ name })
        expect(res.success).toBe(false)
      }
    })
  })
})
