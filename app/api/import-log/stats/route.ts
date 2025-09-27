import { NextResponse } from 'next/server'
import { importLogModel } from '@/db/models/import-log.model'

export async function GET() {
  try {
    const stats = await importLogModel.getImportStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching import stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch import stats' },
      { status: 500 }
    )
  }
}