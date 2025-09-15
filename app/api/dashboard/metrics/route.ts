import { NextResponse } from 'next/server'
import { transactionsModel } from '@/db/models/transactions.model'

export async function GET() {
  try {
    // Get current month date range
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]

    // Get overall stats (all time)
    const overallStats = await transactionsModel.getStats()

    // Get current month stats
    const monthlyStats = await transactionsModel.getStats({
      dateFrom: startOfMonth,
      dateTo: endOfMonth
    })

    // Get recent transactions (last 10)
    const recentTransactions = await transactionsModel.getAll(1, 10, 'date', 'desc')

    // Calculate account balance (sum of all non-ignored transactions)
    const accountBalance = overallStats.totalIncome - overallStats.totalExpenses

    // Get category breakdown for current month
    const categoryBreakdown = await getCategoryBreakdown(startOfMonth, endOfMonth)

    return NextResponse.json({
      accountBalance,
      monthlyIncome: monthlyStats.totalIncome,
      monthlyExpenses: monthlyStats.totalExpenses,
      totalTransactions: overallStats.totalTransactions,
      recentTransactions: recentTransactions.data.slice(0, 5), // Only show 5 most recent
      categoryBreakdown: categoryBreakdown.slice(0, 5), // Top 5 categories
      stats: {
        overall: overallStats,
        monthly: monthlyStats
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    )
  }
}

async function getCategoryBreakdown(dateFrom: string, dateTo: string) {
  const { data: transactions } = await transactionsModel.getAll(
    1,
    1000, // Get enough to analyze categories
    'amount',
    'desc',
    {
      dateFrom,
      dateTo,
      showIgnored: false // Only include non-ignored transactions
    }
  )

  // Group by category and sum amounts (only expenses)
  const categoryTotals = new Map<string, { name: string; amount: number; color: string }>()

  transactions.forEach(transaction => {
    if (transaction.amount >= 0) return // Skip income
    if (!transaction.category) return // Skip uncategorized

    const categoryKey = transaction.category.name
    const current = categoryTotals.get(categoryKey) || {
      name: transaction.category.name,
      amount: 0,
      color: transaction.category.color
    }

    current.amount += Math.abs(transaction.amount) // Convert to positive for display
    categoryTotals.set(categoryKey, current)
  })

  // Convert to array and sort by amount
  return Array.from(categoryTotals.values())
    .sort((a, b) => b.amount - a.amount)
}