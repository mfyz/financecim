import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel } from '@/db/models/transactions.model'
import { z } from 'zod'

// Validation schema for updating transactions
const updateTransactionSchema = z.object({
  sourceId: z.number().min(1).optional(),
  unitId: z.number().optional(),
  date: z.string().min(1).optional(),
  description: z.string().min(1).max(500).optional(),
  amount: z.number().optional(),
  sourceCategory: z.string().optional(),
  categoryId: z.number().optional(),
  ignore: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      )
    }

    const transaction = await transactionsModel.getById(id)
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateTransactionSchema.parse(body)

    const transaction = await transactionsModel.update(id, validatedData)

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error updating transaction:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message === 'Transaction not found') {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        )
      }

      if (error.message.includes('FOREIGN KEY')) {
        return NextResponse.json(
          { error: 'Invalid source, unit, or category reference' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      )
    }

    await transactionsModel.delete(id)

    return NextResponse.json(
      { message: 'Transaction deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting transaction:', error)

    if (error instanceof Error && error.message === 'Transaction not found') {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}