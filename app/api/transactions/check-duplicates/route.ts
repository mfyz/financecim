import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel } from '@/db/models/transactions.model'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hashes } = body

    if (!hashes || !Array.isArray(hashes)) {
      return NextResponse.json(
        { error: 'Invalid request: hashes array required' },
        { status: 400 }
      )
    }

    // Check which hashes exist in the database
    const duplicates: string[] = []

    for (const hash of hashes) {
      const existing = await transactionsModel.getByHash(hash)
      if (existing) {
        duplicates.push(hash)
      }
    }

    return NextResponse.json({
      success: true,
      duplicates,
      total: hashes.length,
      duplicateCount: duplicates.length
    })
  } catch (error) {
    console.error('Error checking duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    )
  }
}