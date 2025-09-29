import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel } from '@/db/models/transactions.model'
import { categoriesModel } from '@/db/models/categories.model'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const period = searchParams.get('period') as 'monthly' | 'yearly' || 'monthly'
    const timePeriod = searchParams.get('timePeriod') || 'current_month'
    const unitId = searchParams.get('unitId') ? Number(searchParams.get('unitId')) : undefined
    const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined

    // Fetch trends data
    const trends = await transactionsModel.getTrends(period, unitId, categoryId)

    // Fetch spending data
    const spending = await categoriesModel.getSpending(timePeriod, unitId)

    return NextResponse.json({
      trends,
      spending
    })
  } catch (error) {
    console.error('Error fetching reports data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports data' },
      { status: 500 }
    )
  }
}