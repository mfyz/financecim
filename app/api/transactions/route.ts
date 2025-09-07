import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel, type TransactionFilters } from '@/db/models/transactions.model'
import { z } from 'zod'

// Validation schema for creating transactions
const createTransactionSchema = z.object({
  sourceId: z.number().min(1, 'Source is required'),
  unitId: z.number().optional(),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  amount: z.number(),
  sourceCategory: z.string().optional(),
  categoryId: z.number().optional(),
  ignore: z.boolean().optional().default(false),
  notes: z.string().optional(),
  tags: z.string().optional(),
})

// Validation schema for query parameters
const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 50, 200) : 50),
  sortBy: z.enum(['date', 'amount', 'description', 'created_at']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  unitId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  sourceId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  categoryId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountMin: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  amountMax: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  showIgnored: z.string().optional().transform(val => {
    if (val === 'true') return true
    if (val === 'false') return false
    return undefined
  }),
  tags: z.string().optional().transform(val => val ? val.split(',').map(t => t.trim()).filter(Boolean) : undefined),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParamsObject = Object.fromEntries(searchParams.entries())
    
    const params = querySchema.parse(queryParamsObject)
    
    const filters: TransactionFilters = {
      search: params.search,
      unitId: params.unitId,
      sourceId: params.sourceId,
      categoryId: params.categoryId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      amountMin: params.amountMin,
      amountMax: params.amountMax,
      showIgnored: params.showIgnored,
      tags: params.tags,
    }

    const result = await transactionsModel.getAll(
      params.page,
      params.limit,
      params.sortBy,
      params.sortOrder,
      filters
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createTransactionSchema.parse(body)

    const transaction = await transactionsModel.create(validatedData)

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)

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
        { error: 'Invalid source, unit, or category reference' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}