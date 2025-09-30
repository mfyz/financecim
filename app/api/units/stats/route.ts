import { NextResponse } from 'next/server'
import { unitsModel } from '@/db/models/units.model'

export async function GET() {
  try {
    const stats = await unitsModel.getCountByStatus()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching unit stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unit stats' },
      { status: 500 }
    )
  }
}

