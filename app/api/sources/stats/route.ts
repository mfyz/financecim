import { NextResponse } from 'next/server'
import { sourcesModel } from '@/db/models/sources.model'

export async function GET() {
  try {
    const stats = await sourcesModel.getCountByType()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching source stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch source stats' },
      { status: 500 }
    )
  }
}

