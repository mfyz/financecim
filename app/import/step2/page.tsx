'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Check, AlertCircle, Eye, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ColumnMapping {
  date: string
  description: string
  amount: string
  source_category: string
}

interface ValidationError {
  field: string
  message: string
}

interface Source {
  id: number
  name: string
  type: 'bank' | 'credit_card' | 'manual'
  createdAt: string
  updatedAt: string
}

// Configuration for smart header matching
const headerMappingConfig = {
  date: [
    'date', 'transaction date', 'posted date', 'effective date', 'trans date',
    'time', 'timestamp', 'date posted', 'settlement date', 'booking date'
  ],
  description: [
    'description', 'desc', 'merchant', 'payee', 'transaction description',
    'details', 'memo', 'reference', 'vendor', 'transaction details'
  ],
  amount: [
    'amount', 'debit', 'credit', 'transaction amount', 'net amount',
    'total', 'sum', 'value', 'charge', 'payment', 'amount (usd)'
  ],
  source_category: [
    'category', 'type', 'classification', 'class', 'merchant category',
    'transaction type', 'trans type', 'category code', 'mcc'
  ]
}


export default function ImportStep2Page() {
  const router = useRouter()
  const [csvData, setCsvData] = useState<string[][]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    date: '',
    description: '',
    amount: '',
    source_category: ''
  })
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [previewData, setPreviewData] = useState<{[key: string]: string | number | string[]}[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string>('')
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [checkingStep1, setCheckingStep1] = useState(true)
  const [reversePurchases, setReversePurchases] = useState(false)
  const [showReverseSuggestion, setShowReverseSuggestion] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [columnWidths, setColumnWidths] = useState<{[key: number]: 'narrow' | 'medium' | 'wide' | 'wider'}>({})

  useEffect(() => {
    fetchSources()
    loadCsvDataFromStorage()
    // Load saved state first
    loadSavedState()

    // Mark as initialized after loading saved state
    setIsInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-detect columns when CSV data changes and no mapping exists
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // Only auto-detect if no columns are mapped yet
      if (!columnMapping.date && !columnMapping.description && !columnMapping.amount) {
        autoDetectColumns()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csvData])

  useEffect(() => {
    updatePreview()
    validateMapping()
    analyzeAmountData()
    analyzeColumnWidths() // Re-analyze whenever data changes

    // Only save to sessionStorage after initial load is complete
    if (isInitialized) {
      // Save to sessionStorage whenever mapping or source changes
      if (columnMapping.date || columnMapping.description || columnMapping.amount) {
        sessionStorage.setItem('columnMapping', JSON.stringify(columnMapping))
      }
      if (selectedSourceId) {
        sessionStorage.setItem('selectedSourceId', selectedSourceId)
      }
      sessionStorage.setItem('reversePurchases', JSON.stringify(reversePurchases))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnMapping, selectedSourceId, reversePurchases, isInitialized, csvData])

  const fetchSources = async () => {
    try {
      setSourcesLoading(true)
      const response = await fetch('/api/sources')

      if (!response.ok) {
        throw new Error('Failed to fetch sources')
      }

      const response_data = await response.json()
      // Extract the actual sources array from the API response
      const sources_array = response_data.success && response_data.data ? response_data.data : []
      // Ensure data is an array
      setSources(Array.isArray(sources_array) ? sources_array : [])
    } catch (error) {
      console.error('Error fetching sources:', error)
      setSources([])
    } finally {
      setSourcesLoading(false)
    }
  }

  const loadCsvDataFromStorage = () => {
    try {
      const storedData = sessionStorage.getItem('csvData')
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        setCsvData(parsedData)
        setCheckingStep1(false)
      } else {
        // No CSV data found, redirect to step 1
        router.push('/import')
        return
      }
    } catch (error) {
      console.error('Error loading CSV data from storage:', error)
      // If there's an error parsing data, redirect to step 1
      router.push('/import')
      return
    }
  }

  const loadSavedState = () => {
    try {
      // Load saved column mapping
      const savedColumnMapping = sessionStorage.getItem('columnMapping')
      if (savedColumnMapping) {
        const parsedMapping = JSON.parse(savedColumnMapping)
        setColumnMapping(parsedMapping)
      }

      // Load saved source selection
      const savedSourceId = sessionStorage.getItem('selectedSourceId')
      if (savedSourceId) {
        setSelectedSourceId(savedSourceId)
      }

      // Load saved reverse purchases setting
      const savedReversePurchases = sessionStorage.getItem('reversePurchases')
      if (savedReversePurchases) {
        setReversePurchases(JSON.parse(savedReversePurchases))
      }
    } catch (error) {
      console.error('Error loading saved state:', error)
    }
  }

  const analyzeAmountData = () => {
    if (!columnMapping.amount || csvData.length <= 1) return

    try {
      const amountColumnIndex = parseInt(columnMapping.amount)
      const dataRows = csvData.slice(1) // Skip header

      let positiveCount = 0
      let negativeCount = 0
      let validAmountCount = 0

      dataRows.forEach(row => {
        const amountStr = row[amountColumnIndex]
        if (amountStr && amountStr.trim()) {
          const amount = parseFloat(amountStr)
          if (!isNaN(amount) && amount !== 0) {
            validAmountCount++
            if (amount > 0) {
              positiveCount++
            } else {
              negativeCount++
            }
          }
        }
      })

      // If more than 70% of amounts are positive, suggest reversing
      if (validAmountCount > 0 && (positiveCount / validAmountCount) > 0.7) {
        setShowReverseSuggestion(true)
      } else {
        setShowReverseSuggestion(false)
      }
    } catch (error) {
      console.error('Error analyzing amount data:', error)
    }
  }

  const analyzeColumnWidths = () => {
    if (!csvData || csvData.length <= 1) return

    const widths: {[key: number]: 'narrow' | 'medium' | 'wide' | 'wider'} = {}
    const headers = csvData[0]

    headers.forEach((header, index) => {
      // Calculate average and max content length for this column
      let totalLength = header.length
      let maxLength = header.length
      let sampleCount = 1

      // Sample first 20 rows to get a good representation
      const sampleRows = csvData.slice(1, Math.min(21, csvData.length))

      sampleRows.forEach(row => {
        if (row[index]) {
          const cellLength = row[index].length
          totalLength += cellLength
          maxLength = Math.max(maxLength, cellLength)
          sampleCount++
        }
      })

      const avgLength = totalLength / sampleCount

      // Determine width category based on content analysis
      if (maxLength >= 40 || avgLength >= 25) {
        widths[index] = 'wider'  // Very long content like descriptions
      } else if (maxLength >= 25 || avgLength >= 15) {
        widths[index] = 'wide'   // Long content like merchant names
      } else if (maxLength >= 12 || avgLength >= 8) {
        widths[index] = 'medium' // Medium content like categories
      } else {
        widths[index] = 'narrow' // Short content like dates, amounts
      }

      console.log(`Column ${index} (${header}): maxLength=${maxLength}, avgLength=${avgLength.toFixed(1)}, width=${widths[index]}`)
    })

    console.log('All CSV headers:', csvData[0])
    console.log('Column widths mapping:', widths)

    setColumnWidths(widths)
  }

  const getColumnWidth = (index: number): string => {
    const widthType = columnWidths[index] || 'medium'

    switch (widthType) {
      case 'narrow': return '120px'   // Short content like dates, amounts
      case 'medium': return '160px'   // Medium content
      case 'wide': return '280px'     // Long content
      case 'wider': return '500px'    // Very long content like descriptions
      default: return '160px'
    }
  }

  const autoDetectColumns = () => {
    if (!csvData || csvData.length === 0) return

    const headers = csvData[0]
    console.log('Auto-detecting columns for headers:', headers)

    const mapping: ColumnMapping = {
      date: '',
      description: '',
      amount: '',
      source_category: ''
    }

    // First pass: exact matches (highest priority)
    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase().trim()

      Object.entries(headerMappingConfig).forEach(([fieldType, variations]) => {
        variations.forEach(variation => {
          if (headerLower === variation.toLowerCase()) {
            if (!mapping[fieldType as keyof ColumnMapping]) { // Only set if not already mapped
              mapping[fieldType as keyof ColumnMapping] = index.toString()
            }
          }
        })
      })
    })

    // Second pass: partial matches for unmapped fields
    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase().trim()

      Object.entries(headerMappingConfig).forEach(([fieldType, variations]) => {
        variations.forEach(variation => {
          if (headerLower.includes(variation.toLowerCase()) && headerLower !== variation.toLowerCase()) {
            if (!mapping[fieldType as keyof ColumnMapping]) { // Only set if not already mapped
              mapping[fieldType as keyof ColumnMapping] = index.toString()
            }
          }
        })
      })
    })

    console.log('Auto-detected mapping:', mapping)
    setColumnMapping(mapping)
  }

  const updatePreview = () => {
    const preview = csvData.slice(1, 6).map((row, index) => {
      let amount = row[parseInt(columnMapping.amount)] || ''

      // Apply amount reversal if enabled
      if (reversePurchases && amount) {
        const numAmount = parseFloat(amount)
        if (!isNaN(numAmount)) {
          amount = (-numAmount).toString()
        }
      }

      return {
        rowIndex: index + 1,
        date: row[parseInt(columnMapping.date)] || '',
        description: row[parseInt(columnMapping.description)] || '',
        amount: amount,
        source_category: row[parseInt(columnMapping.source_category)] || '',
        raw_row: row
      }
    })

    setPreviewData(preview)
  }

  const validateMapping = () => {
    const errors: ValidationError[] = []

    if (!selectedSourceId) {
      errors.push({ field: 'source', message: 'Source selection is required' })
    }
    if (!columnMapping.date) {
      errors.push({ field: 'date', message: 'Date column is required' })
    }
    if (!columnMapping.description) {
      errors.push({ field: 'description', message: 'Description column is required' })
    }
    if (!columnMapping.amount) {
      errors.push({ field: 'amount', message: 'Amount column is required' })
    }

    setValidationErrors(errors)
  }

  const handleColumnMappingChange = (columnIndex: number, mappingType: string) => {
    // Clear any existing mapping for this type
    const newMapping = { ...columnMapping }

    // If setting to empty, just clear it
    if (mappingType === '') {
      // Find which field was mapped to this column and clear it
      Object.entries(columnMapping).forEach(([key, value]) => {
        if (value === columnIndex.toString()) {
          newMapping[key as keyof ColumnMapping] = ''
        }
      })
    } else {
      // Set the new mapping
      newMapping[mappingType as keyof ColumnMapping] = columnIndex.toString()
    }

    setColumnMapping(newMapping)
  }

  const canProceedToStep3 = () => {
    return validationErrors.length === 0 &&
           selectedSourceId &&
           columnMapping.date &&
           columnMapping.description &&
           columnMapping.amount
  }

  // Show loading while checking if step 1 is completed
  if (checkingStep1) {
    return (
      <div className="py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking import progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link 
            href="/import" 
            className="mr-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Map CSV Columns</h2>
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
            <div className="h-1 w-16 bg-blue-500"></div>
            <div className="flex items-center ml-8">
              <div className="rounded-full h-10 w-10 flex items-center justify-center bg-blue-500 text-white">2</div>
              <div className="ml-2 mr-8">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Map Columns</div>
              </div>
            </div>
            <div className="h-1 w-16 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center ml-8">
              <Link href="/import/step3" className="rounded-full h-10 w-10 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">3</Link>
              <div className="ml-2 mr-8">
                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Preview</div>
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

      {/* Import Configuration */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Import Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Source *
              </label>
              {sourcesLoading ? (
                <div className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  Loading sources...
                </div>
              ) : (
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white ${
                    validationErrors.some(e => e.field === 'source')
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                >
                  <option value="">-- Select a source --</option>
                  {Array.isArray(sources) && sources.map((source) => (
                    <option key={source.id} value={source.id.toString()}>
                      {source.name} ({source.type.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              )}
              {validationErrors.find(e => e.field === 'source') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.find(e => e.field === 'source')?.message}
                </p>
              )}
            </div>

            {/* File Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                File Information
              </label>
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                <div>Rows: {csvData.length - 1} transactions</div>
                <div>Columns: {csvData[0]?.length || 0} fields</div>
              </div>
            </div>
          </div>

          {/* Amount Processing Options */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={reversePurchases}
                onChange={(e) => setReversePurchases(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Purchases are noted with positive amounts
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Check this if your bank shows expenses as positive numbers. We'll reverse them to show expenses as negative.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Amount Reversal Suggestion Banner */}
      {showReverseSuggestion && !reversePurchases && (
        <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">
                Most amounts appear to be positive
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                It looks like your bank shows expenses as positive numbers. For consistency, we recommend reversing amounts so expenses show as negative in the system.
              </p>
              <button
                onClick={() => setReversePurchases(true)}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded transition-colors"
              >
                Enable Amount Reversal
              </button>
            </div>
            <button
              onClick={() => setShowReverseSuggestion(false)}
              className="p-1 text-orange-400 hover:text-orange-600 dark:hover:text-orange-200 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CSV File Contents with Inline Column Mapping */}
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              CSV File Contents & Column Mapping
            </h3>
            {validationErrors.length > 0 && (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">Missing required mappings</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table
              className="text-sm"
              style={{
                minWidth: `${80 + csvData[0].reduce((sum, _, index) => {
                  const width = parseInt(getColumnWidth(index))
                  return sum + width
                }, 0)}px`,
                tableLayout: 'fixed'
              }}
            >
              <thead>
                {/* Original Header Row */}
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase border-r border-gray-200 dark:border-gray-600"
                    style={{ width: '80px' }}
                  >
                    Original
                  </th>
                  {csvData[0].map((header, index) => {
                    const mappedTo = Object.entries(columnMapping).find(([_, value]) => value === index.toString())?.[0] || ''
                    const isMapper = Object.values(columnMapping).includes(index.toString())

                    return (
                      <th
                        key={index}
                        className={`px-3 py-3 text-left text-xs font-semibold ${
                          isMapper
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'text-gray-900 dark:text-white'
                        }`}
                        style={{
                          width: getColumnWidth(index)
                        }}
                      >
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis" title={header}>
                          {header}
                        </div>
                      </th>
                    )
                  })}
                </tr>

                {/* Map To Row with Dropdowns */}
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600"
                    style={{ width: '80px' }}
                  >
                    Map To
                  </th>
                  {csvData[0].map((_, index) => {
                    const mappedTo = Object.entries(columnMapping).find(([_, value]) => value === index.toString())?.[0] || ''
                    const isRequired = ['date', 'description', 'amount'].includes(mappedTo)
                    const isMapper = Object.values(columnMapping).includes(index.toString())

                    return (
                      <td
                        key={index}
                        className={`px-3 py-3 ${
                          isMapper
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        <select
                          value={mappedTo}
                          onChange={(e) => handleColumnMappingChange(index, e.target.value)}
                          className={`w-full text-xs border rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            isMapper
                              ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                          } dark:text-white`}
                        >
                          <option value="">-- Not mapped --</option>
                          <option value="date">📅 Date *</option>
                          <option value="description">📝 Description *</option>
                          <option value="amount">💰 Amount *</option>
                          <option value="source_category">🏷️ Source Category</option>
                        </select>
                      </td>
                    )
                  })}
                </tr>
              </thead>

              {/* Data rows */}
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {csvData.slice(1, 11).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td
                      className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono border-r border-gray-200 dark:border-gray-600"
                      style={{ width: '80px' }}
                    >
                      {rowIndex + 2}
                    </td>
                    {row.map((cell, cellIndex) => {
                      const isMapper = Object.values(columnMapping).includes(cellIndex.toString())
                      const isLongContent = cell && cell.length > 30

                      return (
                        <td
                          key={cellIndex}
                          className={`px-3 py-2 text-gray-900 dark:text-white ${
                            isMapper
                              ? 'bg-blue-50/50 dark:bg-blue-900/10'
                              : ''
                          }`}
                          style={{
                            width: getColumnWidth(cellIndex)
                          }}
                        >
                          <div className="break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }} title={cell}>
                            {cell}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {csvData.length > 11 && (
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              Showing first 10 data rows of {csvData.length - 1} total rows
            </div>
          )}
        </div>

        {/* Preview Mapped Data */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Preview Mapped Data
          </h3>

          <div className="overflow-x-auto">
            <table
              className="text-sm"
              style={{
                minWidth: '100%',
                tableLayout: 'fixed'
              }}
            >
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" style={{ width: '140px' }}>Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" style={{ width: getColumnWidth(parseInt(columnMapping.description) || 1) }}>Description</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" style={{ width: '120px' }}>Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" style={{ width: '160px' }}>Source Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {previewData.map((row, index) => (
                  <tr key={index} className="text-sm">
                    <td className="px-3 py-2 text-gray-900 dark:text-white" style={{ width: '140px' }}>{row.date}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white" style={{ width: getColumnWidth(parseInt(columnMapping.description) || 1) }}>
                      <div className="break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {row.description}
                      </div>
                    </td>
                    <td className={`px-3 py-2 font-semibold text-right ${
                      row.amount && !isNaN(parseFloat(String(row.amount)))
                        ? (parseFloat(String(row.amount)) >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400')
                        : 'text-gray-400 dark:text-gray-500'
                    }`} style={{ width: '120px' }}>
                      {row.amount && !isNaN(parseFloat(String(row.amount)))
                        ? `$${Math.abs(parseFloat(String(row.amount))).toFixed(2)}`
                        : ''}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400" style={{ width: '160px' }}>{row.source_category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between items-center">
        <Link
          href="/import"
          className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Link>
        
        <Link
          href={canProceedToStep3() ? '/import/step3' : '#'}
          className={`px-6 py-3 text-white rounded-lg transition-colors flex items-center ${
            canProceedToStep3() 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed pointer-events-none'
          }`}
        >
          <span>Next: Preview Data</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    </div>
  )
}