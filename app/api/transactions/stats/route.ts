import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel, type TransactionFilters } from '@/db/models/transactions.model'
import { z } from 'zod'

// Validation schema for stats query parameters
const statsQuerySchema = z.object({
  search: z.string().optional().transform(val => val && val.trim() ? val.trim() : undefined),
  unitId: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined
    const parsed = parseInt(val)
    if (isNaN(parsed)) throw new z.ZodError([{
      code: 'custom',
      message: 'Invalid unitId - must be a number',
      path: ['unitId']
    }])
    return parsed
  }),
  sourceId: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined
    const parsed = parseInt(val)
    if (isNaN(parsed)) throw new z.ZodError([{
      code: 'custom',
      message: 'Invalid sourceId - must be a number',
      path: ['sourceId']
    }])
    return parsed
  }),
  categoryId: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined
    const parsed = parseInt(val)
    if (isNaN(parsed)) throw new z.ZodError([{
      code: 'custom',
      message: 'Invalid categoryId - must be a number',
      path: ['categoryId']
    }])
    return parsed
  }),
  dateFrom: z.string().optional().transform(val => val && val.trim() ? val.trim() : undefined),
  dateTo: z.string().optional().transform(val => val && val.trim() ? val.trim() : undefined),
  amountMin: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined
    const parsed = parseFloat(val)
    if (isNaN(parsed)) throw new z.ZodError([{
      code: 'custom',
      message: 'Invalid amountMin - must be a number',
      path: ['amountMin']
    }])
    return parsed
  }),
  amountMax: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined
    const parsed = parseFloat(val)
    if (isNaN(parsed)) throw new z.ZodError([{
      code: 'custom',
      message: 'Invalid amountMax - must be a number',
      path: ['amountMax']
    }])
    return parsed
  }),
  tags: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined
    return val.split(',').map(t => t.trim()).filter(Boolean)
  }),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParamsObject = Object.fromEntries(searchParams.entries())
    
    const params = statsQuerySchema.parse(queryParamsObject)
    
    // Build filters object, excluding undefined values
    const filters: TransactionFilters = {}
    if (params.search) filters.search = params.search
    if (params.unitId) filters.unitId = params.unitId
    if (params.sourceId) filters.sourceId = params.sourceId
    if (params.categoryId) filters.categoryId = params.categoryId
    if (params.dateFrom) filters.dateFrom = params.dateFrom
    if (params.dateTo) filters.dateTo = params.dateTo
    if (params.amountMin !== undefined) filters.amountMin = params.amountMin
    if (params.amountMax !== undefined) filters.amountMax = params.amountMax
    if (params.tags) filters.tags = params.tags

    const stats = await transactionsModel.getStats(filters)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching transaction stats:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch transaction statistics' },
      { status: 500 }
    )
  }
}