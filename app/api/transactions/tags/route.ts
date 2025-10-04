import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel } from '@/db/models/transactions.model'

export async function GET(_request: NextRequest) {
  try {
    const tags = await transactionsModel.getAllTags()

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error fetching transaction tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction tags' },
      { status: 500 }
    )
  }
}