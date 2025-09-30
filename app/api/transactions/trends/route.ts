import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel } from '@/db/models/transactions.model'
import { z } from 'zod'

// Validation schema for trends query parameters
const trendsQuerySchema = z.object({
  period: z.enum(['monthly', 'yearly']).default('monthly'),
  months: z.string().optional().transform(val => {
    if (!val) return 12
    const parsed = parseInt(val)
    return isNaN(parsed) || parsed < 1 || parsed > 24 ? 12 : parsed
  }),
  unitId: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined
    const parsed = parseInt(val)
    return isNaN(parsed) ? undefined : parsed
  }),
  categoryId: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined
    const parsed = parseInt(val)
    return isNaN(parsed) ? undefined : parsed
  })
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = trendsQuerySchema.parse(Object.fromEntries(searchParams.entries()))

    const now = new Date()
    const trends: Array<{
      period: string
      income: number
      expenses: number
      net: number
      transactionCount: number
    }> = []

    if (params.period === 'monthly') {
      // Get monthly trends for the specified number of months
      for (let i = params.months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const year = date.getFullYear()
        const month = date.getMonth()
        const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0]
        const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0]

        const stats = await transactionsModel.getStats({
          dateFrom: startOfMonth,
          dateTo: endOfMonth,
          unitId: params.unitId,
          categoryId: params.categoryId,
          showIgnored: false
        })

        trends.push({
          period: `${year}-${String(month + 1).padStart(2, '0')}`,
          income: stats.totalIncome,
          expenses: Math.abs(stats.totalExpenses),
          net: stats.totalIncome - Math.abs(stats.totalExpenses),
          transactionCount: stats.totalTransactions
        })
      }
    } else {
      // Get yearly trends for the last 5 years
      const currentYear = now.getFullYear()
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i
        const startOfYear = `${year}-01-01`
        const endOfYear = `${year}-12-31`

        const stats = await transactionsModel.getStats({
          dateFrom: startOfYear,
          dateTo: endOfYear,
          unitId: params.unitId,
          categoryId: params.categoryId,
          showIgnored: false
        })

        trends.push({
          period: year.toString(),
          income: stats.totalIncome,
          expenses: Math.abs(stats.totalExpenses),
          net: stats.totalIncome - Math.abs(stats.totalExpenses),
          transactionCount: stats.totalTransactions
        })
      }
    }

    // Calculate averages
    const avgIncome = trends.reduce((sum, t) => sum + t.income, 0) / (trends.length || 1)
    const avgExpenses = trends.reduce((sum, t) => sum + t.expenses, 0) / (trends.length || 1)
    const avgNet = trends.reduce((sum, t) => sum + t.net, 0) / (trends.length || 1)

    // Find best and worst months/years
    const bestPeriod = trends.reduce((best, current) =>
      current.net > best.net ? current : best,
      trends[0] || { period: 'N/A', net: 0 }
    )

    const worstPeriod = trends.reduce((worst, current) =>
      current.net < worst.net ? current : worst,
      trends[0] || { period: 'N/A', net: 0 }
    )

    return NextResponse.json({
      period: params.period,
      trends,
      summary: {
        averageIncome: avgIncome,
        averageExpenses: avgExpenses,
        averageNet: avgNet,
        bestPeriod: bestPeriod.period,
        bestPeriodNet: bestPeriod.net,
        worstPeriod: worstPeriod.period,
        worstPeriodNet: worstPeriod.net,
        totalPeriods: trends.length
      }
    })
  } catch (error) {
    console.error('Error fetching transaction trends:', error)

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
      { error: 'Failed to fetch transaction trends' },
      { status: 500 }
    )
  }
}