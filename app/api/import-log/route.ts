import { NextRequest, NextResponse } from 'next/server'
import { importLogModel } from '@/db/models/import-log.model'
import { z } from 'zod'

const ImportLogSchema = z.object({
  sourceId: z.number().int().positive(),
  fileName: z.string().optional(),
  transactionsAdded: z.number().int().min(0).default(0),
  transactionsSkipped: z.number().int().min(0).default(0),
  transactionsUpdated: z.number().int().min(0).default(0),
  status: z.enum(['success', 'partial', 'failed']),
  errorMessage: z.string().optional(),
  metadata: z.any().optional()
})

export async function GET(request: NextRequest) {
  try {
    // Check for query parameters
    const searchParams = request.nextUrl.searchParams
    const sourceId = searchParams.get('sourceId')
    const limit = searchParams.get('limit')

    if (sourceId) {
      const id = parseInt(sourceId, 10)
      if (isNaN(id)) {
        return NextResponse.json(
          { error: 'Invalid source ID' },
          { status: 400 }
        )
      }
      const logs = await importLogModel.getBySourceId(id)
      return NextResponse.json(logs)
    }

    if (limit) {
      const limitNum = parseInt(limit, 10)
      if (isNaN(limitNum) || limitNum < 1) {
        return NextResponse.json(
          { error: 'Invalid limit' },
          { status: 400 }
        )
      }
      const logs = await importLogModel.getRecentImports(limitNum)
      return NextResponse.json(logs)
    }

    const logs = await importLogModel.getAll()
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching import logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch import logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = ImportLogSchema.parse(body)

    const log = await importLogModel.create(validatedData)
    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating import log:', error)
    return NextResponse.json(
      { error: 'Failed to create import log' },
      { status: 500 }
    )
  }
}