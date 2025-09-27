import { NextRequest, NextResponse } from 'next/server'
import { importLogModel } from '@/db/models/import-log.model'
import { z } from 'zod'

const UpdateImportLogSchema = z.object({
  sourceId: z.number().int().positive().optional(),
  fileName: z.string().optional(),
  transactionsAdded: z.number().int().min(0).optional(),
  transactionsSkipped: z.number().int().min(0).optional(),
  transactionsUpdated: z.number().int().min(0).optional(),
  status: z.enum(['success', 'partial', 'failed']).optional(),
  errorMessage: z.string().optional(),
  metadata: z.any().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const logId = parseInt(id, 10)

    if (isNaN(logId)) {
      return NextResponse.json(
        { error: 'Invalid log ID' },
        { status: 400 }
      )
    }

    const log = await importLogModel.getById(logId)

    if (!log) {
      return NextResponse.json(
        { error: 'Import log not found' },
        { status: 404 }
      )
    }

    // Parse metadata if it's a string
    if (log.metadata && typeof log.metadata === 'string') {
      try {
        log.metadata = JSON.parse(log.metadata)
      } catch {
        // Keep as string if parsing fails
      }
    }

    return NextResponse.json(log)
  } catch (error) {
    console.error('Error fetching import log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch import log' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const logId = parseInt(id, 10)

    if (isNaN(logId)) {
      return NextResponse.json(
        { error: 'Invalid log ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateImportLogSchema.parse(body)

    const log = await importLogModel.update(logId, validatedData)

    if (!log) {
      return NextResponse.json(
        { error: 'Import log not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(log)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating import log:', error)
    return NextResponse.json(
      { error: 'Failed to update import log' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const logId = parseInt(id, 10)

    if (isNaN(logId)) {
      return NextResponse.json(
        { error: 'Invalid log ID' },
        { status: 400 }
      )
    }

    const deleted = await importLogModel.delete(logId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Import log not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Import log deleted successfully' })
  } catch (error) {
    console.error('Error deleting import log:', error)
    return NextResponse.json(
      { error: 'Failed to delete import log' },
      { status: 500 }
    )
  }
}