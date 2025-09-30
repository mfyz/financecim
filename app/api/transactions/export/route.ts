import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel, type TransactionFilters } from '@/db/models/transactions.model'
import { z } from 'zod'

// Reuse query parsing similar to transactions list endpoint
const querySchema = z.object({
  sortBy: z.enum(['date', 'amount', 'description', 'created_at']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  unitId: z.string().optional().transform(val => (val ? parseInt(val) : undefined)),
  sourceId: z.string().optional().transform(val => (val ? parseInt(val) : undefined)),
  categoryId: z.string().optional().transform(val => (val ? parseInt(val) : undefined)),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountMin: z.string().optional().transform(val => (val ? parseFloat(val) : undefined)),
  amountMax: z.string().optional().transform(val => (val ? parseFloat(val) : undefined)),
  showIgnored: z.string().optional().transform(val => {
    if (val === 'true') return true
    if (val === 'false') return false
    return undefined
  }),
  tags: z.string().optional().transform(val => (val ? val.split(',').map(t => t.trim()).filter(Boolean) : undefined)),
  // Optional: limit the export size to avoid accidental huge responses
  limit: z.string().optional().transform(val => (val ? Math.min(parseInt(val) || 1000, 5000) : 1000)),
})

function toCsvField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const raw = Object.fromEntries(searchParams.entries())
    const params = querySchema.parse(raw)

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

    // Fetch up to `limit` items in a single page
    const { data } = await transactionsModel.getAll(
      1,
      params.limit ?? 1000,
      params.sortBy,
      params.sortOrder,
      filters,
    )

    // Define CSV headers and map rows
    const headers = [
      'id',
      'date',
      'description',
      'amount',
      'source',
      'source_type',
      'unit',
      'category',
      'source_category',
      'ignore',
      'notes',
      'tags',
    ]

    const lines: string[] = []
    lines.push(headers.join(','))
    for (const t of data) {
      const row = [
        toCsvField(t.id),
        toCsvField(t.date),
        toCsvField(t.description),
        toCsvField(t.amount),
        toCsvField(t.source?.name ?? ''),
        toCsvField(t.source?.type ?? ''),
        toCsvField(t.unit?.name ?? ''),
        toCsvField(t.category?.name ?? ''),
        toCsvField(t.sourceCategory ?? ''),
        toCsvField(t.ignore ? 'true' : 'false'),
        toCsvField(t.notes ?? ''),
        toCsvField(t.tags ?? ''),
      ]
      lines.push(row.join(','))
    }

    const csv = lines.join('\n') + '\n'

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Disposition': 'attachment; filename="transactions_export.csv"',
      },
    })
  } catch (error) {
    console.error('Error exporting transactions CSV:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Failed to export transactions' },
      { status: 500 },
    )
  }
}

