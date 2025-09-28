'use client'

import { useState, useMemo, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Check, AlertCircle, Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CryptoJS from 'crypto-js'

interface PreviewTransaction {
  id: number
  hash: string
  date: string
  description: string
  amount: string
  source_category: string
  source_name: string
  rawRow: string[]
  source_data: Record<string, any>
  isDuplicate: boolean
  hasError: boolean
  errorDetails: string | null
  status: 'clean' | 'duplicate' | 'error'
}

interface ImportStats {
  totalTransactions: number
  cleanTransactions: number
  duplicateTransactions: number
  errorTransactions: number
}

interface ColumnMapping {
  date: string
  description: string
  amount: string
  source_category: string
}

interface Source {
  id: number
  name: string
  type: 'bank' | 'credit_card' | 'manual'
}

export default function ImportStep3Page() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'clean' | 'duplicate' | 'error'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(1000)
  const [sortField, setSortField] = useState<keyof PreviewTransaction>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [previewData, setPreviewData] = useState<PreviewTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<Source | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importComplete, setImportComplete] = useState(false)
  const [importedCount, setImportedCount] = useState(0)

  useEffect(() => {
    loadImportData()
  }, [])

  const generateRowHash = (row: string[], columnMapping: ColumnMapping): string => {
    // Create a clean object with mapped data
    const cleanData = {
      date: row[parseInt(columnMapping.date)] || '',
      description: row[parseInt(columnMapping.description)] || '',
      amount: row[parseInt(columnMapping.amount)] || '',
      source_category: row[parseInt(columnMapping.source_category)] || ''
    }

    // Serialize to JSON and hash with MD5
    const jsonString = JSON.stringify(cleanData)
    return CryptoJS.MD5(jsonString).toString()
  }

  const serializeSourceData = (row: string[], headers: string[]): Record<string, any> => {
    // Create a JSON object mapping header names to row values
    const sourceData: Record<string, any> = {}

    headers.forEach((header, index) => {
      // Use header as key, with fallback for empty headers
      const key = header.trim() || `column_${index + 1}`
      sourceData[key] = row[index] || null
    })

    return sourceData
  }

  const validateTransaction = (row: string[], columnMapping: ColumnMapping): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    const date = row[parseInt(columnMapping.date)] || ''
    const description = row[parseInt(columnMapping.description)] || ''
    const amount = row[parseInt(columnMapping.amount)] || ''

    // Validate date
    if (!date || date.trim() === '') {
      errors.push('Missing date')
    } else if (isNaN(Date.parse(date))) {
      errors.push('Invalid date format')
    }

    // Validate description
    if (!description || description.trim() === '') {
      errors.push('Missing description')
    }

    // Validate amount
    if (!amount || amount.trim() === '') {
      errors.push('Missing amount')
    } else if (isNaN(parseFloat(amount))) {
      errors.push('Invalid amount format')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const loadImportData = async () => {
    try {
      setLoading(true)

      // Load CSV data from sessionStorage
      const csvDataStr = sessionStorage.getItem('csvData')
      if (!csvDataStr) {
        router.push('/import')
        return
      }

      // Load column mapping from sessionStorage
      const columnMappingStr = sessionStorage.getItem('columnMapping')
      const selectedSourceIdStr = sessionStorage.getItem('selectedSourceId')
      const reversePurchasesStr = sessionStorage.getItem('reversePurchases')

      if (!columnMappingStr || !selectedSourceIdStr) {
        router.push('/import/step2')
        return
      }

      const csvData: string[][] = JSON.parse(csvDataStr)
      const columnMapping: ColumnMapping = JSON.parse(columnMappingStr)
      const selectedSourceId = parseInt(selectedSourceIdStr)
      const reversePurchases = reversePurchasesStr ? JSON.parse(reversePurchasesStr) : false

      // Fetch source information
      let sourceInfo: any = null
      const sourceResponse = await fetch(`/api/sources/${selectedSourceId}`)
      if (sourceResponse.ok) {
        const sourceData = await sourceResponse.json()
        sourceInfo = sourceData.success ? sourceData.data : null
        setSource(sourceInfo)
      }

      // Process data rows (skip header)
      const headers = csvData[0]
      const dataRows = csvData.slice(1)
      const processedData: PreviewTransaction[] = []
      const hashCounts = new Map<string, number>()

      // First pass: generate hashes and count duplicates
      dataRows.forEach((row, index) => {
        const hash = generateRowHash(row, columnMapping)
        hashCounts.set(hash, (hashCounts.get(hash) || 0) + 1)
      })

      // Second pass: create transaction objects with duplicate detection
      dataRows.forEach((row, index) => {
        const hash = generateRowHash(row, columnMapping)
        const validation = validateTransaction(row, columnMapping)
        const isDuplicate = (hashCounts.get(hash) || 0) > 1
        const sourceData = serializeSourceData(row, headers)

        let status: 'clean' | 'duplicate' | 'error' = 'clean'
        if (!validation.isValid) {
          status = 'error'
        } else if (isDuplicate) {
          status = 'duplicate'
        }

        let amount = row[parseInt(columnMapping.amount)] || ''

        // Apply amount reversal if enabled
        if (reversePurchases && amount) {
          const numAmount = parseFloat(amount)
          if (!isNaN(numAmount)) {
            amount = (-numAmount).toString()
          }
        }

        processedData.push({
          id: index + 1,
          hash,
          date: row[parseInt(columnMapping.date)] || '',
          description: row[parseInt(columnMapping.description)] || '',
          amount: amount,
          source_category: row[parseInt(columnMapping.source_category)] || '',
          source_name: 'Loading...', // Will be updated after source is fetched
          rawRow: row,
          source_data: sourceData,
          isDuplicate,
          hasError: !validation.isValid,
          errorDetails: validation.errors.length > 0 ? validation.errors.join(', ') : null,
          status
        })
      })

      setPreviewData(processedData)

      // Update source names after source info is fetched
      if (sourceInfo) {
        const updatedData = processedData.map(transaction => ({
          ...transaction,
          source_name: sourceInfo.name
        }))
        setPreviewData(updatedData)
      }
    } catch (error) {
      console.error('Error loading import data:', error)
      router.push('/import')
    } finally {
      setLoading(false)
    }
  }

  const handleImportConfirm = async () => {
    setShowConfirmModal(false)
    setIsImporting(true)
    setImportProgress(0)
    setImportedCount(0)

    try {
      // Filter out transactions with errors and duplicates
      const validTransactions = previewData.filter(t => !t.hasError && !t.isDuplicate)
      const total = validTransactions.length
      let successCount = 0

      // Process transactions in batches for better performance
      const batchSize = 10
      for (let i = 0; i < total; i += batchSize) {
        const batch = validTransactions.slice(i, Math.min(i + batchSize, total))

        // Create transaction objects for this batch
        const transactionBatch = batch.map(transaction => ({
          date: new Date(transaction.date).toISOString(),
          description: transaction.description,
          amount: parseFloat(transaction.amount),
          source_id: parseInt(sessionStorage.getItem('selectedSourceId') || '0'),
          category_id: null, // Will be auto-categorized later
          unit_id: 1, // Default unit, should be from user profile
          source_data: transaction.source_data || {},
          hash: transaction.hash
        }))

        // Send batch to API
        const response = await fetch('/api/transactions/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ transactions: transactionBatch })
        })

        if (!response.ok) {
          throw new Error(`Import failed: ${response.statusText}`)
        }

        const result = await response.json()
        successCount += result.imported || batch.length

        // Update progress
        const progress = ((i + batch.length) / total) * 100
        setImportProgress(Math.min(progress, 100))
        setImportedCount(Math.min(i + batch.length, total))

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setImportComplete(true)
      setIsImporting(false)
      setImportedCount(successCount)

      // Clear session storage after successful import
      sessionStorage.removeItem('csvData')
      sessionStorage.removeItem('columnMapping')
      sessionStorage.removeItem('selectedSourceId')
      sessionStorage.removeItem('reversePurchases')

    } catch (error) {
      console.error('Import failed:', error)
      setIsImporting(false)
      alert('Import failed. Please try again.')
    }
  }

  const stats: ImportStats = useMemo(() => {
    const total = previewData.length
    const clean = previewData.filter(t => t.status === 'clean').length
    const duplicates = previewData.filter(t => t.status === 'duplicate').length
    const errors = previewData.filter(t => t.status === 'error').length

    return {
      totalTransactions: total,
      cleanTransactions: clean,
      duplicateTransactions: duplicates,
      errorTransactions: errors
    }
  }, [previewData])

  const handleSort = (field: keyof PreviewTransaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedData = useMemo(() => {
    let filtered = previewData.filter(transaction => {
      const matchesSearch = !searchTerm ||
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.source_category.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter

      return matchesSearch && matchesStatus
    })

    // Sort the filtered data
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // Handle different data types
      if (sortField === 'amount') {
        aValue = parseFloat(a.amount) || 0
        bValue = parseFloat(b.amount) || 0
      } else if (sortField === 'date') {
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue !== null && bValue !== null) {
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })

    return filtered
  }, [previewData, searchTerm, statusFilter, sortField, sortDirection])

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentPageData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage)

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading import preview...</p>
        </div>
      </div>
    )
  }

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
        <button
          onClick={() => setStatusFilter('all')}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
            statusFilter === 'all' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transactions</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTransactions}</div>
        </button>
        <button
          onClick={() => setStatusFilter('clean')}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
            statusFilter === 'clean' ? 'ring-2 ring-green-500' : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Clean</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.cleanTransactions}</div>
        </button>
        <button
          onClick={() => setStatusFilter('duplicate')}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
            statusFilter === 'duplicate' ? 'ring-2 ring-orange-500' : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Duplicates</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.duplicateTransactions}</div>
        </button>
        <button
          onClick={() => setStatusFilter('error')}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
            statusFilter === 'error' ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Errors</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.errorTransactions}</div>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'clean' | 'duplicate' | 'error')}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="clean">Clean</option>
            <option value="duplicate">Duplicates</option>
            <option value="error">Errors</option>
          </select>

          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            Showing {filteredAndSortedData.length} of {previewData.length} transactions
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    Row
                    {sortField === 'id' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    {sortField === 'date' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center">
                    Description
                    {sortField === 'description' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Amount
                    {sortField === 'amount' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source Category</th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentPageData.map((transaction) => (
                <tr key={transaction.id} className={
                  transaction.status === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                  transaction.status === 'duplicate' ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                }>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.hasError && (!transaction.date || isNaN(Date.parse(transaction.date))) ? (
                      <span className="text-red-600 dark:text-red-400">Invalid Date</span>
                    ) : (
                      transaction.date
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-md">
                    <div className="break-words">
                      {transaction.description || <span className="text-red-600 dark:text-red-400">Empty</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">
                    {transaction.hasError && isNaN(parseFloat(transaction.amount)) ? (
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{transaction.source_name}</span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {source?.type.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {transaction.source_category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      {transaction.status === 'error' && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200" title={transaction.errorDetails || 'Error'}>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Error
                        </span>
                      )}
                      {transaction.status === 'duplicate' && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200" title={`Hash: ${transaction.hash.substring(0, 8)}...`}>
                          Duplicate
                        </span>
                      )}
                      {transaction.status === 'clean' && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                          <Check className="w-3 h-3 mr-1" />
                          Clean
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
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
          onClick={() => setShowConfirmModal(true)}
        >
          <span>Complete Import</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-orange-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Import
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to import {stats.cleanTransactions} transactions? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportConfirm}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Importing Transactions
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {importedCount} of {stats.cleanTransactions} transactions imported
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {Math.round(importProgress)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {importComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Import Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Successfully imported {importedCount} transactions to your account.
              </p>
              <div className="flex space-x-3">
                <Link
                  href="/"
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-center"
                >
                  View Dashboard
                </Link>
                <Link
                  href="/import"
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors text-center"
                  onClick={() => setImportComplete(false)}
                >
                  Import More
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}