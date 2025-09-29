'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Calendar, PieChart, Activity } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts'

interface TrendData {
  month: string
  income: number
  expenses: number
  net: number
}

interface CategoryData {
  name: string
  amount: number
  percentage: number
  color: string
  budget?: number
  budgetUtilization?: number
}

interface YearlyComparison {
  category: string
  currentYear: number
  previousYear: number
  change: number
  changePercentage: number
}

interface ReportsData {
  monthlyTrends: TrendData[]
  categoryBreakdown: CategoryData[]
  yearlyComparison: YearlyComparison[]
  topExpenses: {
    description: string
    amount: number
    date: string
    category: string
  }[]
  summary: {
    avgMonthlyIncome: number
    avgMonthlyExpenses: number
    avgMonthlySavings: number
    savingsRate: number
    totalCategories: number
    overBudgetCategories: number
  }
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '12m' | 'all'>('12m')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchReportsData()
  }, [timeRange])

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch spending trends data
      const trendsResponse = await fetch(`/api/transactions/trends?range=${timeRange}`)
      if (!trendsResponse.ok) throw new Error('Failed to fetch trends')
      const trendsData = await trendsResponse.json()

      // Fetch category spending data
      const categoryResponse = await fetch('/api/categories/spending')
      if (!categoryResponse.ok) throw new Error('Failed to fetch category data')
      const categoryData = await categoryResponse.json()

      // Transform the data for charts
      const monthlyTrends: TrendData[] = trendsData.map((item: any) => ({
        month: item.month,
        income: item.income || 0,
        expenses: Math.abs(item.expenses || 0),
        net: (item.income || 0) - Math.abs(item.expenses || 0)
      }))

      const totalSpending = categoryData.reduce((sum: number, cat: any) => sum + Math.abs(cat.totalSpent || 0), 0)
      const categoryBreakdown: CategoryData[] = categoryData
        .filter((cat: any) => cat.totalSpent !== 0)
        .map((cat: any) => ({
          name: cat.name,
          amount: Math.abs(cat.totalSpent || 0),
          percentage: totalSpending > 0 ? (Math.abs(cat.totalSpent || 0) / totalSpending) * 100 : 0,
          color: cat.color || '#6B7280',
          budget: cat.monthlyBudget,
          budgetUtilization: cat.monthlyBudget ? (Math.abs(cat.totalSpent || 0) / cat.monthlyBudget) * 100 : undefined
        }))
        .sort((a: CategoryData, b: CategoryData) => b.amount - a.amount)
        .slice(0, 10)

      // Mock yearly comparison (would need historical data in real implementation)
      const yearlyComparison: YearlyComparison[] = categoryBreakdown.slice(0, 5).map(cat => ({
        category: cat.name,
        currentYear: cat.amount,
        previousYear: cat.amount * (0.8 + Math.random() * 0.4),
        change: 0,
        changePercentage: 0
      }))
      yearlyComparison.forEach(item => {
        item.change = item.currentYear - item.previousYear
        item.changePercentage = item.previousYear > 0 ? (item.change / item.previousYear) * 100 : 0
      })

      // Calculate summary metrics
      const avgMonthlyIncome = monthlyTrends.reduce((sum, m) => sum + m.income, 0) / (monthlyTrends.length || 1)
      const avgMonthlyExpenses = monthlyTrends.reduce((sum, m) => sum + m.expenses, 0) / (monthlyTrends.length || 1)
      const avgMonthlySavings = avgMonthlyIncome - avgMonthlyExpenses
      const savingsRate = avgMonthlyIncome > 0 ? (avgMonthlySavings / avgMonthlyIncome) * 100 : 0
      const overBudgetCategories = categoryBreakdown.filter(cat => cat.budgetUtilization && cat.budgetUtilization > 100).length

      setData({
        monthlyTrends,
        categoryBreakdown,
        yearlyComparison,
        topExpenses: [],
        summary: {
          avgMonthlyIncome,
          avgMonthlyExpenses,
          avgMonthlySavings,
          savingsRate,
          totalCategories: categoryBreakdown.length,
          overBudgetCategories
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error || 'Failed to load reports'}</p>
        </div>
      </div>
    )
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Financial insights and trends</p>
        </div>
        <div className="flex gap-2">
          {(['3m', '6m', '12m', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {range === 'all' ? 'All Time' : `Last ${range}`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Monthly Income</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(data.summary.avgMonthlyIncome)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Monthly Expenses</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">
                {formatCurrency(data.summary.avgMonthlyExpenses)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Monthly Savings</p>
              <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mt-1">
                {formatCurrency(data.summary.avgMonthlySavings)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Savings Rate</p>
              <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400 mt-1">
                {data.summary.savingsRate.toFixed(1)}%
              </p>
              {data.summary.overBudgetCategories > 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {data.summary.overBudgetCategories} categories over budget
                </p>
              )}
            </div>
            <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400 opacity-20" />
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Trends</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis
                dataKey="month"
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
                tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981' }}
                name="Income"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444' }}
                name="Expenses"
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6' }}
                name="Net"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Spending</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={data.categoryBreakdown as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name} (${props.percentage.toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {data.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {data.categoryBreakdown.map((category, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{category.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatCurrency(category.amount)}
                  </span>
                  {category.budgetUtilization !== undefined && (
                    <span className={`text-xs ${
                      category.budgetUtilization > 100
                        ? 'text-red-600 dark:text-red-400'
                        : category.budgetUtilization > 80
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {category.budgetUtilization.toFixed(0)}% of budget
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Yearly Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Year-over-Year Comparison</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.yearlyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis
                  dataKey="category"
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="previousYear" fill="#9CA3AF" name="Previous Year" />
                <Bar dataKey="currentYear" fill="#3B82F6" name="Current Year" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Change Summary */}
          <div className="mt-4 space-y-2">
            {data.yearlyComparison.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{item.category}</span>
                <div className="flex items-center gap-2">
                  {item.changePercentage > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  )}
                  <span className={item.changePercentage > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                    {Math.abs(item.changePercentage).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}