'use client'

import { useState, useCallback } from 'react'
import { UploadCloud, FileText, X, Check, ArrowRight, History, Building2, CreditCard, Edit } from 'lucide-react'
import Link from 'next/link'

interface UploadedFile {
  name: string
  size: string
  sizeBytes: number
  rows: number
  status: 'processing' | 'completed'
  preview: string[][]
}

interface ValidationError {
  file: string
  errors: string[]
}

const sourceOptions = [
  {
    value: 'chase',
    label: 'Chase Bank',
    description: 'Personal & Business accounts',
    icon: Building2
  },
  {
    value: 'capital_one',
    label: 'Capital One',
    description: 'Credit cards & checking',
    icon: CreditCard
  },
  {
    value: 'manual',
    label: 'Manual Entry',
    description: 'Custom CSV format',
    icon: Edit
  }
]

export default function ImportPage() {
  const [selectedSource, setSelectedSource] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File) => {
    const errors: string[] = []
    const maxSize = 50 * 1024 * 1024 // 50MB
    
    // Check file size
    if (file.size > maxSize) {
      errors.push('File size exceeds 50MB limit')
    }
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      errors.push('Only CSV files are allowed')
    }
    
    // Check file name
    if (file.name.length > 100) {
      errors.push('File name is too long')
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  const generateFilePreview = (): string[][] => {
    return [
      ['01/20/2024', 'WALMART SUPERCENTER', '-125.43', 'FOOD_GROCERY'],
      ['01/19/2024', 'SHELL GAS STATION', '-45.00', 'GAS_STATION'],
      ['01/19/2024', 'STARBUCKS', '-6.75', 'RESTAURANT'],
      ['01/18/2024', 'TARGET', '-89.23', 'SHOPPING_GENERAL'],
      ['01/18/2024', 'NETFLIX.COM', '-15.99', 'ENTERTAINMENT']
    ]
  }

  const simulateFileProcessing = (fileData: UploadedFile) => {
    setUploadingFile(fileData.name)
    setUploadProgress(0)
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + Math.random() * 15
        if (newProgress >= 100) {
          clearInterval(progressInterval)
          
          // Complete processing
          setTimeout(() => {
            fileData.status = 'completed'
            fileData.preview = generateFilePreview()
            setUploadingFile(null)
            setUploadProgress(0)
            setUploadedFiles(prev => [...prev])
          }, 500)
          
          return 100
        }
        return newProgress
      })
    }, 200)
  }

  const processFiles = (files: FileList) => {
    setValidationErrors([])
    const newFiles: UploadedFile[] = []
    const errors: ValidationError[] = []
    
    Array.from(files).forEach(file => {
      const validation = validateFile(file)
      if (validation.valid) {
        const fileData: UploadedFile = {
          name: file.name,
          size: formatFileSize(file.size),
          sizeBytes: file.size,
          rows: Math.floor(Math.random() * 500) + 100,
          status: 'processing',
          preview: []
        }
        
        simulateFileProcessing(fileData)
        newFiles.push(fileData)
      } else {
        errors.push({
          file: file.name,
          errors: validation.errors
        })
      }
    })
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    setValidationErrors(errors)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      processFiles(files)
    }
  }

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName))
  }

  const canProceedToStep2 = () => {
    return selectedSource && uploadedFiles.length > 0 && 
           uploadedFiles.every(f => f.status === 'completed')
  }

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    processFiles(event.dataTransfer.files)
  }, [])

  return (
    <div className="py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Import Transactions</h2>
            <p className="text-gray-600 dark:text-gray-300">Upload your CSV files to get started</p>
          </div>
          <Link 
            href="/import/history" 
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center border border-gray-300 dark:border-gray-600"
          >
            <History className="w-4 h-4 mr-2" />
            Import History
          </Link>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center mt-6 mb-8">
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="rounded-full h-10 w-10 flex items-center justify-center bg-blue-500 text-white shadow-lg">1</div>
              <div className="ml-2 mr-8">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Upload</div>
              </div>
            </div>
            <div className="h-1 w-16 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center ml-8">
              <Link href="/import/step2" className="rounded-full h-10 w-10 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">2</Link>
              <div className="ml-2 mr-8">
                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Map Columns</div>
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

      {/* Step 1: Enhanced Upload Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-8">
        <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Upload Your Transaction Files</h3>
        
        {/* Source Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Data Source *</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sourceOptions.map(source => {
              const IconComponent = source.icon
              return (
                <label key={source.value} className="relative">
                  <input 
                    type="radio" 
                    value={source.value}
                    checked={selectedSource === source.value}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="peer sr-only"
                  />
                  <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 transition-colors">
                    <div className="flex items-center">
                      <IconComponent className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{source.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{source.description}</div>
                      </div>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* File Upload Area */}
        {selectedSource && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Upload CSV Files *</label>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragOver 
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center">
                <UploadCloud className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Drop your files here</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">or</p>
                
                <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
                  <span>Browse Files</span>
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    multiple 
                    accept=".csv" 
                    className="hidden"
                  />
                </label>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Supports multiple CSV files • Max 50MB per file
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadingFile && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Processing: {uploadingFile}
              </span>
              <span className="text-sm text-blue-700 dark:text-blue-400">
                {Math.round(uploadProgress)}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">File Validation Errors:</h4>
              {validationErrors.map((error, index) => (
                <div key={index} className="mb-2">
                  <div className="text-sm font-medium text-red-700 dark:text-red-400">{error.file}</div>
                  {error.errors.map((errorMsg, errorIndex) => (
                    <div key={errorIndex} className="text-sm text-red-600 dark:text-red-300 ml-4">
                      • {errorMsg}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Uploaded Files</h4>
            <div className="space-y-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="border dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{file.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <span>{file.size}</span> • 
                          <span> {file.rows} rows</span> • 
                          <span className={
                            file.status === 'completed' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-yellow-600 dark:text-yellow-400'
                          }>
                            {file.status === 'completed' ? 'Ready' : 'Processing...'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(file.name)}
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* File Preview */}
                  {file.status === 'completed' && file.preview.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sample Data:</div>
                      <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-600 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y dark:divide-gray-600">
                            <tbody>
                              {file.preview.slice(0, 3).map((row, rowIndex) => (
                                <tr key={rowIndex} className="text-sm">
                                  {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="px-3 py-1 text-gray-900 dark:text-white whitespace-nowrap">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {file.preview.length > 3 && (
                          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-600 text-xs text-gray-500 dark:text-gray-400 text-center">
                            ... and {file.rows - 3} more rows
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requirements Info */}
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">CSV File Requirements:</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Must contain columns for date, description, and amount
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Date format: MM/DD/YYYY, YYYY-MM-DD, or DD/MM/YYYY
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Amount can be positive/negative numbers
            </li>
            <li className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Multiple files must have the same column structure
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center">
          <Link
            href={canProceedToStep2() ? '/import/step2' : '#'}
            className={`px-6 py-3 text-white rounded-lg transition-colors flex items-center ${
              canProceedToStep2() 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed pointer-events-none'
            }`}
          >
            <span>Next: Map Columns</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}