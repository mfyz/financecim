import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel } from '@/db/models/transactions.model'
import { z } from 'zod'

// Query validation: `q` (required non-empty after trim), `limit` (1-100, default 20)
const querySchema = z.object({
  q: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : '')),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return 20
      const n = parseInt(v, 10)
      if (Number.isNaN(n)) return 20
      return Math.max(1, Math.min(100, n))
    }),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const raw = Object.fromEntries(searchParams.entries())
    const params = querySchema.parse(raw)

    // Empty or missing query → return empty results quickly
    if (!params.q) {
      return NextResponse.json({ data: [] })
    }

    const results = await transactionsModel.search(params.q, params.limit)
    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Error searching transactions:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to search transactions' },
      { status: 500 }
    )
  }
}

