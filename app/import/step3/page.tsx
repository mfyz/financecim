'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, ArrowRight, Check, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface PreviewTransaction {
  id: number
  date: string
  description: string
  amount: string
  source_category: string
  auto_category: string
  balance: string
  isDuplicate: boolean
  hasError: boolean
  errorDetails: string | null
  confidence: number
}

interface ImportStats {
  totalTransactions: number
  validTransactions: number
  errorTransactions: number
  categorizedTransactions: number
  uncategorizedTransactions: number
  duplicates: number
  totalAmount: number
  avgAmount: number
}

export default function ImportStep3Page() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showErrorsOnly, setShowErrorsOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Mock data
  const [allPreviewData] = useState<PreviewTransaction[]>(() => {
    const merchants = [
      'WALMART SUPERCENTER', 'TARGET STORE', 'AMAZON.COM', 'STARBUCKS', 'SHELL GAS STATION',
      'MCDONALDS', 'HOME DEPOT', 'COSTCO WHOLESALE', 'NETFLIX.COM', 'SPOTIFY PREMIUM',
      'VERIZON WIRELESS', 'ELECTRIC COMPANY', 'RENT PAYMENT', 'SALARY DEPOSIT', 'ATM WITHDRAWAL'
    ]
    
    const categories = [
      'Test Groceries', 'Test Gas', 'Test Restaurants', 'Test Shopping', 'Test Entertainment', 
      'Test Utilities', 'Test Rent', 'Test Salary', 'Test Transfer', 'Uncategorized'
    ]
    
    const sourceCategories = [
      'FOOD_GROCERY', 'GAS_STATION', 'RESTAURANT', 'SHOPPING_GENERAL', 'ENTERTAINMENT',
      'UTILITIES', 'RENT_HOUSING', 'PAYROLL', 'TRANSFER', 'ATM_FEE'
    ]

    const data: PreviewTransaction[] = []
    let runningBalance = 3245.67

    for (let i = 0; i < 247; i++) {
      const isError = i < 16 // First 16 have errors
      const isDeposit = Math.random() < 0.15
      const amount = isDeposit 
        ? (Math.random() * 2000 + 100).toFixed(2)
        : (-Math.random() * 200 - 5).toFixed(2)
      
      runningBalance += parseFloat(amount)
      
      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * 60))
      
      const merchant = merchants[Math.floor(Math.random() * merchants.length)]
      const category = categories[Math.floor(Math.random() * categories.length)]
      const sourceCategory = sourceCategories[Math.floor(Math.random() * sourceCategories.length)]
      
      data.push({
        id: i + 1,
        date: isError && Math.random() < 0.3 ? 'INVALID_DATE' : date.toISOString().split('T')[0],
        description: isError && Math.random() < 0.2 ? '' : merchant,
        amount: isError && Math.random() < 0.4 ? 'INVALID_AMOUNT' : amount,
        source_category: sourceCategory,
        auto_category: category,
        balance: runningBalance.toFixed(2),
        isDuplicate: Math.random() < 0.03,
        hasError: isError,
        errorDetails: isError ? 'Invalid date format or missing data' : null,
        confidence: Math.floor(Math.random() * 40) + 60
      })
    }
    
    return data
  })

  const stats: ImportStats = useMemo(() => ({
    totalTransactions: 247,
    validTransactions: 231,
    errorTransactions: 16,
    categorizedTransactions: 198,
    uncategorizedTransactions: 33,
    duplicates: 8,
    totalAmount: -2456.78,
    avgAmount: -9.95
  }), [])

  const filteredData = useMemo(() => {
    return allPreviewData.filter(transaction => {
      const matchesSearch = !searchTerm || 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.auto_category.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = !selectedCategory || 
        transaction.auto_category === selectedCategory
      
      const matchesErrorFilter = !showErrorsOnly || transaction.hasError
      
      return matchesSearch && matchesCategory && matchesErrorFilter
    })
  }, [allPreviewData, searchTerm, selectedCategory, showErrorsOnly])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentPageData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const categories = Array.from(new Set(allPreviewData.map(t => t.auto_category))).sort()

  return (
    <div className="py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link 
            href="/import/step2" 
            className="mr-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Preview Import Data</h2>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className="flex items-center">
              <Link href="/import" className="rounded-full h-10 w-10 flex items-center justify-center bg-green-500 text-white hover:bg-green-600 transition-colors">
                <Check className="w-5 h-5" />
              </Link>
              <div className="ml-2 mr-8">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Upload</div>
              </div>
            </div>
            <div className="h-1 w-16 bg-green-500"></div>
            <div className="flex items-center ml-8">
              <Link href="/import/step2" className="rounded-full h-10 w-10 flex items-center justify-center bg-green-500 text-white hover:bg-green-600 transition-colors">
                <Check className="w-5 h-5" />
              </Link>
              <div className="ml-2 mr-8">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Map Columns</div>
              </div>
            </div>
            <div className="h-1 w-16 bg-blue-500"></div>
            <div className="flex items-center ml-8">
              <div className="rounded-full h-10 w-10 flex items-center justify-center bg-blue-500 text-white">3</div>
              <div className="ml-2 mr-8">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Preview</div>
              </div>
            </div>
            <div className="h-1 w-16 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center ml-8">
              <div className="rounded-full h-10 w-10 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400">4</div>
              <div className="ml-2">
                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Complete</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transactions</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTransactions}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Valid Transactions</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.validTransactions}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Errors</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.errorTransactions}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Auto-Categorized</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.categorizedTransactions}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showErrorsOnly}
              onChange={(e) => setShowErrorsOnly(e.target.checked)}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Errors Only</span>
          </label>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredData.length} of {allPreviewData.length} transactions
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Row</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Auto Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentPageData.map((transaction) => (
                <tr key={transaction.id} className={transaction.hasError ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.hasError && transaction.date === 'INVALID_DATE' ? (
                      <span className="text-red-600 dark:text-red-400">Invalid Date</span>
                    ) : (
                      transaction.date
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                    {transaction.description || <span className="text-red-600 dark:text-red-400">Empty</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    {transaction.amount === 'INVALID_AMOUNT' ? (
                      <span className="text-red-600 dark:text-red-400">Invalid Amount</span>
                    ) : (
                      <span className={parseFloat(transaction.amount) >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                      }>
                        ${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {transaction.source_category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transaction.confidence >= 85
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        : transaction.confidence >= 70
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                    }`}>
                      {transaction.auto_category}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {transaction.confidence}% confidence
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      {transaction.hasError && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Error
                        </span>
                      )}
                      {transaction.isDuplicate && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200">
                          Duplicate
                        </span>
                      )}
                      {!transaction.hasError && !transaction.isDuplicate && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                          <Check className="w-3 h-3 mr-1" />
                          Valid
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Link
          href="/import/step2"
          className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Mapping
        </Link>
        
        <button
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center"
          onClick={() => alert('Import complete! (Step 4 implementation pending)')}
        >
          <span>Complete Import</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  )
}