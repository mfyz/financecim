import { NextRequest, NextResponse } from 'next/server'
import { transactionsModel } from '@/db/models/transactions.model'
import { categoriesModel } from '@/db/models/categories.model'
import { z } from 'zod'

// Validation schema for spending analysis query parameters
const spendingQuerySchema = z.object({
  period: z.enum(['current_month', 'last_month', 'last_3_months', 'last_6_months', 'year_to_date', 'custom']).default('current_month'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  unitId: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined
    const parsed = parseInt(val)
    return isNaN(parsed) ? undefined : parsed
  }),
  includeSubcategories: z.string().optional().transform(val => val === 'true'),
  limit: z.string().optional().transform(val => {
    if (!val) return 10
    const parsed = parseInt(val)
    return isNaN(parsed) || parsed < 1 || parsed > 50 ? 10 : parsed
  })
})

function getDateRange(period: string, customFrom?: string, customTo?: string) {
  const now = new Date()
  let dateFrom: string
  let dateTo: string

  switch (period) {
    case 'current_month':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      break
    case 'last_month':
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
      dateTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      break
    case 'last_3_months':
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0]
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      break
    case 'last_6_months':
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      break
    case 'year_to_date':
      dateFrom = `${now.getFullYear()}-01-01`
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      break
    case 'custom':
      if (!customFrom || !customTo) {
        throw new Error('Custom period requires dateFrom and dateTo parameters')
      }
      dateFrom = customFrom
      dateTo = customTo
      break
    default:
      throw new Error('Invalid period specified')
  }

  return { dateFrom, dateTo }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = spendingQuerySchema.parse(Object.fromEntries(searchParams.entries()))

    // Get date range for the period
    const { dateFrom, dateTo } = getDateRange(params.period, params.dateFrom, params.dateTo)

    // Get all categories with their budgets
    const categories = await categoriesModel.getAllFlat()

    // Get transactions for the period
    const { data: transactions } = await transactionsModel.getAll(
      1,
      10000, // Get all transactions for the period
      'date',
      'desc',
      {
        dateFrom,
        dateTo,
        unitId: params.unitId,
        showIgnored: false
      }
    )

    // Build spending data by category
    const categorySpending = new Map<number, {
      categoryId: number
      categoryName: string
      categoryColor: string
      parentCategoryId: number | null
      monthlyBudget: number | null
      totalSpent: number
      transactionCount: number
      averageTransaction: number
      percentOfTotal: number
      budgetUtilization: number | null
      overBudget: boolean
    }>()

    // Initialize categories
    categories.forEach(cat => {
      categorySpending.set(cat.id, {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryColor: cat.color,
        parentCategoryId: cat.parentCategoryId,
        monthlyBudget: cat.monthlyBudget,
        totalSpent: 0,
        transactionCount: 0,
        averageTransaction: 0,
        percentOfTotal: 0,
        budgetUtilization: null,
        overBudget: false
      })
    })

    // Calculate total expenses and categorize spending
    let totalExpenses = 0
    let uncategorizedSpending = 0
    let uncategorizedCount = 0

    transactions.forEach(transaction => {
      // Only count expenses
      if (transaction.amount >= 0) return

      const amount = Math.abs(transaction.amount)
      totalExpenses += amount

      if (transaction.categoryId && categorySpending.has(transaction.categoryId)) {
        const catData = categorySpending.get(transaction.categoryId)!
        catData.totalSpent += amount
        catData.transactionCount++
      } else {
        uncategorizedSpending += amount
        uncategorizedCount++
      }
    })

    // Calculate aggregated values
    const spendingArray = Array.from(categorySpending.values()).map(cat => {
      if (cat.transactionCount > 0) {
        cat.averageTransaction = cat.totalSpent / cat.transactionCount
        cat.percentOfTotal = totalExpenses > 0 ? (cat.totalSpent / totalExpenses) * 100 : 0

        // Calculate budget utilization based on period
        if (cat.monthlyBudget) {
          // Parse dates properly avoiding timezone issues
          const [startYear, startMonth] = dateFrom.split('-').map(Number)
          const [endYear, endMonth] = dateTo.split('-').map(Number)

          // Calculate months between dates (inclusive)
          const monthsInPeriod = Math.max(1,
            (endYear - startYear) * 12 + (endMonth - startMonth) + 1
          )

          const periodBudget = cat.monthlyBudget * monthsInPeriod
          cat.budgetUtilization = (cat.totalSpent / periodBudget) * 100
          cat.overBudget = cat.totalSpent > periodBudget
        }
      }
      return cat
    })

    // Filter out categories with no spending and sort by total spent
    const activeCategories = spendingArray
      .filter(cat => cat.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, params.limit)

    // If including subcategories, aggregate parent totals
    let aggregatedCategories = activeCategories
    if (!params.includeSubcategories) {
      const parentTotals = new Map<number, typeof activeCategories[0]>()

      activeCategories.forEach(cat => {
        if (cat.parentCategoryId === null) {
          // Root category
          if (!parentTotals.has(cat.categoryId)) {
            parentTotals.set(cat.categoryId, { ...cat })
          } else {
            const parent = parentTotals.get(cat.categoryId)!
            parent.totalSpent += cat.totalSpent
            parent.transactionCount += cat.transactionCount
          }
        }
      })

      // Also add child category spending to parent
      activeCategories.forEach(cat => {
        if (cat.parentCategoryId !== null) {
          const parent = categories.find(c => c.id === cat.parentCategoryId)
          if (parent) {
            if (!parentTotals.has(parent.id)) {
              parentTotals.set(parent.id, {
                categoryId: parent.id,
                categoryName: parent.name,
                categoryColor: parent.color,
                parentCategoryId: parent.parentCategoryId,
                monthlyBudget: parent.monthlyBudget,
                totalSpent: cat.totalSpent,
                transactionCount: cat.transactionCount,
                averageTransaction: 0,
                percentOfTotal: 0,
                budgetUtilization: null,
                overBudget: false
              })
            } else {
              const parentData = parentTotals.get(parent.id)!
              parentData.totalSpent += cat.totalSpent
              parentData.transactionCount += cat.transactionCount
            }
          }
        }
      })

      // Recalculate aggregated values
      aggregatedCategories = Array.from(parentTotals.values()).map(cat => {
        if (cat.transactionCount > 0) {
          cat.averageTransaction = cat.totalSpent / cat.transactionCount
          cat.percentOfTotal = totalExpenses > 0 ? (cat.totalSpent / totalExpenses) * 100 : 0
        }
        return cat
      }).sort((a, b) => b.totalSpent - a.totalSpent)
    }

    // Get top spending categories
    const topCategories = aggregatedCategories.slice(0, 5)

    // Calculate savings rate (income - expenses) / income
    const { totalIncome } = await transactionsModel.getStats({
      dateFrom,
      dateTo,
      unitId: params.unitId,
      showIgnored: false
    })

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    return NextResponse.json({
      period: {
        type: params.period,
        dateFrom,
        dateTo
      },
      summary: {
        totalExpenses,
        totalIncome,
        savingsRate,
        categorizedSpending: totalExpenses - uncategorizedSpending,
        uncategorizedSpending,
        uncategorizedCount,
        categoriesWithSpending: activeCategories.length,
        totalCategories: categories.length
      },
      categories: aggregatedCategories,
      topCategories,
      budgetAnalysis: {
        overBudgetCategories: aggregatedCategories.filter(c => c.overBudget),
        withinBudgetCategories: aggregatedCategories.filter(c => c.monthlyBudget && !c.overBudget),
        noBudgetCategories: aggregatedCategories.filter(c => !c.monthlyBudget && c.totalSpent > 0)
      }
    })
  } catch (error) {
    console.error('Error fetching category spending:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.errors
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('Custom period')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch category spending analysis' },
      { status: 500 }
    )
  }
}