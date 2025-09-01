'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Check, AlertCircle, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import Link from 'next/link'

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

interface AutoDetection {
  column: number
  confidence: number
  reason: string
}

interface MappingTemplate {
  name: string
  mapping: ColumnMapping
}

const mockCsvData = [
  ['Date', 'Description', 'Amount', 'Category', 'Balance', 'Reference', 'Type'],
  ['2024-01-20', 'WALMART SUPERCENTER #1234', '-125.43', 'FOOD_GROCERY', '2345.67', 'TXN001', 'PURCHASE'],
  ['2024-01-19', 'SHELL GAS STATION #5678', '-45.00', 'GAS_STATION', '2470.67', 'TXN002', 'PURCHASE'],
  ['2024-01-19', 'STARBUCKS STORE #9012', '-6.75', 'RESTAURANT', '2515.67', 'TXN003', 'PURCHASE'],
  ['2024-01-18', 'TARGET STORE #3456', '-89.23', 'SHOPPING_GENERAL', '2522.42', 'TXN004', 'PURCHASE'],
  ['2024-01-18', 'NETFLIX.COM MONTHLY', '-15.99', 'ENTERTAINMENT', '2611.65', 'TXN005', 'SUBSCRIPTION'],
  ['2024-01-17', 'PAYCHECK DEPOSIT', '2500.00', 'INCOME', '2127.64', 'TXN006', 'DEPOSIT']
]

const mappingTemplates: MappingTemplate[] = [
  { name: 'Test Chase Bank Standard', mapping: { date: '0', description: '1', amount: '2', source_category: '3' } },
  { name: 'Test Capital One Export', mapping: { date: '0', description: '1', amount: '4', source_category: '2' } },
  { name: 'Test Wells Fargo CSV', mapping: { date: '1', description: '2', amount: '3', source_category: '5' } }
]

export default function ImportStep2Page() {
  const [csvData] = useState(mockCsvData)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    date: '',
    description: '',
    amount: '',
    source_category: ''
  })
  const [autoDetection, setAutoDetection] = useState<Record<string, AutoDetection>>({})
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [saveMappingName, setSaveMappingName] = useState('')
  const [previewData, setPreviewData] = useState<any[]>([])

  useEffect(() => {
    autoDetectColumns()
  }, [])

  useEffect(() => {
    updatePreview()
    validateMapping()
  }, [columnMapping])

  const autoDetectColumns = () => {
    const headers = csvData[0]
    const sampleData = csvData.slice(1, 4)
    const detection: Record<string, AutoDetection> = {}
    const mapping: ColumnMapping = {
      date: '',
      description: '',
      amount: '',
      source_category: ''
    }

    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase()
      const columnData = sampleData.map(row => row[index]).join(' ').toLowerCase()
      
      // Date detection
      if (headerLower.includes('date') || headerLower.includes('time')) {
        detection.date = { column: index, confidence: 95, reason: `Header contains '${header}'` }
        mapping.date = index.toString()
      }
      // Description detection
      else if (headerLower.includes('desc') || headerLower.includes('merchant') || headerLower.includes('payee')) {
        detection.description = { column: index, confidence: 90, reason: `Header contains '${header}'` }
        mapping.description = index.toString()
      }
      // Amount detection
      else if (headerLower.includes('amount') || headerLower.includes('debit') || headerLower.includes('credit')) {
        detection.amount = { column: index, confidence: 88, reason: `Header contains '${header}'` }
        mapping.amount = index.toString()
      }
      // Category detection
      else if (headerLower.includes('categ') || headerLower.includes('type') || headerLower.includes('class')) {
        detection.source_category = { column: index, confidence: 75, reason: `Header contains '${header}'` }
        mapping.source_category = index.toString()
      }
    })

    setAutoDetection(detection)
    setColumnMapping(mapping)
  }

  const updatePreview = () => {
    const preview = csvData.slice(1, 6).map((row, index) => ({
      rowIndex: index + 1,
      date: row[parseInt(columnMapping.date)] || '',
      description: row[parseInt(columnMapping.description)] || '',
      amount: row[parseInt(columnMapping.amount)] || '',
      source_category: row[parseInt(columnMapping.source_category)] || '',
      auto_category: getAutoCategory(row[parseInt(columnMapping.description)] || ''),
      raw_row: row
    }))
    
    setPreviewData(preview)
  }

  const validateMapping = () => {
    const errors: ValidationError[] = []
    
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

  const getAutoCategory = (description: string): string => {
    const desc = description.toUpperCase()
    if (desc.includes('WALMART')) return 'Test Groceries'
    if (desc.includes('SHELL') || desc.includes('GAS')) return 'Test Gas'
    if (desc.includes('STARBUCKS')) return 'Test Restaurants'
    if (desc.includes('TARGET')) return 'Test Shopping'
    if (desc.includes('NETFLIX')) return 'Test Entertainment'
    if (desc.includes('AMAZON')) return 'Test Shopping'
    if (desc.includes('PAYCHECK') || desc.includes('SALARY')) return 'Income'
    return 'Uncategorized'
  }

  const applyTemplate = (template: MappingTemplate) => {
    setColumnMapping({ ...template.mapping })
    setSelectedTemplate(template.name)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 dark:text-green-400'
    if (confidence >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const canProceedToStep3 = () => {
    return validationErrors.length === 0 && 
           columnMapping.date && 
           columnMapping.description && 
           columnMapping.amount
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Mapping Configuration */}
        <div className="space-y-6">
          {/* Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Templates</h3>
            <div className="space-y-2">
              {mappingTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => applyTemplate(template)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplate === template.name
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Date: Col {parseInt(template.mapping.date) + 1}, 
                    Amount: Col {parseInt(template.mapping.amount) + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Column Mapping */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Column Mapping</h3>
            
            <div className="space-y-4">
              {/* Date Column */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Column *
                </label>
                <select
                  value={columnMapping.date}
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select column...</option>
                  {csvData[0].map((header, index) => (
                    <option key={index} value={index}>
                      Column {index + 1}: {header}
                    </option>
                  ))}
                </select>
                {autoDetection.date && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className={getConfidenceColor(autoDetection.date.confidence)}>
                      {autoDetection.date.confidence}% confidence
                    </span>
                    <span className="ml-1">- {autoDetection.date.reason}</span>
                  </div>
                )}
              </div>

              {/* Description Column */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description Column *
                </label>
                <select
                  value={columnMapping.description}
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select column...</option>
                  {csvData[0].map((header, index) => (
                    <option key={index} value={index}>
                      Column {index + 1}: {header}
                    </option>
                  ))}
                </select>
                {autoDetection.description && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className={getConfidenceColor(autoDetection.description.confidence)}>
                      {autoDetection.description.confidence}% confidence
                    </span>
                    <span className="ml-1">- {autoDetection.description.reason}</span>
                  </div>
                )}
              </div>

              {/* Amount Column */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount Column *
                </label>
                <select
                  value={columnMapping.amount}
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select column...</option>
                  {csvData[0].map((header, index) => (
                    <option key={index} value={index}>
                      Column {index + 1}: {header}
                    </option>
                  ))}
                </select>
                {autoDetection.amount && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className={getConfidenceColor(autoDetection.amount.confidence)}>
                      {autoDetection.amount.confidence}% confidence
                    </span>
                    <span className="ml-1">- {autoDetection.amount.reason}</span>
                  </div>
                )}
              </div>

              {/* Source Category Column */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Source Category Column (Optional)
                </label>
                <select
                  value={columnMapping.source_category}
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, source_category: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select column...</option>
                  {csvData[0].map((header, index) => (
                    <option key={index} value={index}>
                      Column {index + 1}: {header}
                    </option>
                  ))}
                </select>
                {autoDetection.source_category && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className={getConfidenceColor(autoDetection.source_category.confidence)}>
                      {autoDetection.source_category.confidence}% confidence
                    </span>
                    <span className="ml-1">- {autoDetection.source_category.reason}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">Validation Errors:</h4>
                    <ul className="mt-1 list-disc list-inside text-sm text-red-600 dark:text-red-300">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error.message}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Preview Mapped Data
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Source Category</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Auto Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {previewData.map((row, index) => (
                  <tr key={index} className="text-sm">
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{row.date}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{row.description}</td>
                    <td className={`px-3 py-2 font-semibold ${
                      parseFloat(row.amount) >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {row.amount}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row.source_category}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded">
                        {row.auto_category}
                      </span>
                    </td>
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