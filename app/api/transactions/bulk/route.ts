import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel, type BulkUpdateData } from '@/db/models/transactions.model'
import { z } from 'zod'

// Validation schema for bulk operations
const bulkUpdateSchema = z.object({
  ids: z.array(z.number()).min(1, 'At least one transaction ID is required'),
  data: z.object({
    unitId: z.number().optional(),
    categoryId: z.number().optional(),
    ignore: z.boolean().optional(),
    notes: z.string().optional(),
  }).refine(
    data => Object.keys(data).some(key => data[key as keyof typeof data] !== undefined),
    'At least one field must be provided for update'
  )
})

const bulkDeleteSchema = z.object({
  ids: z.array(z.number()).min(1, 'At least one transaction ID is required'),
})

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, data } = bulkUpdateSchema.parse(body)

    const updatedCount = await transactionsModel.bulkUpdate(ids, data)

    return NextResponse.json({
      message: `Successfully updated ${updatedCount} transaction${updatedCount === 1 ? '' : 's'}`,
      updatedCount
    })
  } catch (error) {
    console.error('Error bulk updating transactions:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('FOREIGN KEY')) {
      return NextResponse.json(
        { error: 'Invalid unit or category reference' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update transactions' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = bulkDeleteSchema.parse(body)

    const deletedCount = await transactionsModel.bulkDelete(ids)

    return NextResponse.json({
      message: `Successfully deleted ${deletedCount} transaction${deletedCount === 1 ? '' : 's'}`,
      deletedCount
    })
  } catch (error) {
    console.error('Error bulk deleting transactions:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete transactions' },
      { status: 500 }
    )
  }
}