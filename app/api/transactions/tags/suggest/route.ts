import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel } from '@/db/models/transactions.model'
import { suggestTags } from '@/lib/tags'

// GET /api/transactions/tags/suggest?q=pre&limit=10
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const limitParam = searchParams.get('limit')
    const limit = Math.max(1, Math.min(parseInt(limitParam || '10', 10) || 10, 50))

    if (!q) {
      return NextResponse.json({ suggestions: [] })
    }

    const allTags = await transactionsModel.getAllTags()
    const suggestions = suggestTags(q, allTags, limit)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error fetching tag suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag suggestions' },
      { status: 500 }
    )
  }
}
